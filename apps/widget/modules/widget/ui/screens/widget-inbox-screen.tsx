import { ArrowLeftIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { usePaginatedQuery } from "convex/react";
import { useSetAtom, useAtomValue } from "jotai";

import {
  contactSessionIdAtom,
  conversationIdAtom,
  screenAtom,
} from "@/modules/widget/atoms/widget-atoms";
import { api } from "@workspace/backend/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { organizationIdAtom } from "@/modules/widget/atoms/widget-atoms";
import { WidgetHeader } from "@/modules/widget/ui/components/widget-header";
import { WidgetFooter } from "@/modules/widget/ui/components/widget-footer";
import { ConversationStatusIcon } from "@workspace/ui/components/conversation-status-icon";
import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import { InfiniteScrollTrigger } from "@workspace/ui/components/infinite-scroll-trigger";

export function WidgetInboxScreen() {
  const setScreen = useSetAtom(screenAtom);
  const setConversationId = useSetAtom(conversationIdAtom);

  const organizationId = useAtomValue(organizationIdAtom);
  const contactSessionId = useAtomValue(
    contactSessionIdAtom(organizationId || ""),
  );

  const conversations = usePaginatedQuery(
    api.public.conversations.getMany,
    contactSessionId
      ? {
          contactSessionId,
        }
      : "skip",
    { initialNumItems: 10 },
  );

  const { canLoadMore, isLoadingMore, handleLoadMore, topElementRef } =
    useInfiniteScroll({
      status: conversations.status,
      loadMore: conversations.loadMore,
      loadSize: 10,
    });

  return (
    <>
      <WidgetHeader>
        <div className="flex items-center gap-x-2">
          <Button
            variant="transparent"
            size="icon"
            onClick={() => setScreen("selection")}
          >
            <ArrowLeftIcon />
          </Button>
          <p>Inbox</p>
        </div>
      </WidgetHeader>
      <div className="flex flex-1 flex-col gap-y-4 p-4 overflow-y-auto">
        {conversations.results.length > 0 &&
          conversations.results.map((conversation) => (
            <Button
              key={conversation._id}
              variant="outline"
              className="h-20 w-full justify-between"
              onClick={() => {
                setConversationId(conversation._id);
                setScreen("chat");
              }}
            >
              <div className="flex w-full flex-col gap-4 overflow-hidden text-start">
                <div className="flex items-center justify-between gap-x-2 w-full">
                  <p className="text-muted-foreground text-xs">Chat</p>
                  <p className="text-muted-foreground text-xs">
                    {formatDistanceToNow(conversation._creationTime)}
                  </p>
                </div>
                <div className="flex items-center justify-between w-full gap-x-2">
                  <p className="truncate text-sm">
                    {conversation.lastMessage?.text}
                  </p>
                  <ConversationStatusIcon status={conversation.status} />
                </div>
              </div>
            </Button>
          ))}
        <InfiniteScrollTrigger
          canLoadMore={canLoadMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMore}
          ref={topElementRef}
        />
      </div>
      <WidgetFooter />
    </>
  );
}
