"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { Badge } from "@workspace/ui/components/badge";
import { CalendarX, Loader2 } from "lucide-react";
import { GoogleCalendarBrandIcon } from "@/components/google-calendar-brand-icon";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "openid",
  "email",
].join(" ");

function buildOAuthUrl(orgId: string, returnUrl: string): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
  const convexSiteUrl = convexUrl.replace(".convex.cloud", ".convex.site");
  const redirectUri = `${convexSiteUrl}/oauth/google/callback`;

  const state = btoa(JSON.stringify({ orgId, returnUrl }));

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function GoogleCalendarContent() {
  const { organization } = useOrganization();
  const searchParams = useSearchParams();
  const [justConnected, setJustConnected] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const connection = useQuery(api.private.googleCalendar.getConnection, {});
  const deleteConnection = useMutation(api.private.googleCalendar.deleteConnection);

  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      setJustConnected(true);
      // Limpiar el param de la URL sin recargar
      const url = new URL(window.location.href);
      url.searchParams.delete("connected");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  function handleConnect() {
    const orgId = organization?.id;
    if (!orgId) return;
    const returnUrl = window.location.href.split("?")[0] ?? window.location.href;
    const oauthUrl = buildOAuthUrl(orgId, returnUrl);
    window.location.href = oauthUrl;
  }

  async function handleDisconnect() {
    setIsDisconnecting(true);
    try {
      await deleteConnection({});
      setJustConnected(false);
    } finally {
      setIsDisconnecting(false);
    }
  }

  const isLoading = connection === undefined;
  const isConnected = connection !== null && connection !== undefined;

  return (
    <div className="flex min-h-screen flex-col bg-muted p-4 sm:p-6 md:p-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Card className="shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <GoogleCalendarBrandIcon className="h-7 w-7 shrink-0" />
                  Google Calendar
                </CardTitle>
                <CardDescription>
                  Sincroniza las reservas de la barbería con Google Calendar automáticamente.
                </CardDescription>
              </div>
              {isConnected && (
                <Badge variant="secondary" className="gap-1.5 text-green-700 bg-green-100">
                  <GoogleCalendarBrandIcon className="h-3.5 w-3.5" />
                  Conectado
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Separator />

            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : isConnected ? (
              <div className="space-y-4">
                {justConnected && (
                  <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                    ¡Cuenta de Google conectada correctamente! Las reservas nuevas se sincronizarán automáticamente.
                  </div>
                )}

                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <GoogleCalendarBrandIcon className="h-8 w-8 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Cuenta conectada</p>
                      {connection.accountEmail && (
                        <p className="text-sm text-muted-foreground">{connection.accountEmail}</p>
                      )}
                    </div>
                  </div>
                  {connection.connectedAt && (
                    <p className="text-xs text-muted-foreground">
                      Conectado el{" "}
                      {new Date(connection.connectedAt).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleConnect}>
                    Reconectar con otra cuenta
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                  >
                    {isDisconnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Desconectando…
                      </>
                    ) : (
                      <>
                        <CalendarX className="mr-2 h-4 w-4" />
                        Desconectar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border bg-card p-6 flex flex-col items-center text-center gap-4">
                  <GoogleCalendarBrandIcon className="h-10 w-10 opacity-50" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">No hay cuenta conectada</p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Conecta tu cuenta de Google para que las reservas creadas por el agente se agreguen automáticamente a tu calendario.
                    </p>
                  </div>
                  <Button onClick={handleConnect} disabled={!organization}>
                    <GoogleCalendarBrandIcon className="mr-2 h-4 w-4" />
                    Conectar con Google
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function GoogleCalendarPage() {
  return (
    <Suspense>
      <GoogleCalendarContent />
    </Suspense>
  );
}
