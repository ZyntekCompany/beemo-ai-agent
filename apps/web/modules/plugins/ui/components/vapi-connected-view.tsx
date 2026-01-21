import React, { useState } from 'react'
import { Card, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import Image from 'next/image';
import { Button } from '@workspace/ui/components/button';
import { BotIcon, PhoneIcon, SettingsIcon, UnplugIcon } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { VapiPhoneNumbersTab } from './vapi-phone-numbers-tab';
import { VapiAssistantsTab } from './vapi-assistants-tab';

interface VapiConnectedViewProps {
  onDisconnect: () => void;
}

export function VapiConnectedView({ onDisconnect }: VapiConnectedViewProps) {
  const [activeTab, setActiveTab] = useState("assistants");

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                alt='Vapi'
                src='/icons/vapi.jpg'
                width={48}
                height={48}
                className='rounded-lg object-contain'
              />
              <div>
                <CardTitle>Vapi Integration</CardTitle>
                <CardDescription>Manage your phone numbers and AI assistants</CardDescription>
              </div>
            </div>

            <Button variant="destructive" size="sm" onClick={onDisconnect}>
              <UnplugIcon />
              Disconnect
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-lg border bg-muted">
                <SettingsIcon className='size-6 text-muted-foreground' />
              </div>
              <div>
                <CardTitle>Widget Configuration</CardTitle>
                <CardDescription>Set up voice calls for your chat widget</CardDescription>
              </div>
            </div>

            <Button asChild>
              <Link href="/customization">
                <SettingsIcon />
                Configure
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="overflow-hidden rounded-lg border bg-background">
        <Tabs
          className='gap-0'
          defaultValue='phone-numbers'
          onValueChange={setActiveTab}
          value={activeTab}
        >
          <TabsList className='grid h-12 w-full grid-cols-2 p-0'>
            <TabsTrigger className='h-full rounded-none' value='phone-numbers'><PhoneIcon />Phone Numbers</TabsTrigger>
            <TabsTrigger className='h-full rounded-none' value='assistants'><BotIcon />AI Assistants</TabsTrigger>

          </TabsList>
          <TabsContent value='phone-numbers'>
            <VapiPhoneNumbersTab />
          </TabsContent>
          <TabsContent value='assistants'>
            <VapiAssistantsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
