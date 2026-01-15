import z from "zod";
import { Controller, useForm } from "react-hook-form";
import { useAtomValue, useSetAtom } from "jotai";
import { useAction, useQuery } from "convex/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, MenuIcon } from "lucide-react";
import { toUIMessages, useThreadMessages } from "@convex-dev/agent/react";

import {
  contactSessionIdAtom,
  conversationIdAtom,
  organizationIdAtom,
  screenAtom,
} from "@/modules/widget/atoms/widget-atoms";
import {
  AIConversation,
  AIConversationContent,
} from "@workspace/ui/components/ai/conversation";
import {
  AIMessage,
  AIMessageContent,
} from "@workspace/ui/components/ai/message";
import { AIResponse } from "@workspace/ui/components/ai/response";
import {
  AIInput,
  AIInputSubmit,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools,
} from "@workspace/ui/components/ai/input";
import { api } from "@workspace/backend/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { WidgetHeader } from "@/modules/widget/ui/components/widget-header";
import { FieldGroup } from "@workspace/ui/components/field";
import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import { InfiniteScrollTrigger } from "@workspace/ui/components/infinite-scroll-trigger";
import { DicebearAvatar } from "@workspace/ui/components/dicebear-avatar";

const formSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

export function WidgetChatScreen() {
  const setScreen = useSetAtom(screenAtom);
  const setConversationId = useSetAtom(conversationIdAtom);

  const conversationId = useAtomValue(conversationIdAtom);
  const organizationId = useAtomValue(organizationIdAtom);
  const contactSessionId = useAtomValue(
    contactSessionIdAtom(organizationId || "")
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  const back = () => {
    setConversationId(null);
    setScreen("selection");
  };

  const conversation = useQuery(
    api.public.conversations.getOne,
    conversationId && contactSessionId
      ? {
          conversationId,
          contactSessionId,
        }
      : "skip"
  );

  const messages = useThreadMessages(
    api.public.messages.getMany,
    conversation?.threadId && contactSessionId
      ? { threadId: conversation.threadId, contactSessionId }
      : "skip",
    { initialNumItems: 10 }
  );

  const {
    canLoadMore,
    isLoadingMore,
    handleLoadMore,
    isExhausted,
    isLoadingFirstPage,
    topElementRef,
  } = useInfiniteScroll({
    status: messages.status,
    loadMore: messages.loadMore,
    loadSize: 10,
  });

  const createMessage = useAction(api.public.messages.create);
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!conversation || !contactSessionId) {
      return;
    }

    form.reset();

    await createMessage({
      threadId: conversation.threadId,
      prompt: values.message,
      contactSessionId,
    });
  };

  return (
    <>
      <WidgetHeader className="flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <Button size="icon" variant="transparent" onClick={back}>
            <ArrowLeftIcon />
          </Button>
          <p>Chat</p>
        </div>
        <Button size="icon" variant="transparent">
          <MenuIcon />
        </Button>
      </WidgetHeader>
      <AIConversation>
        <AIConversationContent>
          <InfiniteScrollTrigger
            canLoadMore={canLoadMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            ref={topElementRef}
          />
          {toUIMessages(messages.results ?? [])?.map((message) => {
            return (
              <AIMessage
                from={message.role === "user" ? "user" : "assistant"}
                key={message.id}
              >
                <AIMessageContent>
                  <AIResponse>{message.content}</AIResponse>
                </AIMessageContent>
                {message.role === "assistant" && (
                  <DicebearAvatar
                    seed="assistant"
                    imageUrl="/icons/agent-logo.svg"
                    size={32}
                  />
                )}
              </AIMessage>
            );
          })}
        </AIConversationContent>
      </AIConversation>
      <AIInput
        className="rounded-none border-x-0 border-b-0"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FieldGroup>
          <Controller
            control={form.control}
            name="message"
            disabled={conversation?.status === "resolved"}
            render={({ field }) => (
              <AIInputTextarea
                disabled={conversation?.status === "resolved"}
                onChange={field.onChange}
                value={field.value}
                placeholder={
                  conversation?.status === "resolved"
                    ? "Esta conversación ha sido resuelta"
                    : "Escribe tu mensaje..."
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    form.handleSubmit(onSubmit)();
                  }
                }}
              />
            )}
          />
        </FieldGroup>
        <AIInputToolbar>
          <AIInputTools />
          <AIInputSubmit
            disabled={conversation?.status === "resolved"}
            status="ready"
            type="submit"
          />
        </AIInputToolbar>
      </AIInput>
    </>
  );
}
