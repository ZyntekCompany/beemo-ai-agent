import { useState } from "react";
import { useMutation } from "convex/react";
import { useAtomValue, useSetAtom } from "jotai";
import { MessageSquareIcon } from "lucide-react";

import {
  contactSessionIdAtom,
  conversationIdAtom,
  errorMessageAtom,
  organizationIdAtom,
  screenAtom,
} from "@/modules/widget/atoms/widget-atoms";
import { Button } from "@workspace/ui/components/button";
import { api } from "@workspace/backend/_generated/api";
import { WidgetHeader } from "@/modules/widget/ui/components/widget-header";
import { WidgetFooter } from "@/modules/widget/ui/components/widget-footer";

export function WidgetSelectionScreen() {
  const setScreen = useSetAtom(screenAtom);
  const setErrorMessage = useSetAtom(errorMessageAtom);
  const setConversationId = useSetAtom(conversationIdAtom);

  const organizationId = useAtomValue(organizationIdAtom);
  const contactSessionId = useAtomValue(
    contactSessionIdAtom(organizationId || "")
  );
  const [isPending, setIsPending] = useState(false);

  const createConversation = useMutation(api.public.conversations.create);

  const handleNewConversation = async () => {
    if (!organizationId) {
      setScreen("error");
      setErrorMessage("Missing organization ID");
      return;
    }

    if (!contactSessionId) {
      setScreen("auth");
      return;
    }

    setIsPending(true);

    try {
      const conversationId = await createConversation({
        contactSessionId,
        organizationId,
      });

      setConversationId(conversationId);
      setScreen("chat");
    } catch (error) {
      setScreen("auth");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <WidgetHeader>
        <div className="flex flex-col justify-between gap-y-2 px-2 py-6">
          <p className="text-3xl">Hi there!</p>
          <p className="text-lg">Let&apos;s get you started</p>
        </div>
      </WidgetHeader>
      <div className="flex flex-1 flex-col gap-y-4 p-4 overflow-y-auto">
        <p className="text-sm">
          <Button
            className="h-16 w-full justify-between"
            variant="outline"
            onClick={handleNewConversation}
            disabled={isPending}
          >
            <div className="flex items-center gap-x-2">
              <MessageSquareIcon className="size-4" />
              <span>Start chat</span>
            </div>
          </Button>
        </p>
      </div>
      <WidgetFooter />
    </>
  );
}
