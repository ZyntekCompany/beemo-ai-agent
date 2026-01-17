import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";
import { ConversationsPanel } from "@/modules/dashboard/ui/layouts/conversations-panel";

export function ConversationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ResizablePanelGroup className="flex-1 h-full" orientation="horizontal">
      <ResizablePanel defaultSize={30} maxSize={50} minSize={15}>
        <ConversationsPanel />
      </ResizablePanel>
      <ResizableHandle withHandle />
      {/* <ResizablePanel defaultSize={70} className="h-full">
        {children}
      </ResizablePanel> */}
    </ResizablePanelGroup>
  );
}
