import { CanAccess } from "@/components/access-control/can-access";
import { Outlet } from "react-router";

import { AccessDenied } from "@/components/access-control/access-denied";
import { UserList } from "./list";

export function UserResourceLayout() {
  return (
    <>
      <CanAccess resource="users" action="list" fallback={<AccessDenied />}>
        <UserList />
      </CanAccess>
      <Outlet />
    </>
  );
}
