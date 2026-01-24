"use client";

import React, { useState } from 'react'
import { Feature, PluginCard } from '../components/plugin-card';
import { MessageSquareIcon, PhoneIcon, ZapIcon } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@workspace/backend/_generated/api';
import z from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@workspace/ui/components/field';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { YCloudConnectedView } from '../components/ycloud-connected-view';

const ycloudFeatures: Feature[] = [
  {
    icon: MessageSquareIcon,
    label: "WhatsApp Messages",
    description: "Send and receive WhatsApp messages"
  },
  {
    icon: PhoneIcon,
    label: "Business Account",
    description: "Connect your WhatsApp Business Account"
  },
  {
    icon: ZapIcon,
    label: "Auto Replies",
    description: "Automatic AI-powered responses"
  },
]

const formSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  wabaNumber: z.string().min(1, "WhatsApp Business Account number is required").regex(/^\+[1-9]\d{1,14}$/, "Must be in E.164 format (e.g., +573181833248)"),
})

const YCloudPluginRemoveForm = ({ onOpenChange, open }: { onOpenChange: (open: boolean) => void, open: boolean }) => {
  const removePlugin = useMutation(api.private.plugins.remove);

  const onSubmit = async () => {
    try {
      await removePlugin({
        service: "ycloud",
      })
      onOpenChange(false);
      toast.success("YCloud plugin removed successfully");
    } catch (error) {
      console.log(error);
      toast.error("Failed to remove YCloud plugin");
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disconnect YCloud</DialogTitle>
          <DialogDescription>Are you sure you want to disconnect the YCloud plugin?</DialogDescription>
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

const YCloudPluginForm = ({ onOpenChange, open }: { onOpenChange: (open: boolean) => void, open: boolean }) => {
  const upsertSecret = useMutation(api.private.secrets.upsert);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: "",
      wabaNumber: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await upsertSecret({
        service: "ycloud",
        value: {
          apiKey: values.apiKey,
          wabaNumber: values.wabaNumber,
        }
      })
      onOpenChange(false);
      form.reset();
      toast.success("YCloud credentials saved successfully");
    } catch (error) {
      console.log(error);
      toast.error("Failed to save YCloud credentials");
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable YCloud WhatsApp</DialogTitle>
          <DialogDescription>Your API keys are securely stored and encrypted in the database.</DialogDescription>
        </DialogHeader>
        <form id="ycloud-plugin-form" onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-y-4'>
          <FieldGroup>
            <Controller
              name="apiKey"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ycloud-api-key">
                    API Key
                  </FieldLabel>
                  <Input {...field}
                    id="ycloud-api-key"
                    aria-invalid={fieldState.invalid}
                    placeholder="Your YCloud API key"
                    type="password"
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="wabaNumber"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ycloud-waba-number">
                    WhatsApp Business Account Number
                  </FieldLabel>
                  <Input {...field}
                    id="ycloud-waba-number"
                    aria-invalid={fieldState.invalid}
                    placeholder="+573181833248"
                    type="tel"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Format: E.164 (e.g., +573181833248)
                  </p>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button type='submit' form='ycloud-plugin-form' disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Connecting..." : "Connect"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function YCloudView() {
  const ycloudPlugin = useQuery(api.private.plugins.getOne, { service: "ycloud" });

  const [connectOpen, setConnectOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  const toggleConnection = () => {
    if (ycloudPlugin) {
      setRemoveOpen(true);
    } else {
      setConnectOpen(true);
    }
  }

  return (
    <>
      <YCloudPluginForm onOpenChange={setConnectOpen} open={connectOpen} />
      <YCloudPluginRemoveForm onOpenChange={setRemoveOpen} open={removeOpen} />
      <div className='flex min-h-screen flex-col bg-muted p-8'>
        <div className="mx-auto w-full max-w-screen-md">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl">YCloud Plugin</h1>
            <p className="text-muted-foreground">Configure YCloud to enable WhatsApp messaging and AI-powered auto-replies</p>
          </div>

          <div className='mt-8'>
            {ycloudPlugin ? (
              <YCloudConnectedView onDisconnect={toggleConnection} />
            ) : (
              <PluginCard 
                serviceImage='/icons/ycloud.png' 
                serviceName='YCloud' 
                features={ycloudFeatures} 
                onSubmit={toggleConnection} 
                isDisabled={ycloudPlugin === undefined} 
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}