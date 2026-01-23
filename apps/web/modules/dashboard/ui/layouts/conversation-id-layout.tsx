"use client";

import React from 'react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";
import { ContactPanel } from '../components/contact-panel';
import { useIsLg } from '@/hooks/use-is-lg';

export function ConversationIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLg = useIsLg();

  return (
    <ResizablePanelGroup className="h-full flex-1" direction="horizontal">
      <ResizablePanel className='h-full' defaultSize={isLg ? 60 : 100}>
        <div className="flex h-full flex-1 flex-col">{children}</div>
      </ResizablePanel>
      {isLg && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel className='h-full' defaultSize={40} minSize={20}>
            <ContactPanel />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}