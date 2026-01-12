import React from "react";
// import { WidgetHeader } from "../components/widget-header";
// import { WidgetFooter } from "../components/widget-footer";
import WidgetAuthScreen from "../screens/widget-auth-screen";

interface Props {
  organizationId: string;
}

export function WidgetView({ organizationId }: Props) {
  return (
    <main className="flex h-full min-h-screen flex-col overflow-hidden rounded-xl border bg-muted">
      {/* <div className="flex flex-1">Widget View: {organizationId}</div>
      <WidgetFooter /> */}
      <WidgetAuthScreen />
    </main>
  );
}
