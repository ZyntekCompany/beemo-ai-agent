"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";

import { SignInView } from "@/modules/auth/ui/views/sign-in-view";
import { AuthLayout } from "@/modules/auth/ui/layouts/auth-layout";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthLoading>
        <AuthLayout>
          <Loader2 className="size-20 animate-spin" />
        </AuthLayout>
      </AuthLoading>

      <Authenticated>{children}</Authenticated>

      <Unauthenticated>
        <AuthLayout>
          <SignInView />
        </AuthLayout>
      </Unauthenticated>
    </>
  );
}
