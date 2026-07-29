import { useGetLocale, useList, useTranslate } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { createColumnHelper, type Column } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useCallback, useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router";

import { DataTable } from "@/components/data-table/data-table";
import {
  DataTableFilterCombobox,
  DataTableFilterDropdownText,
} from "@/components/data-table/data-table-filter";
import { DataTableSorter } from "@/components/data-table/data-table-sorter";
import { DeleteButton } from "@/components/resources/buttons/delete";
import { EditButton } from "@/components/resources/buttons/edit";
import { ShowButton } from "@/components/resources/buttons/show";
import { ListView } from "@/components/resources/views/list-view";
import { useAIPageElementHandle } from "./optional-ai";
import type { Role } from "@/lib/nocobase/acl";
import { RoleBadges } from "./role-badges";
import { resolveRoleLabel } from "./role-utils";
import { getRolePath } from "./routes";
import type { RoleRecord, UserRecord } from "./types";

const isRootUser = (record: UserRecord) =>
  record.roles?.some((role) => role.name === "root") ?? false;

function UserColumnHeader<TValue>({
  children,
  column,
  label,
  sortable = true,
}: {
  children?: ReactNode;
  column: Column<UserRecord, TValue>;
  label: string;
  sortable?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <span>{label}</span>
      {sortable ? <DataTableSorter column={column} /> : null}
      {children}
    </div>
  );
}

export const UserList = () => {
  const translate = useTranslate();
  const getLocale = useGetLocale();
  const locale = getLocale();
  const navigate = useNavigate();
  const showRole = useCallback(
    (role: Role) => navigate(getRolePath(role.name)),
    [navigate]
  );
  const { result: rolesResult } = useList<RoleRecord>({
    resource: "roles",
    pagination: { mode: "server", currentPage: 1, pageSize: 200 },
    errorNotification: false,
    queryOptions: { retry: false },
  });
  const roleOptions = useMemo(
    () =>
      rolesResult.data
        .filter((role) => role.name)
        .map((role) => ({
          value: role.name,
          label: resolveRoleLabel(role),
        }))
        .sort((left, right) => left.label.localeCompare(right.label, locale)),
    [locale, rolesResult.data]
  );

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<UserRecord>();

    return [
      columnHelper.accessor("nickname", {
        id: "nickname",
        header: ({ column, table }) => (
          <UserColumnHeader
            column={column}
            label={translate(
              "users.fields.nickname",
              { ns: "app" },
              "Nickname"
            )}
          >
            <DataTableFilterDropdownText
              column={column}
              table={table}
              defaultOperator="contains"
              operators={["contains", "eq", "startswith", "endswith"]}
            />
          </UserColumnHeader>
        ),
        enableSorting: true,
        cell: ({ row, getValue }) =>
          getValue() || row.original.username || row.original.email || "-",
      }),
      columnHelper.accessor("username", {
        id: "username",
        header: ({ column, table }) => (
          <UserColumnHeader
            column={column}
            label={translate(
              "users.fields.username",
              { ns: "app" },
              "Username"
            )}
          >
            <DataTableFilterDropdownText
              column={column}
              table={table}
              defaultOperator="contains"
              operators={["contains", "eq", "startswith", "endswith"]}
            />
          </UserColumnHeader>
        ),
        enableSorting: true,
        cell: ({ getValue }) => getValue() || "-",
      }),
      columnHelper.accessor("email", {
        id: "email",
        header: ({ column, table }) => (
          <UserColumnHeader
            column={column}
            label={translate("users.fields.email", { ns: "app" }, "Email")}
          >
            <DataTableFilterDropdownText
              column={column}
              table={table}
              defaultOperator="contains"
              operators={["contains", "eq", "startswith", "endswith"]}
            />
          </UserColumnHeader>
        ),
        enableSorting: true,
        cell: ({ getValue }) => getValue() || "-",
      }),
      columnHelper.accessor("phone", {
        id: "phone",
        header: ({ column, table }) => (
          <UserColumnHeader
            column={column}
            label={translate("users.fields.phone", { ns: "app" }, "Phone")}
          >
            <DataTableFilterDropdownText
              column={column}
              table={table}
              defaultOperator="contains"
              operators={["contains", "eq", "startswith", "endswith"]}
            />
          </UserColumnHeader>
        ),
        enableSorting: true,
        cell: ({ getValue }) => getValue() || "-",
      }),
      columnHelper.accessor((record) => record.roles, {
        id: "roles.name",
        header: ({ column, table }) => (
          <UserColumnHeader
            column={column}
            label={translate("users.fields.roles", { ns: "app" }, "Roles")}
            sortable={false}
          >
            <DataTableFilterCombobox
              column={column}
              table={table}
              options={roleOptions}
              defaultOperator="in"
              operators={["in", "nin"]}
              placeholder={translate(
                "users.filters.roles.placeholder",
                { ns: "app" },
                "Select roles..."
              )}
              noResultsText={translate(
                "users.filters.roles.noResults",
                { ns: "app" },
                "No roles found."
              )}
              multiple
            />
          </UserColumnHeader>
        ),
        enableSorting: false,
        cell: ({ getValue }) => {
          const roles = getValue() ?? [];
          return <RoleBadges roles={roles} onSelect={showRole} empty="-" />;
        },
      }),
      columnHelper.accessor("createdAt", {
        id: "createdAt",
        header: ({ column }) => (
          <UserColumnHeader
            column={column}
            label={translate(
              "users.fields.createdAt",
              { ns: "app" },
              "Created at"
            )}
          />
        ),
        enableSorting: true,
        cell: ({ getValue }) => {
          const value = getValue();
          return value
            ? new Intl.DateTimeFormat(locale, {
                dateStyle: "medium",
              }).format(new Date(value))
            : "-";
        },
      }),
      columnHelper.display({
        id: "actions",
        header: translate("users.fields.actions", { ns: "app" }, "Actions"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <EditButton
              resource="users"
              recordItemId={row.original.id}
              variant="ghost"
              size="icon"
              aria-label={translate(
                "users.actions.edit",
                { ns: "app" },
                "Edit user"
              )}
              title={translate(
                "users.actions.edit",
                { ns: "app" },
                "Edit user"
              )}
            >
              <Pencil />
            </EditButton>
            <ShowButton
              resource="users"
              recordItemId={row.original.id}
              variant="ghost"
              size="icon"
              aria-label={translate(
                "users.actions.view",
                { ns: "app" },
                "View user"
              )}
              title={translate(
                "users.actions.view",
                { ns: "app" },
                "View user"
              )}
            >
              <Eye />
            </ShowButton>
            {isRootUser(row.original) ? null : (
              <DeleteButton
                resource="users"
                recordItemId={row.original.id}
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                aria-label={translate(
                  "users.actions.delete",
                  { ns: "app" },
                  "Delete user"
                )}
                title={translate(
                  "users.actions.delete",
                  { ns: "app" },
                  "Delete user"
                )}
              >
                <Trash2 />
              </DeleteButton>
            )}
          </div>
        ),
        enableSorting: false,
        size: 144,
      }),
    ];
  }, [locale, roleOptions, showRole, translate]);

  const table = useTable<UserRecord>({
    columns,
    refineCoreProps: {
      resource: "users",
      syncWithLocation: false,
      meta: {
        appends: ["roles"],
      },
      sorters: {
        initial: [{ field: "createdAt", order: "desc" }],
      },
    },
  });

  const tableContext = useAIPageElementHandle({
    id: "users-table",
    title: translate("users.ai.table", { ns: "app" }, "Users table"),
    kind: "table",
    getContext: () => ({
      resource: "users",
      page: table.refineCore.currentPage,
      pageSize: table.refineCore.pageSize,
      total: table.refineCore.tableQuery.data?.total ?? 0,
      rows: (table.refineCore.tableQuery.data?.data ?? []).map((record) => ({
        id: record.id,
        nickname: record.nickname,
        username: record.username,
        email: record.email,
        phone: record.phone,
        roles: record.roles?.map((role) => ({
          name: role.name,
          title: resolveRoleLabel(role),
        })),
        createdAt: record.createdAt,
      })),
    }),
  });

  return (
    <ListView resource="users">
      <div ref={tableContext.ref}>
        <DataTable table={table} />
      </div>
    </ListView>
  );
};
