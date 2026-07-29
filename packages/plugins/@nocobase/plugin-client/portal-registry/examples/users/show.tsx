import { useGetLocale, useShow, useTranslate } from "@refinedev/core";
import { useNavigate, useOutlet, useParams } from "react-router";
import { Pencil, RotateCw } from "lucide-react";

import { LoadingState } from "@/components/app-shell/loading-state";
import { EditButton } from "@/components/resources/buttons/edit";
import { RefreshButton } from "@/components/resources/buttons/refresh";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { RouteDrawer } from "@/extensions/nocobase-route-surfaces";
import { useAIPageElementHandle } from "./optional-ai";
import { RoleBadges } from "./role-badges";
import { resolveRoleLabel } from "./role-utils";
import { getUserRolePath, userRoutes } from "./routes";
import type { UserRecord } from "./types";

export const UserShow = () => {
  const translate = useTranslate();
  const getLocale = useGetLocale();
  const locale = getLocale();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const nestedDrawer = useOutlet();
  const { result: record, query } = useShow<UserRecord>({
    resource: "users",
    id,
    meta: {
      appends: ["roles"],
    },
  });

  const displayName =
    record?.nickname ||
    record?.username ||
    record?.email ||
    translate("users.detail.unnamed", { ns: "app" }, "Unnamed user");
  const roles = record?.roles ?? [];
  const detailContext = useAIPageElementHandle({
    id: `users-detail-${id ?? "current"}`,
    title: `${translate(
      "users.ai.detail",
      { ns: "app" },
      "User details"
    )}: ${displayName}`,
    kind: "detail",
    getContext: () => ({
      resource: "users",
      record: {
        id: record?.id,
        nickname: record?.nickname,
        username: record?.username,
        email: record?.email,
        phone: record?.phone,
        roles: roles.map((role) => ({
          name: role.name,
          title: resolveRoleLabel(role),
        })),
        createdAt: record?.createdAt,
        updatedAt: record?.updatedAt,
      },
    }),
  });

  const formatDate = (value?: string) =>
    value
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : "-";

  return (
    <RouteDrawer
      title={
        query.isLoading && !record ? (
          <Skeleton className="h-6 w-40" />
        ) : (
          displayName
        )
      }
      description={translate(
        "users.drawer.show.description",
        { ns: "app" },
        "Review this user's identity, contact information, and roles."
      )}
      closeLabel={translate("buttons.close", "Close")}
      closeTo={userRoutes.list}
      nested={nestedDrawer}
      actions={
        record ? (
          <>
            <RefreshButton
              resource="users"
              recordItemId={record.id}
              variant="outline"
              size="icon-sm"
              aria-label={translate("buttons.refresh", "Refresh")}
              title={translate("buttons.refresh", "Refresh")}
            >
              <RotateCw />
            </RefreshButton>
            <EditButton
              resource="users"
              recordItemId={record.id}
              variant="outline"
              size="icon-sm"
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
              onClick={() => navigate("edit")}
            >
              <Pencil />
            </EditButton>
          </>
        ) : null
      }
    >
      <div
        ref={detailContext.ref}
        className="min-h-0 flex-1 overflow-y-auto px-5 py-5"
      >
        {query.isLoading ? (
          <LoadingState className="min-h-64" />
        ) : query.isError ? (
          <Alert variant="destructive">
            <AlertTitle>
              {translate(
                "users.detail.loadError.title",
                { ns: "app" },
                "Unable to load user"
              )}
            </AlertTitle>
            <AlertDescription>
              {translate(
                "users.detail.loadError.description",
                { ns: "app" },
                "The user may no longer exist, or you may not have permission to view it."
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-5">
            <DetailSection
              title={translate(
                "users.detail.identity",
                { ns: "app" },
                "Identity"
              )}
              items={[
                [
                  translate("users.fields.id", { ns: "app" }, "ID"),
                  record?.id ?? "-",
                ],
                [
                  translate("users.fields.nickname", { ns: "app" }, "Nickname"),
                  record?.nickname || "-",
                ],
                [
                  translate("users.fields.username", { ns: "app" }, "Username"),
                  record?.username || "-",
                ],
              ]}
            />

            <Separator />

            <DetailSection
              title={translate(
                "users.detail.contact",
                { ns: "app" },
                "Contact"
              )}
              items={[
                [
                  translate("users.fields.email", { ns: "app" }, "Email"),
                  record?.email || "-",
                ],
                [
                  translate("users.fields.phone", { ns: "app" }, "Phone"),
                  record?.phone || "-",
                ],
              ]}
            />

            <Separator />

            <section className="space-y-3">
              <h3 className="text-sm font-medium">
                {translate("users.detail.access", { ns: "app" }, "Access")}
              </h3>
              <RoleBadges
                roles={roles}
                onSelect={(role) =>
                  id ? navigate(getUserRolePath(id, role.name)) : undefined
                }
                empty={translate(
                  "users.detail.noRoles",
                  { ns: "app" },
                  "No assigned roles"
                )}
              />
            </section>

            <Separator />

            <DetailSection
              title={translate(
                "users.detail.timestamps",
                { ns: "app" },
                "Timestamps"
              )}
              items={[
                [
                  translate(
                    "users.fields.createdAt",
                    { ns: "app" },
                    "Created at"
                  ),
                  formatDate(record?.createdAt),
                ],
                [
                  translate(
                    "users.fields.updatedAt",
                    { ns: "app" },
                    "Updated at"
                  ),
                  formatDate(record?.updatedAt),
                ],
              ]}
            />
          </div>
        )}
      </div>
    </RouteDrawer>
  );
};

function DetailSection({
  title,
  items,
}: {
  title: string;
  items: Array<[label: string, value: string | number]>;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">{title}</h3>
      <dl className="grid gap-4 sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label} className="space-y-1">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-sm font-medium break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
