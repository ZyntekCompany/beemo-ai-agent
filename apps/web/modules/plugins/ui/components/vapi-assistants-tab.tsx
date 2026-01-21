"use client";

import { useVapiAssitants } from "../../hooks/use-vapi-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { BotIcon } from "lucide-react";

export function VapiAssistantsTab() {
  const { data: assistants, isLoading } = useVapiAssitants();

  return (
    <div className="border-t bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-6 py-4">
              Assistant
            </TableHead>
            <TableHead className="px-6 py-4">
              Model
            </TableHead>
            <TableHead className="px-6 py-4">
              First Message
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(() => {
            if (isLoading) {
              return (
                <TableRow>
                  <TableCell colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                    Loading assistants...
                  </TableCell>
                </TableRow>
              )
            }

            if (assistants?.length === 0) {
              return (
                <TableRow>
                  <TableCell colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                    No assistants configured
                  </TableCell>
                </TableRow>
              )
            }

            return assistants.map((assistant) => (
              <TableRow key={assistant.id} className="hover:bg-muted/50">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <BotIcon className="size-4 text-muted-foreground" />
                    <span>
                      {assistant.name || "Unnamed Assistant"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  {assistant.model?.model || "Unnamed"}
                </TableCell>
                <TableCell className="max-w-xs px-6 py-4">
                  <p className="truncate text-muted-foreground text-sm">
                    {assistant.firstMessage || "No greeting configured"}
                  </p>
                </TableCell>
              </TableRow>
            ))
          })()}
        </TableBody>
      </Table>
    </div>
  )
}