"use client";

import React, { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import {
  ArrowRightIcon,
  ArrowUpIcon,
  CheckIcon,
  CornerUpLeftIcon,
  ListIcon,
} from "lucide-react";
import { usePaginatedQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { getCountryFlagUrl, getCountryFromTimezone } from "@/lib/country-utils";
import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";
import { usePathname } from "next/navigation";
import { DicebearAvatar } from "@workspace/ui/components/dicebear-avatar";
import { formatDistanceToNow } from "date-fns";
import { ConversationStatusIcon } from "@workspace/ui/components/conversation-status-icon";
import { formatMessageTime } from "@/lib/format-time";
import { useAtomValue, useSetAtom } from "jotai";
import {
  statusFilterAtom,
  typeFilterAtom,
} from "@/modules/conversations/atoms";
import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import { InfiniteScrollTrigger } from "@workspace/ui/components/infinite-scroll-trigger";
import { Skeleton } from "@workspace/ui/components/skeleton";

export function ConversationsPanel() {
  const pathname = usePathname();

  const statusFilter = useAtomValue(statusFilterAtom);
  const setStatusFilter = useSetAtom(statusFilterAtom);

  const typeFilter = useAtomValue(typeFilterAtom);
  const setTypeFilter = useSetAtom(typeFilterAtom);

  const effectiveTypeFilter = typeFilter === "widget" ? "all" : typeFilter;

  // Filtro widget oculto en UI; limpiar "widget" persistido en localStorage
  useEffect(() => {
    if (typeFilter === "widget") {
      setTypeFilter("all");
    }
  }, [typeFilter, setTypeFilter]);

  const conversations = usePaginatedQuery(
    api.private.conversations.getMany,
    {
      status: statusFilter === "all" ? undefined : statusFilter,
      type: effectiveTypeFilter === "all" ? undefined : effectiveTypeFilter,
    },
    { initialNumItems: 10 },
  );

  const {
    topElementRef,
    handleLoadMore,
    canLoadMore,
    isLoadingMore,
    isLoadingFirstPage,
  } = useInfiniteScroll({
    status: conversations.status,
    loadMore: conversations.loadMore,
    loadSize: 10,
  });

  return (
    <div className="flex h-full w-full flex-col bg-background text-sidebar-foreground">
      <div className="flex flex-col gap-3.5 border-b p-2">
        <Select
          defaultValue="all"
          onValueChange={(value) =>
            setStatusFilter(
              value as "all" | "unresolved" | "escalated" | "resolved",
            )
          }
          value={statusFilter}
        >
          <SelectTrigger className="h-8 border-none px-1.5 shadow-none ring-0 hover:bg-accent hover:text-accent-foreground focus-visible:ring-0">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <ListIcon className="size-4" />
                <span>All</span>
              </div>
            </SelectItem>
            <SelectItem value="unresolved">
              <div className="flex items-center gap-2">
                <ArrowRightIcon className="size-4" />
                <span>Unresolved</span>
              </div>
            </SelectItem>
            <SelectItem value="escalated">
              <div className="flex items-center gap-2">
                <ArrowUpIcon className="size-4" />
                <span>Escalated</span>
              </div>
            </SelectItem>
            <SelectItem value="resolved">
              <div className="flex items-center gap-2">
                <CheckIcon className="size-4" />
                <span>Resolved</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Tabs
        value={effectiveTypeFilter}
        onValueChange={(value) =>
          setTypeFilter(value as "all" | "whatsapp" | "widget")
        }
      >
        <TabsList className="grid w-full grid-cols-2 h-12 bg-transparent rounded-none border-b">
          <TabsTrigger
            value="all"
            className="data-[state=active]:shadow-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary "
          >
            All
          </TabsTrigger>
          <TabsTrigger
            value="whatsapp"
            className="data-[state=active]:shadow-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary "
          >
            WhatsApp
          </TabsTrigger>
          {/* Oculto temporalmente; no eliminar — volver a grid-cols-3 y quitar hidden */}
          <TabsTrigger
            value="widget"
            hidden
            className="data-[state=active]:shadow-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary "
          >
            Widget
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoadingFirstPage ? (
        <SkeletonConversations />
      ) : (
        <ScrollArea className="max-h-[calc(100vh-101px)]">
          <div className="flex flex-1 w-full flex-col text-sm">
            {conversations.results.map((conversation) => {
              const isLastMessageFromOperator =
                conversation.lastMessage?.message?.role !== "user";

              const country = getCountryFromTimezone(
                conversation.contactSession.metadata?.timezone as string,
              );

              const countryFlagUrl = country?.code
                ? getCountryFlagUrl(country.code)
                : undefined;

              return (
                <Link
                  key={conversation._id}
                  className={cn(
                    "relative flex cursor-pointer items-start gap-3 border-b p-4 py-5 text-sm leading-tight hover:bg-accent hover:text-accent-foreground",
                    pathname === `/conversations/${conversation._id}` &&
                      "bg-accent text-accent-foreground",
                  )}
                  href={`/conversations/${conversation._id}`}
                >
                  <div
                    className={cn(
                      "-translate-y-1/2 absolute top-1/2 left-0 h-[64%] w-1 rounded-br-full rounded-tr-full bg-primary transition-all duration-300 ease-in-out origin-center",
                      pathname === `/conversations/${conversation._id}`
                        ? "scale-y-100 opacity-100"
                        : "scale-y-0 opacity-0",
                    )}
                  />
                  <DicebearAvatar
                    seed={conversation.contactSession._id}
                    size={35}
                    badgeImageUrl={
                      conversation.type === "whatsapp"
                        ? "/icons/whatsapp.svg"
                        : countryFlagUrl
                    }
                    className="shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex w-full items-center gap-2">
                      <span className="truncate font-bold">
                        {conversation.contactSession.name}
                      </span>
                      <span className="ml-auto shrink-0 text-muted-foreground text-xs">
                        {formatDistanceToNow(conversation._creationTime)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <div className="flex w-0 grow items-center gap-1">
                        {isLastMessageFromOperator && (
                          <CornerUpLeftIcon className="size-3 shrink-0 text-muted-foreground" />
                        )}
                        <span
                          className={cn(
                            "line-clamp-1 text-muted-foreground text-xs",
                            !isLastMessageFromOperator &&
                              "font-bold text-black",
                          )}
                        >
                          {conversation.lastMessage?.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {conversation.lastMessage?._creationTime && (
                          <span className="text-[10px] text-muted-foreground">
                            {formatMessageTime(
                              conversation.lastMessage._creationTime,
                            )}
                          </span>
                        )}
                        <ConversationStatusIcon status={conversation.status} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            <InfiniteScrollTrigger
              ref={topElementRef}
              isLoadingMore={isLoadingMore}
              canLoadMore={canLoadMore}
              onLoadMore={handleLoadMore}
            />
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

export const SkeletonConversations = () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="relative flex w-full min-w-0 flex-col p-2">
        <div className="w-full space-y-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-start rounded-lg gap-3 p-4">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center w-full gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="ml-auto h-3 w-12 shrink-0" />
                </div>
                <div className="mt-2">
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
