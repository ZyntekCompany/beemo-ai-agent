"use client";

import { use } from "react";
import type { FC } from "react";

import { WidgetView } from "@/modules/widget/ui/views/widget-view";

interface Props {
  searchParams: Promise<{ organizationId: string }>;
}

const Page: FC<Props> = ({ searchParams }) => {
  const { organizationId } = use(searchParams);

  return <WidgetView organizationId={organizationId} />;
};

export default Page;
