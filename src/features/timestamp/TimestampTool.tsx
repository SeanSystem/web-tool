import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import {
    detectTimestampUnit,
    timestampToDate,
    dateToTimestamp,
    getCurrentTimestamp,
    formatDatetimeLocal,
    isValidTimestamp,
} from './timeUtils';

interface SavedState {
    timestampInput: string;
    datetimeInput: string;
}

export function TimestampTool() {
    const [savedState, setSavedState] = useLocalStorage<SavedState>('timestamp-tool-state', {
        timestampInput: '',
        datetimeInput: '',
    });

    const [timestampInput, setTimestampInput] = useState(savedState.timestampInput);
    const [datetimeInput, setDatetimeInput] = useState(savedState.datetimeInput);
    const [unit, setUnit] = useState<'auto' | 'seconds' | 'milliseconds'>('auto');

    // Computed values for timestamp conversion
    const [tsResult, setTsResult] = useState<{
        local: string;
        utc: string;
        seconds: number;
        milliseconds: number;
    } | null>(null);

    // Computed values for datetime conversion
    const [dtResult, setDtResult] = useState<{
        seconds: number;
        milliseconds: number;
    } | null>(null);

    const [error, setError] = useState<string | null>(null);

    // Save to localStorage when inputs change
    useEffect(() => {
        setSavedState({ timestampInput, datetimeInput });
    }, [timestampInput, datetimeInput, setSavedState]);

    // Convert timestamp when input changes
    useEffect(() => {
        if (!timestampInput.trim()) {
            setTsResult(null);
            setError(null);
            return;
        }

        const numericValue = timestampInput.replace(/\D/g, '');
        if (!numericValue) {
            setTsResult(null);
            setError('请输入有效的数字时间戳');
            return;
        }

        const ts = parseInt(numericValue, 10);
        if (isNaN(ts)) {
            setTsResult(null);
            setError('无效的时间戳');
            return;
        }

        let isMs = false;
        if (unit === 'auto') {
            const detected = detectTimestampUnit(numericValue);
            if (detected === 'unknown') {
                setError(`时间戳长度模糊 (${numericValue.length} 位)，请选择秒或毫秒`);
                isMs = numericValue.length > 10;
            } else {
                isMs = detected === 'milliseconds';
                setError(null);
            }
        } else {
            isMs = unit === 'milliseconds';
            setError(null);
        }

        if (!isValidTimestamp(numericValue)) {
            setTsResult(null);
            setError('时间戳超出有效范围 (1970-2100)');
            return;
        }

        const result = timestampToDate(ts, isMs);
        const timestamps = dateToTimestamp(result.date);

        setTsResult({
            local: result.local,
            utc: result.utc,
            ...timestamps,
        });
    }, [timestampInput, unit]);

    // Convert datetime when input changes
    useEffect(() => {
        if (!datetimeInput) {
            setDtResult(null);
            return;
        }

        const date = new Date(datetimeInput);
        if (isNaN(date.getTime())) {
            setDtResult(null);
            return;
        }

        const result = dateToTimestamp(date);
        setDtResult(result);
    }, [datetimeInput]);

    const handleUseCurrentTime = useCallback(() => {
        const current = getCurrentTimestamp();
        setTimestampInput(String(current.seconds));
        setDatetimeInput(current.localDatetime);
        toast.success('已应用当前时间');
    }, []);

    const handleCopy = useCallback(async (value: string, label: string) => {
        try {
            await navigator.clipboard.writeText(value);
            toast.success(`${label}已复制`);
        } catch {
            toast.error('复制失败');
        }
    }, []);

    const handleClear = useCallback(() => {
        setTimestampInput('');
        setDatetimeInput('');
        setTsResult(null);
        setDtResult(null);
        setError(null);
        toast.success('已清空');
    }, []);

    const handleExample = useCallback(() => {
        // Use a specific example timestamp
        setTimestampInput('1704067200');
        setUnit('auto');
        toast.success('示例时间戳已加载 (2024-01-01 00:00:00 UTC)');
    }, []);

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Toolbar */}
            {/* Toolbar removed */}

            {/* Error display */}
            {error && (
                <div className="px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-[var(--warning-color)] text-sm">
                    <strong>提示：</strong> {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Timestamp to Date */}
                {/* Timestamp to Date */}
                <div className="tool-panel flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className="px-4 py-2 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
                        <span className="text-sm font-semibold text-[var(--text-secondary)]">时间戳 → 日期时间</span>
                        <div className="flex gap-2">
                            <button
                                onClick={handleUseCurrentTime}
                                className="px-2 py-1 text-xs bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] rounded transition-colors flex items-center gap-1"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                当前
                            </button>
                            <button
                                onClick={handleExample}
                                className="px-2 py-1 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] rounded transition-colors flex items-center gap-1"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                示例
                            </button>
                            <button
                                onClick={handleClear}
                                className="px-2 py-1 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--error-color)] rounded transition-colors"
                            >
                                清空
                            </button>
                        </div>
                    </div>
                    <div className="p-4 space-y-4 flex-1 overflow-auto">

                        {/* Timestamp input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[var(--text-secondary)]">
                                时间戳
                            </label>
                            <input
                                type="text"
                                value={timestampInput}
                                onChange={(e) => setTimestampInput(e.target.value)}
                                placeholder="输入时间戳（例如 1704067200）"
                                className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                            />
                        </div>

                        {/* Unit selector */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[var(--text-secondary)]">
                                单位
                            </label>
                            <div className="flex gap-2">
                                {(['auto', 'seconds', 'milliseconds'] as const).map((u) => (
                                    <button
                                        key={u}
                                        onClick={() => setUnit(u)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${unit === u
                                            ? 'bg-[var(--accent-color)] text-white'
                                            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                                            }`}
                                    >
                                        {u === 'auto' ? '自动识别' : u === 'seconds' ? '秒' : '毫秒'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Results */}
                        {tsResult && (
                            <div className="space-y-3 pt-2">
                                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-[var(--text-secondary)]">本地时间</span>
                                        <button
                                            onClick={() => handleCopy(tsResult.local, '本地时间')}
                                            className="text-xs px-2 py-1 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] rounded transition-colors"
                                        >
                                            复制
                                        </button>
                                    </div>
                                    <p className="font-mono text-[var(--text-primary)]">{tsResult.local}</p>
                                </div>

                                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-[var(--text-secondary)]">UTC 时间</span>
                                        <button
                                            onClick={() => handleCopy(tsResult.utc, 'UTC 时间')}
                                            className="text-xs px-2 py-1 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] rounded transition-colors"
                                        >
                                            复制
                                        </button>
                                    </div>
                                    <p className="font-mono text-[var(--text-primary)]">{tsResult.utc}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Date to Timestamp */}
                {/* Date to Timestamp */}
                <div className="tool-panel flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className="px-4 py-2 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
                        <span className="text-sm font-semibold text-[var(--text-secondary)]">日期时间 → 时间戳</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setDatetimeInput(formatDatetimeLocal(new Date()))}
                                className="px-2 py-1 text-xs bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] rounded transition-colors flex items-center gap-1"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                当前
                            </button>
                            <button
                                onClick={() => setDatetimeInput('')}
                                className="px-2 py-1 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--error-color)] rounded transition-colors"
                            >
                                清空
                            </button>
                        </div>
                    </div>
                    <div className="p-4 space-y-4 flex-1 overflow-auto">

                        {/* Date input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[var(--text-secondary)]">
                                日期和时间
                            </label>
                            <input
                                type="datetime-local"
                                value={datetimeInput}
                                onChange={(e) => setDatetimeInput(e.target.value)}
                                step="1"
                                className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                            />
                        </div>

                        {/* Quick set to now */}


                        {/* Results */}
                        {dtResult && (
                            <div className="space-y-3 pt-2">
                                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-[var(--text-secondary)]">秒</span>
                                        <button
                                            onClick={() => handleCopy(String(dtResult.seconds), '秒')}
                                            className="text-xs px-2 py-1 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] rounded transition-colors"
                                        >
                                            复制
                                        </button>
                                    </div>
                                    <p className="font-mono text-[var(--text-primary)]">{dtResult.seconds}</p>
                                </div>

                                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-[var(--text-secondary)]">毫秒</span>
                                        <button
                                            onClick={() => handleCopy(String(dtResult.milliseconds), '毫秒')}
                                            className="text-xs px-2 py-1 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] rounded transition-colors"
                                        >
                                            复制
                                        </button>
                                    </div>
                                    <p className="font-mono text-[var(--text-primary)]">{dtResult.milliseconds}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
