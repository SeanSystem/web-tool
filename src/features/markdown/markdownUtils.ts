/**
 * Read a markdown file and return its content
 */
export async function readMarkdownFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!file.name.match(/\.(md|markdown)$/i)) {
            reject(new Error('请选择 Markdown 文件（.md 或 .markdown）'));
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') {
                resolve(result);
            } else {
                reject(new Error('文件读取失败'));
            }
        };

        reader.onerror = () => {
            reject(new Error('文件读取失败'));
        };

        reader.readAsText(file);
    });
}

/**
 * Convert markdown to HTML (basic conversion for copy functionality)
 * Note: This is a simple implementation. For full rendering, use react-markdown.
 */
export function markdownToHtml(markdown: string): string {
    // This is handled by react-markdown in the component
    // For copy HTML functionality, we'll grab it from the DOM
    return markdown;
}

/**
 * Get sample markdown content for demo
 */
export function getMarkdownExample(): string {
    return `# 欢迎使用 Markdown 预览

这是一个 **实时** 预览您的 Markdown 内容的工具。

## 功能特性

- **粗体** 和 *斜体* 文本
- \`行内代码\` 块
- [链接](https://example.com)
- 图片和更多！

### 代码块

\`\`\`javascript
function greet(name) {
  console.log(\`你好, \${name}!\`);
}

greet('世界');
\`\`\`

### 任务列表

- [x] 创建 Markdown 解析器
- [x] 添加语法高亮
- [ ] 添加更多功能

### 表格

| 功能 | 状态 |
|------|------|
| 标题 | ✅ |
| 列表 | ✅ |
| 代码 | ✅ |
| 表格 | ✅ |

### 引用

> "预测未来的最好方法就是创造未来。"
> — 彼得·德鲁克

---

*感谢使用开发者工具箱！*
`;
}
