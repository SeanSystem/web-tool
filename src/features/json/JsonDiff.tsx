import { useMemo, useState, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-json';
import { toast } from 'sonner';

type LineStatus = 'unchanged' | 'added' | 'removed' | 'modified';

interface LineDiffResult {
    oldStatuses: LineStatus[];
    newStatuses: LineStatus[];
}

function computeLineDiff(oldText: string, newText: string): LineDiffResult {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');

    const oldTrimmed = oldLines.map(line => line.replace(/\s+$/g, ''));
    const newTrimmed = newLines.map(line => line.replace(/\s+$/g, ''));

    const n = oldTrimmed.length;
    const m = newTrimmed.length;

    // LCS matrix
    const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            if (oldTrimmed[i - 1] === newTrimmed[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    type Op =
        | { type: 'equal'; oldIndex: number; newIndex: number }
        | { type: 'remove'; oldIndex: number }
        | { type: 'add'; newIndex: number }
        | { type: 'modify'; oldIndex: number; newIndex: number };

    const ops: Op[] = [];
    let i = n;
    let j = m;

    while (i > 0 && j > 0) {
        if (oldTrimmed[i - 1] === newTrimmed[j - 1]) {
            ops.push({ type: 'equal', oldIndex: i - 1, newIndex: j - 1 });
            i--;
            j--;
        } else if (dp[i - 1][j - 1] >= dp[i - 1][j] && dp[i - 1][j - 1] >= dp[i][j - 1]) {
            // Treat as a modification when diagonal move is not worse
            ops.push({ type: 'modify', oldIndex: i - 1, newIndex: j - 1 });
            i--;
            j--;
        } else if (dp[i - 1][j] >= dp[i][j - 1]) {
            ops.push({ type: 'remove', oldIndex: i - 1 });
            i--;
        } else {
            ops.push({ type: 'add', newIndex: j - 1 });
            j--;
        }
    }

    while (i > 0) {
        ops.push({ type: 'remove', oldIndex: i - 1 });
        i--;
    }

    while (j > 0) {
        ops.push({ type: 'add', newIndex: j - 1 });
        j--;
    }

    ops.reverse();

    const oldStatuses: LineStatus[] = new Array(n).fill('unchanged');
    const newStatuses: LineStatus[] = new Array(m).fill('unchanged');

    for (const op of ops) {
        if (op.type === 'equal') {
            oldStatuses[op.oldIndex] = 'unchanged';
            newStatuses[op.newIndex] = 'unchanged';
        } else if (op.type === 'remove') {
            oldStatuses[op.oldIndex] = 'removed';
        } else if (op.type === 'add') {
            newStatuses[op.newIndex] = 'added';
        } else if (op.type === 'modify') {
            oldStatuses[op.oldIndex] = 'modified';
            newStatuses[op.newIndex] = 'modified';
        }
    }

    return { oldStatuses, newStatuses };
}

export function JsonDiff() {
    const [oldJson, setOldJson] = useState('');
    const [newJson, setNewJson] = useState('');

    const { oldStatuses, newStatuses } = useMemo(
        () => computeLineDiff(oldJson, newJson),
        [oldJson, newJson],
    );

    // Group contiguous changes into unified diff groups for navigation and merge
    const diffGroups = useMemo(() => {
        const groups: {
            type: 'added' | 'removed' | 'modified';
            oldRange: { start: number; end: number };
            newRange: { start: number; end: number };
        }[] = [];

        // This is a simplified alignment based on the ops. 
        // For the merge feature, we need to know which lines in old map to which lines in new.
        // Let's re-run a simplified grouping based on the statuses.
        
        let oldIdx = 0;
        let newIdx = 0;
        
        while (oldIdx < oldStatuses.length || newIdx < newStatuses.length) {
            if (oldStatuses[oldIdx] === 'unchanged' && newStatuses[newIdx] === 'unchanged') {
                oldIdx++;
                newIdx++;
                continue;
            }

            const startOld = oldIdx;
            const startNew = newIdx;
            let type: 'added' | 'removed' | 'modified' = 'modified';

            // Collect contiguous changes
            if (oldStatuses[oldIdx] === 'removed' && (newStatuses[newIdx] === 'unchanged' || newIdx >= newStatuses.length)) {
                type = 'removed';
                while (oldIdx < oldStatuses.length && oldStatuses[oldIdx] === 'removed') oldIdx++;
            } else if (newStatuses[newIdx] === 'added' && (oldStatuses[oldIdx] === 'unchanged' || oldIdx >= oldStatuses.length)) {
                type = 'added';
                while (newIdx < newStatuses.length && newStatuses[newIdx] === 'added') newIdx++;
            } else {
                type = 'modified';
                // A modification can be a mix of removed then added, or just modified status
                while (oldIdx < oldStatuses.length && (oldStatuses[oldIdx] === 'removed' || oldStatuses[oldIdx] === 'modified')) oldIdx++;
                while (newIdx < newStatuses.length && (newStatuses[newIdx] === 'added' || newStatuses[newIdx] === 'modified')) newIdx++;
            }

            groups.push({
                type,
                oldRange: { start: startOld, end: oldIdx - 1 },
                newRange: { start: startNew, end: newIdx - 1 }
            });
        }

        return groups;
    }, [oldStatuses, newStatuses]);

    const [currentDiffIndex, setCurrentDiffIndex] = useState(-1);

    const scrollToDiff = (index: number) => {
        const group = diffGroups[index];
        if (!group) return;

        // Scroll the old side for removals/modifications, new side for additions
        const side = group.type === 'added' ? 'new' : 'old';
        const lineIndex = group.type === 'added' ? group.newRange.start : group.oldRange.start;
        
        const elementId = `diff-${side}-${lineIndex}`;
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handlePrevDiff = () => {
        if (diffGroups.length === 0) return;
        const newIndex = currentDiffIndex <= 0 ? diffGroups.length - 1 : currentDiffIndex - 1;
        setCurrentDiffIndex(newIndex);
        scrollToDiff(newIndex);
    };

    const handleNextDiff = () => {
        if (diffGroups.length === 0) return;
        const newIndex = (currentDiffIndex + 1) % diffGroups.length;
        setCurrentDiffIndex(newIndex);
        scrollToDiff(newIndex);
    };

    const handleMerge = (groupIndex: number) => {
        const group = diffGroups[groupIndex];
        if (!group) return;

        const oldLines = oldJson.split('\n');
        const newLines = newJson.split('\n');

        // Extract the new lines for this range
        const replacementLines = group.newRange.start > group.newRange.end 
            ? [] 
            : newLines.slice(group.newRange.start, group.newRange.end + 1);

        // Replace the old lines
        const updatedOldLines = [
            ...oldLines.slice(0, group.oldRange.start),
            ...replacementLines,
            ...oldLines.slice(group.oldRange.end + 1)
        ];

        setOldJson(updatedOldLines.join('\n'));
        toast.success('已应用更改');
    };

    // Scroll Sync Refs
    const oldEditorRef = useRef<HTMLDivElement>(null);
    const newEditorRef = useRef<HTMLDivElement>(null);
    const gutterRef = useRef<HTMLDivElement>(null);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>, source: 'old' | 'new') => {
        const target = source === 'old' ? newEditorRef.current : oldEditorRef.current;
        if (target) {
            target.scrollTop = e.currentTarget.scrollTop;
            target.scrollLeft = e.currentTarget.scrollLeft;
        }
        if (gutterRef.current) {
            gutterRef.current.scrollTop = e.currentTarget.scrollTop;
        }
    };

    const highlightWithDiff = (code: string, side: 'old' | 'new') => {
        const statuses = side === 'old' ? oldStatuses : newStatuses;
        const lines = code.split('\n');

        return lines
            .map((line, index) => {
                const status = statuses[index] ?? 'unchanged';
                const lineHtml = highlight(line, languages.json, 'json');
                const isCurrent = currentDiffIndex >= 0 && 
                                  ((side === 'old' && diffGroups[currentDiffIndex]?.oldRange.start === index) ||
                                   (side === 'new' && diffGroups[currentDiffIndex]?.newRange.start === index));
                
                const cls = `diff-line diff-line-${status} ${isCurrent ? 'diff-line-active' : ''}`;
                const content = lineHtml || '&nbsp;';
                const id = `diff-${side}-${index}`;
                return `<div id="${id}" class="${cls}">${content}</div>`;
            })
            .join('');
    };

    const handleFormat = (type: 'old' | 'new') => {
        try {
            const input = type === 'old' ? oldJson : newJson;
            if (!input.trim()) return;
            const parsed = JSON.parse(input);
            const formatted = JSON.stringify(parsed, null, 2);
            if (type === 'old') setOldJson(formatted);
            else setNewJson(formatted);
            toast.success('格式化成功');
        } catch {
            toast.error('无效的 JSON');
        }
    };


    return (
        <div className="h-full flex flex-col gap-4">
            {/* Diff summary */}
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-[var(--text-secondary)] px-1 sm:px-0">
                <span className="font-medium text-[var(--text-secondary)]">对比结果</span>
                <div className="flex items-center gap-3">
                    {diffGroups.length > 0 && (
                        <div className="flex items-center bg-[var(--bg-tertiary)] rounded-md border border-[var(--border-color)] overflow-hidden mr-2">
                            <button
                                onClick={handlePrevDiff}
                                className="p-1 hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                title="上一个差异"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                            <span className="px-2 py-0.5 border-x border-[var(--border-color)] text-[10px] font-medium min-w-[45px] text-center">
                                {currentDiffIndex + 1} / {diffGroups.length}
                            </span>
                            <button
                                onClick={handleNextDiff}
                                className="p-1 hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                title="下一个差异"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
                    )}
                    <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                        新增行：{newStatuses.filter(status => status === 'added').length}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500/80" />
                        删除行：{oldStatuses.filter(status => status === 'removed').length}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500/80" />
                        修改行：{Math.max(
                            oldStatuses.filter(status => status === 'modified').length,
                            newStatuses.filter(status => status === 'modified').length,
                        )}
                    </span>
                </div>
            </div>

            <div className="flex flex-1 min-h-0 gap-0">
                {/* Old JSON Input */}
                <div className="tool-panel flex flex-col overflow-hidden flex-1 border-r-0 rounded-r-none">
                    <div className="px-4 h-10 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
                        <span className="text-sm font-semibold text-[var(--text-secondary)]">原 JSON</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleFormat('old')}
                                className="px-2 py-0.5 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] rounded transition-colors"
                            >
                                格式化
                            </button>
                            <button
                                onClick={() => setOldJson('')}
                                className="px-2 py-0.5 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--error-color)] rounded transition-colors"
                            >
                                清空
                            </button>
                        </div>
                    </div>
                    <div 
                        className="flex-1 overflow-auto font-mono-custom bg-transparent"
                        ref={oldEditorRef}
                        onScroll={(e) => handleScroll(e, 'old')}
                    >
                        <Editor
                            value={oldJson}
                            onValueChange={code => setOldJson(code)}
                            highlight={code => highlightWithDiff(code, 'old')}
                            padding={15}
                            style={{
                                fontFamily: '"JetBrains Mono", monospace',
                                fontSize: 13,
                                minHeight: '100%',
                            }}
                        />
                    </div>
                </div>

                {/* Middle Merge Gutter */}
                <div className="merge-gutter hidden lg:flex flex-col">
                    <div className="h-10 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50" />
                    <div 
                        className="flex-1 overflow-hidden relative"
                        ref={gutterRef}
                    >
                        {/* We use absolute positioning based on line height (approx 20px) */}
                        <div className="absolute inset-0">
                            {diffGroups.map((group, idx) => {
                                const lineHeight = 20; // Matches CSS min-height
                                const startLine = Math.min(group.oldRange.start, group.newRange.start);
                                const endLine = Math.max(group.oldRange.end, group.newRange.end);
                                const count = endLine - startLine + 1;
                                
                                return (
                                    <div 
                                        key={idx}
                                        style={{
                                            position: 'absolute',
                                            top: (startLine * lineHeight) + 15, // 15 is padding
                                            height: count * lineHeight,
                                            left: 0,
                                            right: 0
                                        }}
                                    >
                                        <div className="merge-bracket" style={{ height: '100%' }} />
                                        <button
                                            className="merge-button"
                                            onClick={() => handleMerge(idx)}
                                            title="合并到左侧"
                                        >
                                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* New JSON Input */}
                <div className="tool-panel flex flex-col overflow-hidden flex-1 border-l-0 rounded-l-none">
                    <div className="px-4 h-10 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
                        <span className="text-sm font-semibold text-[var(--text-secondary)]">新 JSON</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleFormat('new')}
                                className="px-2 py-0.5 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] rounded transition-colors"
                            >
                                格式化
                            </button>
                            <button
                                onClick={() => setNewJson('')}
                                className="px-2 py-0.5 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--error-color)] rounded transition-colors"
                            >
                                清空
                            </button>
                        </div>
                    </div>
                    <div 
                        className="flex-1 overflow-auto font-mono-custom bg-transparent"
                        ref={newEditorRef}
                        onScroll={(e) => handleScroll(e, 'new')}
                    >
                        <Editor
                            value={newJson}
                            onValueChange={code => setNewJson(code)}
                            highlight={code => highlightWithDiff(code, 'new')}
                            padding={15}
                            style={{
                                fontFamily: '"JetBrains Mono", monospace',
                                fontSize: 13,
                                minHeight: '100%',
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
