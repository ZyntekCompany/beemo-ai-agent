import { useAtomValue, useSetAtom } from 'jotai';
import React, { useState } from 'react'
import { screenAtom, widgetSettingsAtom } from '../../atoms/widget-atoms';
import { useVapi } from '../../hooks/use-vapi';
import { WidgetHeader } from '../components/widget-header';
import { Button } from '@workspace/ui/components/button';
import { ArrowLeftIcon, CheckIcon, CopyIcon, MicIcon, MicOffIcon, PhoneIcon } from 'lucide-react';
import { WidgetFooter } from '../components/widget-footer';
import { cn } from '@workspace/ui/lib/utils';
import { AIConversation, AIConversationContent, AIConversationScrollButton } from '@workspace/ui/components/ai/conversation';
import { AIMessage, AIMessageContent } from '@workspace/ui/components/ai/message';
import Link from 'next/link';

export function WidgetContactScreen() {
  const setScreen = useSetAtom(screenAtom);
  const widgetSettings = useAtomValue(widgetSettingsAtom);

  const phoneNumber = widgetSettings?.vapiSettings.phoneNumber;

  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    if (!phoneNumber) return;

    try {
      await navigator.clipboard.writeText(phoneNumber);
      setCopied(true);
    } catch (error) {
      console.log(error)
    } finally {
      setTimeout(() => setCopied(false), 2000);
    }

  }

  return (
    <>
      <WidgetHeader className="flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <Button size="icon" variant="transparent" onClick={() => setScreen("selection")}>
            <ArrowLeftIcon />
          </Button>
          <p>Contact Us</p>
        </div>
      </WidgetHeader>
      <div className="flex h-full flex-col items-center justify-center gap-y-4">
        <div className="flex items-center justify-center rounded-full border bg-white p-3">
          <PhoneIcon className='size-6 text-muted-foreground' />
        </div>
        <p className="textmuted-foreground">Available 24/7</p>
        <p className="font-bold text-2xl">{phoneNumber}</p>
      </div>
      <div className='border-t bg-background p-4'>
        <div className="flex flex-col items-center gap-y-2">
          <Button
            className='w-full'
            onClick={handleCopy}
            size="lg"
            variant="outline"
          >
            {copied ? (
              <>
                <CheckIcon className='size-4 mr-2' />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <CopyIcon className='size-4 mr-2' />
                <span>Copy Number</span>
              </>
            )}
          </Button>
          <Button asChild className='w-full' size="lg">
            <Link href={`tel:${phoneNumber}`}><PhoneIcon className='size-4 mr-2' /> Call Now</Link>
          </Button>
        </div>
      </div>
    </>
  )
}
