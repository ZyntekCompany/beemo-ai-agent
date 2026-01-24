import React from "react";
import { DashboardLayout } from "@/modules/conversations/ui/layouts/dashboard-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
