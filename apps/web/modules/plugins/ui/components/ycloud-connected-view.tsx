import React from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { CopyIcon, UnplugIcon } from "lucide-react";
import Image from "next/image";
import { useOrganization } from "@clerk/nextjs";
import toast from "react-hot-toast";

interface YCloudConnectedViewProps {
  onDisconnect: () => void;
}

export function YCloudConnectedView({
  onDisconnect,
}: YCloudConnectedViewProps) {
  const { organization } = useOrganization();

  const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(
    ".convex.cloud",
    ".convex.site"
  );
  const snippet = `${convexSiteUrl}/webhooks/ycloud/${organization?.id}`;

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(snippet);
        toast.success("Webhook URL copied to clipboard");
      } catch (error) {
        toast.error("Failed to copy webhook URL to clipboard");
      }
    }

    return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                alt="WhatsApp logo"
                src="/icons/whatsapp.svg"
                width={48}
                height={48}
                className="object-contain"
              />
              <div>
                <CardTitle>YCloud WhatsApp Connected</CardTitle>
                <CardDescription>
                  Yout WhatsApp Business is connected and ready to
                  receive messages
                </CardDescription>
              </div>
            </div>

            <Button variant="destructive" size="sm" onClick={onDisconnect}>
              <UnplugIcon />
              Disconnect
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook URL</CardTitle>
          <CardDescription>
            Configure this URL in your YCloud dashboard to receive WhatsApp
            messages
          </CardDescription>
          <div className="flex items-center justify-between gap-2 mt-4 p-4 bg-muted-foreground/10 rounded-lg">
            <code className="font-mono text-sm break-all">
              {snippet}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <CopyIcon />
              Copy
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
