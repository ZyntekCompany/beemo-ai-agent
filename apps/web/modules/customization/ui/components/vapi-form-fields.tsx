import React from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { useVapiAssitants, useVapiPhoneNumbers } from '@/modules/plugins/hooks/use-vapi-data'
import { Field, FieldDescription, FieldLabel } from '@workspace/ui/components/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select'
import { FormSchema } from '../../types'

interface VapiFormFieldsProps {
  form: UseFormReturn<FormSchema>
}

export function VapiFormFields({ form }: VapiFormFieldsProps) {
  const { data: assistants, isLoading: isLoadingAssitants } = useVapiAssitants()
  const { data: phoneNumbers, isLoading: isLoadingPhoneNumbers } = useVapiPhoneNumbers()

  const disabled = form.formState.isSubmitting;

  return (
    <>
      <Controller
        name="vapiSettings.assistantId"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="vapiSettings.assistantId">
              Voice Assistant
            </FieldLabel>
            <Select
              disabled={isLoadingAssitants || disabled}
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingAssitants ? "Loading assistants..." : "Select an assistant"} />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {assistants.map((assistant) => (
                  <SelectItem key={assistant.id} value={assistant.id}>
                    {assistant.name || "Unnamed Assistant"} -{" "}
                    {assistant.model?.model || "Unknown Model"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>The Vapi assistant to use for voice calls</FieldDescription>
          </Field>
        )}
      />
      <Controller
        name="vapiSettings.phoneNumber"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="vapiSettings.phoneNumberId">
              Display Phone Number
            </FieldLabel>
            <Select
              disabled={isLoadingPhoneNumbers || disabled}
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingPhoneNumbers ? "Loading phone numbers..." : "Select a phone number"} />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {phoneNumbers.map((phoneNumber) => (
                  <SelectItem key={phoneNumber.id} value={phoneNumber.number || phoneNumber.id}>
                    {phoneNumber.number || "Unknown"} -{" "}
                    {phoneNumber.name || "Unnamed"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>Phone number to display in the widget</FieldDescription>
          </Field>
        )}
      />
    </>
  )
}
