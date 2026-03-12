/**
 * Format JSON with indentation
 */
export function formatJson(input: string): { success: boolean; result: string; error?: string } {
    if (!input.trim()) {
        return { success: false, result: '', error: '输入内容为空' };
    }

    try {
        const parsed = JSON.parse(input);
        const formatted = JSON.stringify(parsed, null, 2);
        return { success: true, result: formatted };
    } catch (e) {
        const error = e instanceof Error ? e.message : '无效的 JSON';
        return { success: false, result: '', error };
    }
}

/**
 * Minify JSON (remove whitespace)
 */
export function minifyJson(input: string): { success: boolean; result: string; error?: string } {
    if (!input.trim()) {
        return { success: false, result: '', error: '输入内容为空' };
    }

    try {
        const parsed = JSON.parse(input);
        const minified = JSON.stringify(parsed);
        return { success: true, result: minified };
    } catch (e) {
        const error = e instanceof Error ? e.message : '无效的 JSON';
        return { success: false, result: '', error };
    }
}

export interface JsonErrorInfo {
    message: string;
    line: number;      // 1-indexed
    column: number;    // 1-indexed
    position: number;  // 0-indexed character offset
}

/**
 * Parse JSON error to extract position information
 */
export function parseJsonError(input: string, error: unknown): JsonErrorInfo {
    const msg = error instanceof Error ? error.message : '无效的 JSON';

    // Try to extract position from error message
    // Chrome/V8 format: "... at position 123" or "... at line X column Y"
    let position = -1;
    let line = 1;
    let column = 1;

    const posMatch = msg.match(/position\s+(\d+)/i);
    if (posMatch) {
        position = parseInt(posMatch[1], 10);
    }

    const lineColMatch = msg.match(/line\s+(\d+)\s+column\s+(\d+)/i);
    if (lineColMatch) {
        line = parseInt(lineColMatch[1], 10);
        column = parseInt(lineColMatch[2], 10);
    } else if (position >= 0) {
        // Calculate line/column from position
        let currentPos = 0;
        const lines = input.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (currentPos + lines[i].length >= position) {
                line = i + 1;
                column = position - currentPos + 1;
                break;
            }
            currentPos += lines[i].length + 1; // +1 for \n
        }
    }

    // If we still don't have a position, try to find it by parsing character by character
    if (position < 0) {
        // Attempt incremental parse to find error location
        for (let i = input.length; i > 0; i--) {
            try {
                JSON.parse(input.substring(0, i));
                position = i;
                break;
            } catch {
                // continue
            }
        }
        if (position < 0) position = 0;
        // Recalculate line/column
        let currentPos = 0;
        const lines = input.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (currentPos + lines[i].length >= position) {
                line = i + 1;
                column = position - currentPos + 1;
                break;
            }
            currentPos += lines[i].length + 1;
        }
    }

    return { message: msg, line, column, position };
}

/**
 * Validate JSON syntax
 */
export function validateJson(input: string): { valid: boolean; error?: string; errorInfo?: JsonErrorInfo } {
    if (!input.trim()) {
        return { valid: false, error: '输入内容为空' };
    }

    try {
        JSON.parse(input);
        return { valid: true };
    } catch (e) {
        const errorInfo = parseJsonError(input, e);
        return { valid: false, error: errorInfo.message, errorInfo };
    }
}

/**
 * Get sample JSON for demo purposes
 */
export function getJsonExample(): string {
    return JSON.stringify(
        {
            name: "开发者工具箱",
            version: "1.0.0",
            description: "一套实用的开发者工具集合",
            features: [
                "JSON 解析器",
                "Markdown 预览",
                "时间戳转换"
            ],
            config: {
                theme: "auto",
                language: "zh-CN",
                settings: {
                    autoSave: true,
                    darkMode: false
                }
            },
            metadata: {
                createdAt: "2024-01-01T00:00:00Z",
                author: {
                    name: "开发者",
                    email: "dev@example.com"
                }
            }
        },
        null,
        2
    );
}
