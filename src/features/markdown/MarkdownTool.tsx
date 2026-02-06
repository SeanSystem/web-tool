import { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { toast } from 'sonner';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { readMarkdownFile, getMarkdownExample } from './markdownUtils';
import 'highlight.js/styles/github-dark.css';

export function MarkdownTool() {
    const [savedInput, setSavedInput] = useLocalStorage('markdown-tool-input', '');
    const [input, setInput] = useState(savedInput);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    // Save to localStorage when input changes
    useEffect(() => {
        setSavedInput(input);
    }, [input, setSavedInput]);

    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const content = await readMarkdownFile(file);
            setInput(content);
            toast.success(`已加载：${file.name}`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : '文件加载失败');
        }

        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const handleCopyMarkdown = useCallback(async () => {
        if (!input) {
            toast.error('没有可复制的内容');
            return;
        }

        try {
            await navigator.clipboard.writeText(input);
            toast.success('Markdown 已复制到剪贴板');
        } catch {
            toast.error('复制失败');
        }
    }, [input]);

    const handleCopyHtml = useCallback(async () => {
        if (!previewRef.current) {
            toast.error('没有可复制的内容');
            return;
        }

        try {
            const html = previewRef.current.innerHTML;
            await navigator.clipboard.writeText(html);
            toast.success('HTML 已复制到剪贴板');
        } catch {
            toast.error('复制失败');
        }
    }, []);

    const handleClear = useCallback(() => {
        setInput('');
        toast.success('已清空');
    }, []);

    const handleExample = useCallback(() => {
        setInput(getMarkdownExample());
        toast.success('示例 Markdown 已加载');
    }, []);

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Toolbar */}
            {/* Toolbar removed */}

            {/* Editor and Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
                {/* Input panel */}
                <div className="tool-panel flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className="px-4 py-2 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
                        <span className="text-sm font-semibold text-[var(--text-secondary)]">编辑器</span>
                        <div className="flex gap-2 items-center">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".md,.markdown"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="markdown-file-input"
                            />
                            <label
                                htmlFor="markdown-file-input"
                                className="px-2 py-1 text-xs bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] rounded transition-colors cursor-pointer flex items-center gap-1"
                                title="上传 .md 文件"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <span className="hidden sm:inline">上传</span>
                            </label>
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
                            <div className="w-px h-4 bg-[var(--border-color)] self-center mx-1"></div>
                            <button
                                onClick={handleCopyMarkdown}
                                className="px-2 py-1 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] rounded transition-colors"
                                title="复制 Markdown"
                            >
                                复制 MD
                            </button>
                            <button
                                onClick={handleClear}
                                className="px-2 py-1 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--error-color)] rounded transition-colors"
                            >
                                清空
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="在此输入 Markdown 或上传 .md 文件..."
                        className="flex-1 p-4 bg-transparent resize-none code-input focus:outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] overflow-auto"
                        spellCheck={false}
                    />
                </div>

                {/* Preview panel */}
                <div className="tool-panel flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className="px-4 py-2 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
                        <span className="text-sm font-semibold text-[var(--text-secondary)]">预览</span>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCopyHtml}
                                className="px-2 py-1 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] rounded transition-colors"
                            >
                                复制 HTML
                            </button>
                        </div>
                    </div>
                    <div
                        ref={previewRef}
                        className="flex-1 p-4 overflow-auto markdown-preview"
                    >
                        {input ? (
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeHighlight]}
                            >
                                {input}
                            </ReactMarkdown>
                        ) : (
                            <span className="text-[var(--text-muted)]">预览内容将显示在这里...</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
