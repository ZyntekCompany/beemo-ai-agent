"use client";

import { Download, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useState } from "react";

export function InstallPrompt() {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || !isInstallable || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-background border rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">
              Install Beemo
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Install the app for quick access and a better experience
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={async () => {
                  await promptInstall();
                }}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Install
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDismissed(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
