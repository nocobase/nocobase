import { CanAccess } from "@/components/access-control/can-access";
import { UsersRound } from "lucide-react";
import { Route } from "react-router";

import type { AppExtension } from "../../app/extension";
import { AccessDenied } from "@/components/access-control/access-denied";
import { UserCreate } from "./create";
import { UserEdit } from "./edit";
import { UserResourceLayout } from "./layout";
import { RoleDetailRoute } from "./role-detail";
import { userRoutes } from "./routes";
import { UserShow } from "./show";
import "./locales";

const usersExampleExtension: AppExtension = {
  id: "nocobase-users-example",
  priority: 0,
  resources: [
    {
      name: "users",
      list: userRoutes.list,
      create: userRoutes.create,
      edit: userRoutes.edit,
      show: userRoutes.show,
      meta: {
        label: "Users",
        priority: 1,
        singularLabel: "User",
        i18nKey: "resources.users",
        i18nSingularKey: "resources.user",
        i18nOptions: { ns: "app" },
        descriptionI18nKey: "resources.users.description",
        icon: <UsersRound />,
        description:
          "Manage the people who can sign in and work in this NocoBase application.",
        canCreate: true,
        canDelete: true,
        acl: { type: "collection" },
      },
    },
  ],
  routes: (
    <Route path="/users" element={<UserResourceLayout />}>
      <Route
        path="create"
        element={
          <CanAccess
            resource="users"
            action="create"
            fallback={<AccessDenied />}
          >
            <UserCreate />
          </CanAccess>
        }
      />
      <Route
        path="edit/:id"
        element={
          <CanAccess resource="users" action="edit" fallback={<AccessDenied />}>
            <UserEdit />
          </CanAccess>
        }
      />
      <Route
        path="roles/:roleName"
        element={
          <CanAccess resource="roles" action="show" fallback={<AccessDenied />}>
            <RoleDetailRoute returnTo="list" />
          </CanAccess>
        }
      />
      <Route
        path="show/:id"
        element={
          <CanAccess resource="users" action="show" fallback={<AccessDenied />}>
            <UserShow />
          </CanAccess>
        }
      >
        <Route
          path="edit"
          element={
            <CanAccess
              resource="users"
              action="edit"
              fallback={<AccessDenied />}
            >
              <UserEdit returnTo="show" />
            </CanAccess>
          }
        />
        <Route
          path="roles/:roleName"
          element={
            <CanAccess
              resource="roles"
              action="show"
              fallback={<AccessDenied />}
            >
              <RoleDetailRoute returnTo="show" />
            </CanAccess>
          }
        />
      </Route>
    </Route>
  ),
};

export default usersExampleExtension;
