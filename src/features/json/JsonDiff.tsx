import { useMemo, useState } from 'react';
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

    const highlightWithDiff = (code: string, side: 'old' | 'new') => {
        const statuses = side === 'old' ? oldStatuses : newStatuses;
        const lines = code.split('\n');

        return lines
            .map((line, index) => {
                const status = statuses[index] ?? 'unchanged';
                const lineHtml = highlight(line, languages.json, 'json');
                const cls = `diff-line diff-line-${status}`;
                const content = lineHtml || '&nbsp;';
                return `<div class="${cls}">${content}</div>`;
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

    const newStyles = {
        variables: {
            dark: {
                diffViewerBackground: '#1e1e1e',
                diffViewerColor: '#FFF',
                addedBackground: '#044B53',
                addedColor: 'white',
                removedBackground: '#632F34',
                removedColor: 'white',
                wordAddedBackground: '#055d67',
                wordRemovedBackground: '#7d383f',
                addedGutterBackground: '#034148',
                removedGutterBackground: '#632b30',
                gutterBackground: '#1e1e1e',
                gutterBackgroundDark: '#262626',
                highlightBackground: '#2a3942',
                highlightGutterBackground: '#2a3942',
                codeFoldGutterBackground: '#21232b',
                codeFoldBackground: '#262831',
                emptyLineBackground: '#363946',
                gutterColor: '#464c67',
                addedGutterColor: '#8c8c8c',
                removedGutterColor: '#8c8c8c',
                codeFoldContentColor: '#555a7b',
                diffViewerTitleBackground: '#2f323e',
                diffViewerTitleColor: '#555a7b',
                diffViewerTitleBorderColor: '#353846',
            },
            light: {
                diffViewerBackground: '#fff',
                diffViewerColor: '#212121',
                addedBackground: '#e6ffed',
                addedColor: '#24292e',
                removedBackground: '#ffeef0',
                removedColor: '#24292e',
                wordAddedBackground: '#acf2bd',
                wordRemovedBackground: '#fdb8c0',
                addedGutterBackground: '#cdffd8',
                removedGutterBackground: '#ffdce0',
                gutterBackground: '#f7f7f7',
                gutterBackgroundDark: '#f3f1f1',
                highlightBackground: '#fffbdd',
                highlightGutterBackground: '#fff5b1',
                codeFoldGutterBackground: '#dbedff',
                codeFoldBackground: '#f1f8ff',
                emptyLineBackground: '#fafbfc',
                gutterColor: '#212121',
                addedGutterColor: '#212121',
                removedGutterColor: '#212121',
                codeFoldContentColor: '#212121',
                diffViewerTitleBackground: '#fafbfc',
                diffViewerTitleColor: '#212121',
                diffViewerTitleBorderColor: '#eee',
            }
        }
    };

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Diff summary */}
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-[var(--text-secondary)] px-1 sm:px-0">
                <span className="font-medium text-[var(--text-secondary)]">对比结果</span>
                <div className="flex items-center gap-3">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
                {/* Old JSON Input */}
                <div className="tool-panel flex flex-col overflow-hidden">
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
                    <div className="flex-1 overflow-auto font-mono-custom bg-transparent">
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

                {/* New JSON Input */}
                <div className="tool-panel flex flex-col overflow-hidden">
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
                    <div className="flex-1 overflow-auto font-mono-custom bg-transparent">
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
