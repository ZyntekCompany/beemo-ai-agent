import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@workspace/backend/_generated/api';

export function useConversationType(conversationId: string) {
  const conversation = useQuery(api.private.conversations.getOne, {
    conversationId: conversationId as any,
  });

  return {
    conversationId,
    conversation,
    isWhatsApp: conversation?.type === "whatsapp",
    isWidget: conversation?.type === "widget",
    type: conversation?.type,
  };
}
