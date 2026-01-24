"use client";

import { Label } from '@workspace/ui/components/label';
import React, { useState } from 'react'
import { useOrganization } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { Input } from '@workspace/ui/components/input';
import { CopyIcon } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';
import { IntegrationId, INTEGRATIONS } from '../../constants';
import Image from 'next/image';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogDescription } from '@workspace/ui/components/dialog';
import { createScript } from '../../utils';

export function IntegrationsView() {
  const { organization } = useOrganization();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState("");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(organization?.id ?? "");
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  }

  const handleIntegrationClick = (integration: IntegrationId) => {
    if (!organization) {
      toast.error("Organization ID not found");
      return;
    }

    const snippet = createScript(integration, organization.id);
    setSelectedSnippet(snippet);
    setDialogOpen(true);
  }

  return (
    <>
      <IntegrationDialog open={dialogOpen} onOpenChange={setDialogOpen} snippet={selectedSnippet} />
      <div className='flex min-h-screen flex-col bg-muted p-8'>
        <div className="mx-auto w-full max-w-screen-md">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl">Setup & Integrations</h1>
            <p className="text-muted-foreground">
              Choose the integration tha&apos;s right for you
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-4">
              <Label className='w-34' htmlFor='organization-id'>Organization ID</Label>
              <Input
                disabled
                id='organization-id'
                readOnly
                value={organization?.id ?? ""}
                className='flex-1 bg-background font-mono text-sm'
              />
              <Button className='gap-2' size='sm' onClick={handleCopy}>
                <CopyIcon className='size-4' />
                Copy
              </Button>
            </div>
          </div>

          <Separator className='my-8' />
          <div className="space-y-6">
            <div className="space-y-1">
              <Label className='text-lg'>Integrations</Label>
              <p className='text-muted-foreground text-sm'>Add the following code to your website to enable the chatbox.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {INTEGRATIONS.map((integration) => (
                <button
                  key={integration.id}
                  onClick={() => handleIntegrationClick(integration.id)}
                  type='button'
                  className='flex items-center gap-4 rounded-lg border bg-background p-4 hover:bg-accent'
                >
                  <Image src={integration.icon} alt={integration.title} width={32} height={32} />
                  <span>{integration.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export function IntegrationDialog({ open, onOpenChange, snippet }: { open: boolean, onOpenChange: (open: boolean) => void, snippet: string }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet ?? "");
      toast.success("Code copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy code to clipboard");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Integrate with your website</DialogTitle>
          <DialogDescription>
            Follow these steps to integrate the chatbox into your website.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="rounded-md bg-accent p-2 text-sm">
              1. Copy the following code
            </div>
            <div className="group relative">
              <pre className="max-h-[300px] overflow-x-auto overflow-y-auto whitespace-pre-wrap break-all rounded-md bg-foreground p-2 font-mono text-secondary text-sm">
                {snippet}
              </pre>
              <Button
                className='absolute right-6 top-4 size-6 opacity-0 transition-opacity group-hover:opacity-100'
                size='icon'
                type='button'
                onClick={handleCopy}
                variant="secondary"
              >
                <CopyIcon className='size-3' />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="rounded-md bg-accent p-2 text-sm">
              2. Add the code in your page
            </div>
            <p className="text-muted-foreground text-sm">
              Paste the chatbox code above in your page. You can add it in the HTML head section.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}