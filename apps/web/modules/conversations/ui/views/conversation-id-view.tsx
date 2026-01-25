"use client";

import React, { useState, useRef, useEffect } from "react";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { useAction, useMutation, useQuery } from "convex/react";
import { Wand2Icon } from "lucide-react";
import z from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  AIConversation,
  AIConversationContent,
  AIConversationScrollButton,
} from "@workspace/ui/components/ai/conversation";
import {
  AIMessage,
  AIMessageContent,
} from "@workspace/ui/components/ai/message";
import { AIResponse } from "@workspace/ui/components/ai/response";
import {
  AIInput,
  AIInputButton,
  AIInputSubmit,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools,
} from "@workspace/ui/components/ai/input";
import { toUIMessages, useThreadMessages } from "@convex-dev/agent/react";
import { DicebearAvatar } from "@workspace/ui/components/dicebear-avatar";
import { FieldGroup } from "@workspace/ui/components/field";
import { ConversationStatusButton } from "../components/conversation-status-button";
import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import { InfiniteScrollTrigger } from "@workspace/ui/components/infinite-scroll-trigger";
import { cn } from "@workspace/ui/lib/utils";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { isSubscriptionError } from "@/lib/error-utils";
import { Hint } from "@workspace/ui/components/hint";
import { formatMessageTime } from "@/lib/format-time";

const formSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

export function ConversationIdView({
  conversationId,
}: {
  conversationId: Id<"conversations">;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isSubmitting = form.formState.isSubmitting;

  const conversation = useQuery(api.private.conversations.getOne, {
    conversationId,
  });

  const messages = useThreadMessages(
    api.private.messages.getMany,
    conversation?.threadId ? { threadId: conversation.threadId } : "skip",
    { initialNumItems: 10 },
  );

  const { topElementRef, handleLoadMore, canLoadMore, isLoadingMore } =
    useInfiniteScroll({
      status: messages.status,
      loadMore: messages.loadMore,
      loadSize: 10,
    });

  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    if (!isSubmitting && !isEnhancing) {
      textareaRef.current?.focus();
    }
  }, [isSubmitting, isEnhancing]);
  const enhanceResponse = useAction(api.private.messages.enhanceResponse);
  const handleEnhanceResponse = async () => {
    setIsEnhancing(true);
    const currentValue = form.getValues("message");

    try {
      const response = await enhanceResponse({ prompt: currentValue });

      form.setValue("message", response);
    } catch (error) {
      if (isSubscriptionError(error)) {
        toast.error("Pro plan required for this feature");
      } else {
        console.log(error);
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const createMessage = useMutation(api.private.messages.create);
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await createMessage({
        conversationId,
        prompt: values.message,
      });

      form.reset();
    } catch (error) {
      if (isSubscriptionError(error)) {
        toast.error("Pro plan required for this feature");
      } else {
        console.log(error);
      }
    }
  };

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const updateConversationStatus = useMutation(
    api.private.conversations.updateStatus,
  );
  const handleToggleStatus = async () => {
    if (!conversation) return;

    setIsUpdatingStatus(true);
    let newStatus: "unresolved" | "escalated" | "resolved";

    if (conversation.status === "unresolved") {
      newStatus = "escalated";
    } else if (conversation.status === "escalated") {
      newStatus = "resolved";
    } else {
      newStatus = "unresolved";
    }

    try {
      await updateConversationStatus({
        conversationId,
        status: newStatus,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (conversation === undefined || messages.status === "LoadingFirstPage") {
    return <ConversationIdViewLoading />;
  }

  return (
    <div className="flex flex-col h-full bg-muted">
      <div
        className={cn(
          "flex items-center justify-between border-b bg-background p-2.5",
          conversation.type === "widget" && "justify-end",
        )}
      >
        {conversation.type === "whatsapp" && (
          <div className="flex items-center gap-3">
            <DicebearAvatar
              seed={conversation?.contactSessionId ?? "whatsapp"}
              size={32}
            />

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {conversation.contactSession.name}
              </span>
              <span className="text-xs text-muted-foreground bg-muted-foreground/10 px-2 py-1   rounded-sm">
                {conversation.contactSession.email.replace(/^whatsapp:/, "")}
              </span>
            </div>
          </div>
        )}

        {!!conversation && (
          <ConversationStatusButton
            status={conversation.status}
            onClick={handleToggleStatus}
            disabled={isUpdatingStatus}
          />
        )}
      </div>

      <AIConversation className="max-h-[calc(100vh-180px)]">
        <AIConversationContent>
          <InfiniteScrollTrigger
            canLoadMore={canLoadMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            ref={topElementRef}
          />
          {toUIMessages(messages.results ?? []).map((message) => {
            const messageContent =
              (message as { content?: string; text?: string }).content ??
              (message as { text?: string }).text ??
              "";

            const originalMessage = (messages.results ?? []).find(
              (m: any) => m._id === message.id || m.id === message.id,
            ) as any;

            const isUserMessage = message.role === "user";

            const formattedTime = formatMessageTime(
              originalMessage?._creationTime,
            );

            return (
              <AIMessage
                key={message.id}
                from={isUserMessage ? "assistant" : "user"}
              >
                <AIMessageContent>
                  <AIResponse>{messageContent}</AIResponse>
                  {formattedTime && (
                    <div
                      className={cn(
                        "flex mt-0.5",
                        isUserMessage ? "justify-start" : "justify-end",
                      )}
                    >
                      <span
                        className={cn(
                          "text-[10px] font-medium",
                          isUserMessage
                            ? "text-muted-foreground"
                            : "text-primary-foreground/70",
                        )}
                      >
                        {formattedTime}
                      </span>
                    </div>
                  )}
                </AIMessageContent>
                {isUserMessage && (
                  <DicebearAvatar
                    seed={conversation?.contactSessionId ?? "user"}
                    size={32}
                  />
                )}
              </AIMessage>
            );
          })}
        </AIConversationContent>
        <AIConversationScrollButton />
      </AIConversation>

      <div className="p-2">
        <AIInput onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              control={form.control}
              name="message"
              disabled={conversation?.status === "resolved"}
              render={({ field }) => (
                <AIInputTextarea
                  autoFocus
                  ref={textareaRef}
                  disabled={
                    conversation?.status === "resolved" ||
                    form.formState.isSubmitting ||
                    isEnhancing
                  }
                  onChange={field.onChange}
                  value={field.value}
                  placeholder={
                    conversation?.status === "resolved"
                      ? "Esta conversación ha sido resuelta"
                      : "Escribe tu mensaje como un operador..."
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
            <AIInputTools>
              <AIInputButton
                onClick={handleEnhanceResponse}
                disabled={
                  conversation?.status === "resolved" ||
                  isEnhancing ||
                  !form.formState.isValid
                }
              >
                <Wand2Icon />
                {isEnhancing ? "Enhancing..." : "Enhance"}
              </AIInputButton>
            </AIInputTools>
            <AIInputSubmit
              disabled={
                conversation?.status === "resolved" ||
                !form.formState.isValid ||
                form.formState.isSubmitting ||
                isEnhancing
              }
              status="ready"
              type="submit"
            />
          </AIInputToolbar>
        </AIInput>
      </div>
    </div>
  );
}

export const ConversationIdViewLoading = () => {
  return (
    <div className="flex h-full flex-col bg-muted">
      <header className="flex items-center justify-end border-b bg-background p-2.5">
        <Hint text="Loading...">
          <Button
            disabled
            size="sm"
            className="bg-neutral-200 text-neutral-800"
          >
            Loading...
          </Button>
        </Hint>
      </header>
      <AIConversation>
        <AIConversationContent>
          {Array.from({ length: 8 }, (_, index) => {
            const isUser = index % 2 === 0;
            const widths = ["w-48", "w-60", "w-72"];
            const width = widths[index % widths.length];

            return (
              <div
                key={index}
                className={cn(
                  "group flex w-full items-end justify-end gap-2 py-2 [&>div]:max-w-[80%]",
                  isUser ? "is-user" : "is-assistant flex flex-row-reverse",
                )}
              >
                <Skeleton
                  className={`h-9 ${width} rounded-lg bg-neutral-200`}
                />
                <Skeleton className="size-8 rounded-full bg-neutral-200" />
              </div>
            );
          })}
        </AIConversationContent>
      </AIConversation>

      <div className="p-2">
        <AIInput>
          <AIInputTextarea
            disabled
            placeholder="Escribe tu mensaje como un operador..."
          />
          <AIInputToolbar>
            <AIInputTools />
            <AIInputSubmit disabled status="ready" />
          </AIInputToolbar>
        </AIInput>
      </div>
    </div>
  );
};
