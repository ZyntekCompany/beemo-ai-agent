import React from "react";
import { WidgetHeader } from "../components/widget-header";
import { WidgetFooter } from "../components/widget-footer";

interface Props {
  organizationId: string;
}

export function WidgetView({ organizationId }: Props) {
  return (
    <main className="flex h-full min-h-screen flex-col overflow-hidden rounded-xl border bg-muted">
      <WidgetHeader>
        <div className="flex flex-col justify-between gap-y-2 px-2 py-6">
          <p className="text-3xl">Hi there!</p>
          <p className="text-lg">How can we help you today?</p>
        </div>
      </WidgetHeader>
      <div className="flex flex-1">Widget View: {organizationId}</div>
      <WidgetFooter />
    </main>
  );
}
