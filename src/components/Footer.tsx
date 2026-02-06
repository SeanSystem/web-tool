export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-auto border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-[var(--text-muted)]">
                    <div className="flex items-center gap-2">
                        <span>开发者工具箱</span>
                        <span className="text-[var(--border-color)]">•</span>
                        <span>v1.0.0</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span>© {currentYear} 保留所有权利</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
