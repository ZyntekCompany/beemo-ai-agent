import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@workspace/backend/_generated/api';
import { Doc } from '@workspace/backend/_generated/dataModel'
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@workspace/ui/components/field';
import { Input } from '@workspace/ui/components/input';
import { Separator } from '@workspace/ui/components/separator';
import { Textarea } from '@workspace/ui/components/textarea';
import { useMutation } from 'convex/react';
import React from 'react'
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { VapiFormFields } from './vapi-form-fields';
import { widgetSettingsFormSchema } from '../../schemas';
import { FormSchema } from '../../types';

type WidgetSettings = Doc<"widgetSettings">;

interface CustomizationFormProps {
  initialData?: WidgetSettings | null;
  hasVapiPlugin: boolean;
}

export function CustomizationForm({ initialData, hasVapiPlugin }: CustomizationFormProps) {
  const upsertWidgetSettings = useMutation(api.private.widgetSettings.upsert);

  const form = useForm<FormSchema>({
    resolver: zodResolver(widgetSettingsFormSchema),
    defaultValues: {
      greetMessage: initialData?.greetMessage || "¡Hola! Soy Vera, su asistente virtual. ¿En qué puedo ayudarle el día de hoy? ✨",
      defaultSuggestions: {
        suggestion1: initialData?.defaultSuggestions?.suggestion1 || "",
        suggestion2: initialData?.defaultSuggestions?.suggestion2 || "",
        suggestion3: initialData?.defaultSuggestions?.suggestion3 || "",
      },
      vapiSettings: {
        assistantId: initialData?.vapiSettings?.assistantId || "",
        phoneNumber: initialData?.vapiSettings?.phoneNumber || "",
      },
    },
  });

  const onSubmit = async (values: FormSchema) => {
    try {
      const vapiSettings: WidgetSettings["vapiSettings"] = {
        assistantId: values.vapiSettings.assistantId === "none" ? "" : values.vapiSettings.assistantId,
        phoneNumber: values.vapiSettings.phoneNumber === "none" ? "" : values.vapiSettings.phoneNumber,
      }

      await upsertWidgetSettings({
        greetMessage: values.greetMessage,
        defaultSuggestions: values.defaultSuggestions,
        vapiSettings,
      })

      toast.success("Widget settings saved")
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Chat Settings</CardTitle>
          <CardDescription>
            Configure basic chat widget behavior and messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="customization-form" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="greetMessage"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="greetMessage">
                      Greeting Message
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="greetMessage"
                      rows={3}
                      aria-invalid={fieldState.invalid}
                      placeholder="Welcome message shown when chat open"
                    />
                    <FieldDescription>
                      The first message customers see when they open the chat
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Separator />

              <div className="space-y-4">
                <div>
                  <h3 className="mb-4 text-sm">Default Suggestions</h3>
                  <p className='mb-4 text-muted-foreground text-sm'>Quick reply suggestions shown to customers to help guide the conversation</p>

                  <div className="space-y-4">
                    <Controller
                      name="defaultSuggestions.suggestion1"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="defaultSuggestions.suggestion1">
                            Suggestion 1
                          </FieldLabel>
                          <Input
                            {...field}
                            id="defaultSuggestions.suggestion1"
                            aria-invalid={fieldState.invalid}
                            placeholder="e.g. How do I get started?"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="defaultSuggestions.suggestion2"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="defaultSuggestions.suggestion2">
                            Suggestion 2
                          </FieldLabel>
                          <Input
                            {...field}
                            id="defaultSuggestions.suggestion2"
                            aria-invalid={fieldState.invalid}
                            placeholder="e.g. What are your pricing plans?"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="defaultSuggestions.suggestion3"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="defaultSuggestions.suggestion3">
                            Suggestion 3
                          </FieldLabel>
                          <Input
                            {...field}
                            id="defaultSuggestions.suggestion3"
                            aria-invalid={fieldState.invalid}
                            placeholder="e.g. What is your return policy?"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                </div>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {hasVapiPlugin && (
        <Card>
          <CardHeader>
            <CardTitle>Voice Assistant Settings</CardTitle>
            <CardDescription>Configure voice calling features powered by Vapi</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <VapiFormFields form={form} />
          </CardContent>
        </Card>
      )}

      <div className='flex justify-end'>
        <Button disabled={form.formState.isSubmitting} type='submit' form='customization-form'>Save Settings</Button>
      </div>
    </div>
  )
}
