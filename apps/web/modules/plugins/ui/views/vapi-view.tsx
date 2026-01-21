"use client";

import React, { useState } from 'react'
import { Feature, PluginCard } from '../components/plugin-card';
import { GlobeIcon, PhoneCallIcon, PhoneIcon, WorkflowIcon } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@workspace/backend/_generated/api';
import z from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@workspace/ui/components/field';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { VapiConnectedView } from '../components/vapi-connected-view';

const vapiFeatures: Feature[] = [
  {
    icon: GlobeIcon,
    label: "Web voice calls",
    description: "Voice chat directly in your app"
  },
  {
    icon: PhoneIcon,
    label: "Phone numbers",
    description: "Get dedicated business lines"
  },
  {
    icon: PhoneCallIcon,
    label: "Outbound calls",
    description: "Automated customer outreach"
  },
  {
    icon: WorkflowIcon,
    label: "Workflows",
    description: "Custom conversation flows"
  },
]

const formSchema = z.object({
  publicApiKey: z.string().min(1, "Public API key is required"),
  secretApiKey: z.string().min(1, "Secret API key is required"),
})

const VapiPluginRemoveForm = ({ onOpenChange, open }: { onOpenChange: (open: boolean) => void, open: boolean }) => {
  const removePlugin = useMutation(api.private.plugins.remove);

  const onSubmit = async () => {
    try {
      await removePlugin({
        service: "vapi",
      })
      onOpenChange(false);
      toast.success("Vapi plugin removed successfully");
    } catch (error) {
      console.log(error);
      toast.error("Failed to remove Vapi plugin");
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disconnect Vapi</DialogTitle>
          <DialogDescription>Are you sure you want to disconnect the Vapi plugin?</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="destructive" onClick={onSubmit}>
            Disconnect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const VapiPluginForm = ({ onOpenChange, open }: { onOpenChange: (open: boolean) => void, open: boolean }) => {
  const upsertSecret = useMutation(api.private.secrets.upsert);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      publicApiKey: "",
      secretApiKey: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await upsertSecret({
        service: "vapi",
        value: {
          publicApiKey: values.publicApiKey,
          secretApiKey: values.secretApiKey,
        }
      })
      onOpenChange(false);
      toast.success("Vapi secret created successfully");
    } catch (error) {
      console.log(error);
      toast.error("Failed to create Vapi secret");
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable Vapi</DialogTitle>
          <DialogDescription>Your API keys are safely encrypted and stored using AWS Secrets Manager.</DialogDescription>
        </DialogHeader>
        <form id="vapi-plugin-form" onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-y-4'>
          <FieldGroup>
            <Controller
              name="publicApiKey"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-api-key">
                    Public API Key
                  </FieldLabel>
                  <Input {...field}
                    id="form-api-key"
                    aria-invalid={fieldState.invalid}
                    placeholder="Your public API key"
                    type="password"
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="secretApiKey"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-secret-api-key">
                    Private API Key
                  </FieldLabel>
                  <Input {...field}
                    id="form-secret-api-key"
                    aria-invalid={fieldState.invalid}
                    placeholder="Your private API key"
                    type="password"
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button type='submit' form='vapi-plugin-form' disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Connecting..." : "Connect"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function VapiView() {
  const vapiPlugin = useQuery(api.private.plugins.getOne, { service: "vapi" });

  const [connectOpen, setConnectOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  const toggleConnection = () => {
    if (vapiPlugin) {
      setRemoveOpen(true);
    } else {
      setConnectOpen(true);
    }
  }

  return (
    <>
      <VapiPluginForm onOpenChange={setConnectOpen} open={connectOpen} />
      <VapiPluginRemoveForm onOpenChange={setRemoveOpen} open={removeOpen} />
      <div className='flex min-h-screen flex-col bg-muted p-8'>
        <div className="mx-auto w-full max-w-screen-md">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl">Vapi Plugin</h1>
            <p className="text-muted-foreground">Configure Vapi to enable AI voice calls and phone support</p>
          </div>

          <div className='mt-8'>
            {vapiPlugin ? (
              <VapiConnectedView onDisconnect={toggleConnection} />
            ) : (
              <PluginCard serviceImage='/icons/vapi.jpg' serviceName='Vapi' features={vapiFeatures} onSubmit={toggleConnection} isDisabled={vapiPlugin === undefined} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
