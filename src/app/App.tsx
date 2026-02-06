import { Toaster } from 'sonner';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { TabsNav, TabId } from '../components/TabsNav';
import { JsonTool } from '../features/json/JsonTool';
import { MarkdownTool } from '../features/markdown/MarkdownTool';
import { TimestampTool } from '../features/timestamp/TimestampTool';
import { useLocalStorage } from '../hooks/useLocalStorage';

export function App() {
    const [activeTab, setActiveTab] = useLocalStorage<TabId>('active-tab', 'json');

    const renderTool = () => {
        switch (activeTab) {
            case 'json':
                return <JsonTool />;
            case 'markdown':
                return <MarkdownTool />;
            case 'timestamp':
                return <TimestampTool />;
            default:
                return <JsonTool />;
        }
    };

    return (
        <>
            <Toaster
                position="top-right"
                richColors
                theme="system"
                toastOptions={{
                    className: 'font-sans',
                }}
            />
            <div className="h-screen flex flex-col bg-[var(--bg-primary)] overflow-hidden">
                <Header />
                <TabsNav activeTab={activeTab} onTabChange={setActiveTab} />

                <main className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 flex flex-col min-h-0">
                        {renderTool()}
                    </div>
                </main>

                <Footer />
            </div>
        </>
    );
}
