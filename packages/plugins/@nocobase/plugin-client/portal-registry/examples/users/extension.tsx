import type { AppExtension } from "../../../../app/extension";
import { ResourceAccessGuard } from "@/components/access-control/resource-access-guard";
import { UserCreate } from "./create";
import { UserEdit } from "./edit";
import { UserResourceLayout } from "./layout";
import { RoleDetailRoute } from "./role-detail";
import { userRoutes } from "./routes";
import { UserShow } from "./show";
import { UsersRound } from "lucide-react";
import { Route } from "react-router";
import "./locales";

const usersExampleExtension: AppExtension = {
  id: "nocobase-users-example",
  resources: [
    {
      name: "users",
      list: userRoutes.list,
      create: userRoutes.create,
      edit: userRoutes.edit,
      show: userRoutes.show,
      meta: {
        label: "Users",
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
          <ResourceAccessGuard resource="users" action="create">
            <UserCreate />
          </ResourceAccessGuard>
        }
      />
      <Route
        path="edit/:id"
        element={
          <ResourceAccessGuard resource="users" action="edit">
            <UserEdit />
          </ResourceAccessGuard>
        }
      />
      <Route
        path="roles/:roleName"
        element={
          <ResourceAccessGuard resource="roles" action="show">
            <RoleDetailRoute returnTo="list" />
          </ResourceAccessGuard>
        }
      />
      <Route
        path="show/:id"
        element={
          <ResourceAccessGuard resource="users" action="show">
            <UserShow />
          </ResourceAccessGuard>
        }
      >
        <Route
          path="edit"
          element={
            <ResourceAccessGuard resource="users" action="edit">
              <UserEdit returnTo="show" />
            </ResourceAccessGuard>
          }
        />
        <Route
          path="roles/:roleName"
          element={
            <ResourceAccessGuard resource="roles" action="show">
              <RoleDetailRoute returnTo="show" />
            </ResourceAccessGuard>
          }
        />
      </Route>
    </Route>
  ),
};

export default usersExampleExtension;
