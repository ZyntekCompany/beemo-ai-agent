import { OrganizationList } from "@clerk/nextjs";
import React from "react";

export function OrgSelectionView() {
  return (
    <OrganizationList
      afterCreateOrganizationUrl="/"
      afterSelectOrganizationUrl="/"
      hidePersonal
      skipInvitationScreen
    />
  );
}
