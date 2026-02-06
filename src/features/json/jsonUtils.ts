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

/**
 * Validate JSON syntax
 */
export function validateJson(input: string): { valid: boolean; error?: string } {
    if (!input.trim()) {
        return { valid: false, error: '输入内容为空' };
    }

    try {
        JSON.parse(input);
        return { valid: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : '无效的 JSON';
        return { valid: false, error };
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
