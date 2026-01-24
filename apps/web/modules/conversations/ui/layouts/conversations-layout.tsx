import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";
import { ConversationsPanel } from "@/modules/conversations/ui/layouts/conversations-panel";

export function ConversationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ResizablePanelGroup
      className="flex-1 h-full min-h-0"
      direction="horizontal"
    >
      <ResizablePanel defaultSize={32} minSize={20}>
        <div className="flex h-full flex-col overflow-hidden">
          <ConversationsPanel />
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle className="max-lg:hidden" />
      <ResizablePanel defaultSize={75} minSize={30}>
        <div className="flex h-full flex-col overflow-hidden">{children}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
