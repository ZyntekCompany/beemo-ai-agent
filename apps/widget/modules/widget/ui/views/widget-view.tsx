import { useAtomValue } from "jotai";

import { screenAtom } from "@/modules/widget/atoms/widget-atoms";
import { WidgetAuthScreen } from "@/modules/widget/ui/screens/widget-auth-screen";
import { WidgetErrorScreen } from "@/modules/widget/ui/screens/widget-error-screen";
import { WidgetLoadingScreen } from "@/modules/widget/ui/screens/widget-loading-screen";

interface Props {
  organizationId: string;
}

export function WidgetView({ organizationId }: Props) {
  const screen = useAtomValue(screenAtom);

  const screens = {
    error: <WidgetErrorScreen />,
    loading: <WidgetLoadingScreen organizationId={organizationId} />,
    auth: <WidgetAuthScreen />,
    voice: <div>Voice Screen</div>,
    inbox: <div>Inbox Screen</div>,
    selection: <div>Selection Screen</div>,
    chat: <div>Chat Screen</div>,
    contact: <div>Contact Screen</div>,
  };

  return (
    <main className="flex h-full min-h-screen flex-col overflow-hidden rounded-xl border bg-muted">
      {screens[screen]}
    </main>
  );
}
