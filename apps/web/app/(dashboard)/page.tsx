"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { api } from "@workspace/backend/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { useMutation, useQuery } from "convex/react";

export default function Page() {
  const users = useQuery(api.users.getMany);
  const addUser = useMutation(api.users.add);

  return (
    <div className="flex flex-col justify-center items-center bg-red-50">
      <h1>Apps/Web</h1>
      <UserButton />
      <OrganizationSwitcher hidePersonal />

      <div className="mt-4">
        <Button size="sm" onClick={() => addUser()}>
          Add user
        </Button>
      </div>

      <div className="max-w-sm w-full mx-auto">
        {JSON.stringify(users, null, 2)}
      </div>
    </div>
  );
}
