import React from 'react'
import { ConversationIdLayout } from '@/modules/dashboard/ui/layouts/conversation-id-layout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ConversationIdLayout>{children}</ConversationIdLayout>;
}
