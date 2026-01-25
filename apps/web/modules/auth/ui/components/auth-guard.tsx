"use client";

import React from "react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

import { SignInView } from "@/modules/auth/ui/views/sign-in-view";
import { AuthLayout } from "@/modules/auth/ui/layouts/auth-layout";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthLoading>
        <AuthLayout>
          <div className="flex flex-col items-center justify-center size-80">
            <DotLottieReact
              src="https://lottie.host/f1a295d5-4f1b-40bc-9f85-a577453f1756/YKZThUeX5M.lottie"
              loop
              autoplay
              className="shrink-0"
            />
          </div>
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
