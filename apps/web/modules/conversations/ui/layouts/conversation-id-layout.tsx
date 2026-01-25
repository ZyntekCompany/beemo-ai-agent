"use client";

import React from 'react'
import { useParams } from 'next/navigation';
import { useIsLg } from '@/hooks/use-is-lg';
import { useConversationType } from '@/hooks/use-conversation-type';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";
import { ContactPanel } from '../components/contact-panel';

export function ConversationIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLg = useIsLg();
  const params = useParams();
  const conversationId = params.conversationId as string;
  const { isWhatsApp } = useConversationType(conversationId);
  

  return (
    <ResizablePanelGroup className="h-full flex-1" direction="horizontal">
      <ResizablePanel className='h-full' defaultSize={isLg ? 60 : 100}>
        <div className="flex h-full flex-1 flex-col">{children}</div>
      </ResizablePanel>
      {isLg && !isWhatsApp && (
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