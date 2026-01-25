import React from "react";
import { Id } from "@workspace/backend/_generated/dataModel";
import { ConversationIdView } from "@/modules/conversations/ui/views/conversation-id-view";

export default async function Page({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  return (
    <ConversationIdView
      key={conversationId}
      conversationId={conversationId as Id<"conversations">}
    />
  );
}
