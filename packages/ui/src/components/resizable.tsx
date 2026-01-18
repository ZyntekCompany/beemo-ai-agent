"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@workspace/ui/lib/utils";

/**
 * A robust resizable panel group component that accepts both 'direction' and 'orientation'.
 */
const ResizablePanelGroup = ({
  className,
  direction,
  orientation,
  ...props
}: any) => {
  const effectiveDirection = direction || orientation || "horizontal";
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      direction={effectiveDirection}
      className={cn(
        "flex h-full w-full",
        effectiveDirection === "vertical" ? "flex-col" : "flex-row",
        className
      )}
      {...props}
    />
  );
};

/**
 * Enhanced ResizablePanel that ensures content behavior with flex and min-w-0.
 */
const ResizablePanel = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Panel>) => (
  <ResizablePrimitive.Panel
    data-slot="resizable-panel"
    className={cn("flex flex-col min-w-0 min-h-0 relative h-full", className)}
    {...props}
  />
);

/**
 * Premium ResizableHandle with a larger hit area using pseudo-elements.
 */
const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean;
}) => (
  <ResizablePrimitive.Separator
    data-slot="resizable-handle"
    className={cn(
      "relative flex w-px items-center justify-center bg-border transition-all duration-200",
      "z-50", // Ensure handle is above content
      // Increase hit area with pseudo-element
      "after:absolute after:inset-y-0 after:left-1/2 after:w-4 after:-translate-x-1/2 after:cursor-col-resize after:z-20",
      // Interactive states
      "hover:bg-primary/50 active:bg-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
      "data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:inset-x-0 data-[panel-group-direction=vertical]:after:top-1/2 data-[panel-group-direction=vertical]:after:h-4 data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:cursor-row-resize",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-6 w-3.5 items-center justify-center rounded-sm border bg-background shadow-xs transition-colors group-hover:border-primary/50">
        <GripVertical className="size-2.5 text-muted-foreground transition-colors group-hover:text-primary" />
      </div>
    )}
  </ResizablePrimitive.Separator>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
