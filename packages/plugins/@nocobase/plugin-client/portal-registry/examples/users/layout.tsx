import { Outlet } from "react-router";

import { ResourceAccessGuard } from "@/components/access-control/resource-access-guard";
import { UserList } from "./list";

export function UserResourceLayout() {
  return (
    <>
      <ResourceAccessGuard resource="users" action="list">
        <UserList />
      </ResourceAccessGuard>
      <Outlet />
    </>
  );
}
