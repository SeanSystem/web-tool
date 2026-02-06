import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-json';
import ReactJson from 'react-json-view';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useTheme } from '../../hooks/useTheme';
import { formatJson, minifyJson, validateJson, getJsonExample } from './jsonUtils';

interface HistoryItem {
    id: string;
    content: string;
    timestamp: number;
    size: number;
}

export function JsonTool() {
    const { isDark } = useTheme();
    const [input, setInput] = useLocalStorage('json-tool-input', '');
    const [viewMode, setViewMode] = useState<'code' | 'tree'>('code');
    const [indentation, setIndentation] = useState<2 | 4>(2);
    const [collapsed, setCollapsed] = useState<boolean | number>(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useLocalStorage<HistoryItem[]>('json-tool-history', []);
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const inputContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToTop = useCallback(() => {
        if (inputContainerRef.current) {
            inputContainerRef.current.scrollTop = 0;
        }
    }, []);

    // Parse input for tree view
    const parsedData = useMemo(() => {
        try {
            return input ? JSON.parse(input) : null;
        } catch {
            return null;
        }
    }, [input]);

    const addToHistory = useCallback((content: string) => {
        if (!content || content.trim() === '' || content.trim() === '{}' || content.trim() === '[]') return;

        setHistory(prev => {
            if (prev.length > 0) {
                try {
                    const currentData = JSON.parse(content);
                    const lastData = JSON.parse(prev[0].content);

                    // If the data content is identical (ignoring whitespace differences)
                    if (JSON.stringify(currentData) === JSON.stringify(lastData)) {
                        // If the string is also identical, skip entirely
                        if (prev[0].content === content) return prev;

                        // Data is the same but formatting is different (e.g., Format vs Minify).
                        // Update the last entry with the new content and timestamp.
                        const updatedItem: HistoryItem = {
                            ...prev[0],
                            content,
                            timestamp: Date.now(),
                            size: new Blob([content]).size,
                        };
                        return [updatedItem, ...prev.slice(1)];
                    }
                } catch {
                    // If parsing fails for either, fall back to literal string comparison
                    if (prev[0].content === content) return prev;
                }
            }

            const newItem: HistoryItem = {
                id: Date.now().toString(36) + Math.random().toString(36).substring(2),
                content,
                timestamp: Date.now(),
                size: new Blob([content]).size,
            };

            // Keep last 50 items
            return [newItem, ...prev].slice(0, 50);
        });
    }, [setHistory]);

    // Auto-save valid JSON after 2 seconds of inactivity
    useEffect(() => {
        if (!input || input.trim().length < 2) return;

        const timer = setTimeout(() => {
            try {
                // Only save if it's valid JSON
                JSON.parse(input);
                addToHistory(input);
            } catch {
                // Not valid JSON, don't save
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [input, addToHistory]);

    const handleFormat = useCallback(() => {
        const result = formatJson(input);
        if (result.success) {
            setInput(result.result);
            setError(null);
            toast.success('JSON 格式化成功');
            addToHistory(result.result);
            scrollToTop();
        } else {
            setError(result.error || '无效的 JSON');
            toast.error('无效的 JSON');
        }
    }, [input, setInput, addToHistory, scrollToTop]);

    const handleMinify = useCallback(() => {
        const result = minifyJson(input);
        if (result.success) {
            setInput(result.result);
            setError(null);
            toast.success('JSON 压缩成功');
            addToHistory(result.result);
            scrollToTop();
        } else {
            setError(result.error || '无效的 JSON');
            toast.error('无效的 JSON');
        }
    }, [input, setInput, addToHistory, scrollToTop]);

    const handleValidate = useCallback(() => {
        const result = validateJson(input);
        if (result.valid) {
            setError(null);
            toast.success('JSON 格式有效 ✓');
            addToHistory(input);
        } else {
            setError(result.error || '无效的 JSON');
            toast.error('无效的 JSON');
        }
    }, [input, addToHistory]);

    const handleCopy = useCallback(async (contentToCopy?: string) => {
        const text = contentToCopy ?? input;
        if (!text) {
            toast.error('没有可复制的内容');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            toast.success('已复制到剪贴板');
        } catch {
            toast.error('复制失败');
        }
    }, [input]);

    const handleClear = useCallback(() => {
        setInput('');
        setError(null);
        toast.success('已清空');
        scrollToTop();
    }, [setInput, scrollToTop]);

    const handleExample = useCallback(() => {
        const example = getJsonExample();
        setInput(example);
        setError(null);
        toast.success('示例 JSON 已加载');
        scrollToTop();
    }, [setInput, scrollToTop]);

    const handleDownload = useCallback(() => {
        if (!input) return;
        const blob = new Blob([input], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('已开始下载');
    }, [input]);

    const handleIndentChange = (newIndent: 2 | 4) => {
        setIndentation(newIndent);
        try {
            const parsed = JSON.parse(input);
            setInput(JSON.stringify(parsed, null, newIndent));
        } catch {
            // If invalid, just change preference
        }
    };

    const clearHistory = useCallback(() => {
        setHistory([]);
        toast.success('历史记录已清空');
    }, [setHistory]);

    const deleteHistoryItem = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setHistory(prev => prev.filter(item => item.id !== id));
        toast.success('已删除');
    }, [setHistory]);

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setInput(content);
            toast.success('文件加载成功');
            scrollToTop();

            // Reset file input value so same file can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };
        reader.onerror = () => {
            toast.error('读取文件失败');
        };
        reader.readAsText(file);
    };

    const formatTime = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        return new Date(timestamp).toLocaleDateString();
    };

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Error display */}
            {error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-[var(--error-color)] text-sm flex justify-between items-center">
                    <span><strong>错误：</strong> {error}</span>
                    <button onClick={() => setError(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">&times;</button>
                </div>
            )}

            <div className="flex flex-1 min-h-0 gap-4">
                {/* Left Sidebar: History */}
                {sidebarVisible && (
                    <div className="w-72 flex flex-col bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden animate-in slide-in-from-left duration-200">
                        <div className="px-4 h-12 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
                            <span className="text-sm font-semibold text-[var(--text-secondary)]">历史记录</span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setHistory([...history])} // Force refresh
                                    className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded"
                                    title="刷新"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                                <button
                                    onClick={clearHistory}
                                    className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--error-color)] hover:bg-[var(--bg-tertiary)] rounded"
                                    title="清空历史"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-2 space-y-2">
                            {history.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] p-4 text-center">
                                    <p className="text-xs">暂无历史记录</p>
                                </div>
                            ) : (
                                history.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            setInput(item.content);
                                            scrollToTop();
                                        }}
                                        className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg hover:border-[var(--accent-color)] cursor-pointer transition-all group relative"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-medium text-[var(--text-primary)]">{formatTime(item.timestamp)}</span>
                                            <button
                                                onClick={(e) => deleteHistoryItem(item.id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-[var(--error-color)] transition-opacity"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                                            <span>{new Date(item.timestamp).toLocaleString()}</span>
                                            <span>•</span>
                                            <span>{formatSize(item.size)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-3 bg-orange-500/5 border-t border-[var(--border-color)]">
                            <p className="text-[10px] text-orange-500/80 leading-relaxed">
                                历史记录的数据只存于用户浏览器，不会上传服务器。
                            </p>
                        </div>
                    </div>
                )}

                {/* Main Content Area - Split View */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
                    {/* Left Panel: Input */}
                    <div className="tool-panel flex flex-col flex-1 min-h-0 overflow-hidden">
                        <div className="px-4 h-12 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSidebarVisible(!sidebarVisible)}
                                    className={`p-1.5 rounded-lg transition-colors ${sidebarVisible ? 'bg-[var(--accent-color)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--border-color)]'}`}
                                    title={sidebarVisible ? "隐藏历史" : "显示历史"}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
                                <span className="text-sm font-semibold text-[var(--text-secondary)]">输入</span>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-1.5 ml-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded"
                                    title="上传文件"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleCopy(input)}
                                    className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded"
                                    title="复制输入内容"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8a2 2 0 012 2v8m-2-10V5a2 2 0 00-2-2H8m0 0H6a2 2 0 00-2 2v10a2 2 0 002 2h2" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleExample}
                                    className="px-2 py-1 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] rounded transition-colors flex items-center gap-1"
                                    title="加载示例"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span className="hidden sm:inline">示例</span>
                                </button>
                                <button
                                    onClick={handleValidate}
                                    className="px-2 py-1 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] rounded transition-colors"
                                >
                                    校验
                                </button>
                                <button
                                    onClick={handleClear}
                                    className="px-2 py-1 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--error-color)] rounded transition-colors"
                                >
                                    清空
                                </button>
                                <div className="w-px h-4 bg-[var(--border-color)] self-center mx-1"></div>
                                <button
                                    onClick={handleFormat}
                                    className="px-2 py-1 text-xs bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] rounded transition-colors"
                                >
                                    格式化
                                </button>
                                <button
                                    onClick={handleMinify}
                                    className="px-2 py-1 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] rounded transition-colors"
                                >
                                    压缩
                                </button>
                            </div>
                        </div>
                        <div
                            ref={inputContainerRef}
                            className="flex-1 overflow-auto font-mono-custom bg-transparent"
                            onPaste={() => {
                                // Defer scroll to top to allow paste to happen and React to update
                                requestAnimationFrame(() => {
                                    scrollToTop();
                                });
                            }}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                accept=".json,application/json"
                            />
                            <Editor
                                value={input}
                                onValueChange={code => setInput(code)}
                                highlight={code => highlight(code, languages.json, 'json')}
                                padding={20}
                                className="min-h-full"
                                style={{
                                    fontFamily: '"JetBrains Mono", monospace',
                                    fontSize: 13,
                                    minHeight: '100%',
                                }}
                            />
                        </div>
                    </div>

                    {/* Right Panel: Output/Preview */}
                    <div className="tool-panel flex flex-col flex-1 min-h-0 overflow-hidden">
                        <div className="px-4 h-12 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-semibold text-[var(--text-secondary)]">查看器</span>
                                <div className="flex bg-[var(--bg-tertiary)] p-0.5 rounded-lg border border-[var(--border-color)]">
                                    <button
                                        onClick={() => setViewMode('code')}
                                        className={`px-3 py-1 text-xs rounded-md transition-all ${viewMode === 'code' ? 'bg-[var(--accent-color)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                    >
                                        代码
                                    </button>
                                    <button
                                        onClick={() => setViewMode('tree')}
                                        className={`px-3 py-1 text-xs rounded-md transition-all ${viewMode === 'tree' ? 'bg-[var(--accent-color)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                    >
                                        树状
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mr-2">
                                    <select
                                        value={indentation}
                                        onChange={(e) => handleIndentChange(Number(e.target.value) as 2 | 4)}
                                        className="px-2 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded hover:border-[var(--accent-color)] focus:outline-none transition-colors"
                                        title="缩进设置"
                                    >
                                        <option value={2}>2 空格</option>
                                        <option value={4}>4 空格</option>
                                    </select>
                                </div>

                                {viewMode === 'tree' && parsedData && (
                                    <div className="flex gap-1 mr-2">
                                        <button
                                            onClick={() => setCollapsed(false)}
                                            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded"
                                            title="全展开"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setCollapsed(true)}
                                            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded"
                                            title="全折叠"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4l5 5m11-5l-5 5m5 5l-5-5m-11 5l5-5m-5 5v4m0-4h4m12 0v4m0-4h-4" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                                <div className="w-px h-4 bg-[var(--border-color)] self-center mx-1"></div>
                                <button
                                    onClick={() => handleCopy()}
                                    className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded"
                                    title="复制结果"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded"
                                    title="下载 JSON"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto bg-[var(--bg-primary)]/30">
                            {viewMode === 'code' ? (
                                <div className="h-full font-mono-custom">
                                    <Editor
                                        value={parsedData ? JSON.stringify(parsedData, null, indentation) : input}
                                        onValueChange={() => { }} // Read-only
                                        highlight={code => highlight(code, languages.json, 'json')}
                                        padding={20}
                                        style={{
                                            fontFamily: '"JetBrains Mono", monospace',
                                            fontSize: 13,
                                            minHeight: '100%',
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="p-4">
                                    {parsedData ? (
                                        <ReactJson
                                            src={parsedData}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            theme={(isDark ? 'ocean' : 'rhea') as any}
                                            iconStyle="triangle"
                                            collapsed={collapsed}
                                            displayDataTypes={false}
                                            displayObjectSize={true}
                                            enableClipboard={false}
                                            name={false}
                                            onEdit={(edit) => {
                                                const newContent = JSON.stringify(edit.updated_src, null, indentation);
                                                setInput(newContent);
                                                addToHistory(newContent);
                                            }}
                                            onDelete={(del) => {
                                                const newContent = JSON.stringify(del.updated_src, null, indentation);
                                                setInput(newContent);
                                                addToHistory(newContent);
                                            }}
                                            onAdd={(add) => {
                                                const newContent = JSON.stringify(add.updated_src, null, indentation);
                                                setInput(newContent);
                                                addToHistory(newContent);
                                            }}
                                        />
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] p-8 text-center mt-10">
                                            <svg className="w-12 h-12 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p>无效的 JSON，无法显示树视图。</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
