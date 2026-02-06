export type TabId = 'json' | 'json-diff' | 'markdown' | 'timestamp';

interface Tab {
    id: TabId;
    label: string;
    icon: React.ReactNode;
}

interface TabsNavProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
}

const tabs: Tab[] = [
    {
        id: 'json',
        label: 'JSON 工具',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
        ),
    },
    {
        id: 'json-diff',
        label: 'JSON 对比',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
        ),
    },
    {
        id: 'markdown',
        label: 'Markdown 预览',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
    {
        id: 'timestamp',
        label: '时间戳转换',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
];

export function TabsNav({ activeTab, onTabChange }: TabsNavProps) {
    return (
        <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex overflow-x-auto scrollbar-hide -mb-px">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                  border-b-2 transition-colors
                  ${isActive
                                        ? 'border-[var(--accent-color)] text-[var(--accent-color)]'
                                        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]'
                                    }
                `}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {tab.icon}
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
