import { useGetLocale, useOne, useTranslate } from "@refinedev/core";
import { useParams } from "react-router";

import { LoadingState } from "@/components/app-shell/loading-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAIPageElementHandle } from "./optional-ai";
import { RouteDrawer } from "@/extensions/nocobase-route-surfaces";
import type { Role } from "@/lib/nocobase/acl";
import { resolveTranslatableText } from "@/lib/i18n";
import { resolveRoleLabel } from "./role-utils";
import { getUserShowPath, userRoutes } from "./routes";
import type { RoleRecord } from "./types";

export function RoleDetailRoute({ returnTo }: { returnTo: "list" | "show" }) {
  const { id, roleName } = useParams<{
    id?: string;
    roleName: string;
  }>();

  if (!roleName) return null;

  const closeTarget =
    returnTo === "show" && id ? getUserShowPath(id) : userRoutes.list;

  return <RoleDetailDrawer role={{ name: roleName }} closeTo={closeTarget} />;
}

export function RoleDetailDrawer({
  role,
  closeTo,
}: {
  role?: Role;
  closeTo: string;
}) {
  const translate = useTranslate();
  const getLocale = useGetLocale();
  const locale = getLocale();
  const { result, query } = useOne<RoleRecord>({
    resource: "roles",
    id: role?.name,
    errorNotification: false,
    queryOptions: {
      enabled: Boolean(role?.name),
      retry: false,
    },
  });

  const record = result ?? role ?? { name: "" };
  const title = resolveRoleLabel(record);
  const description = resolveTranslatableText(result?.description, {
    ns: "starter",
  });
  const actions = result?.strategy?.actions ?? [];
  const detailContext = useAIPageElementHandle({
    id: `role-detail-${record.name || "current"}`,
    title: `${translate(
      "roles.ai.detail",
      { ns: "app" },
      "Role details"
    )}: ${title}`,
    kind: "detail",
    getContext: () => ({
      resource: "roles",
      record: {
        name: record.name,
        title,
        description,
        default: result?.default,
        hidden: result?.hidden,
        allowConfigure: result?.allowConfigure,
        actions,
        createdAt: result?.createdAt,
        updatedAt: result?.updatedAt,
      },
    }),
  });

  const formatBoolean = (value?: boolean) => {
    if (typeof value !== "boolean") return "-";
    return value
      ? translate("common.yes", { ns: "app" }, "Yes")
      : translate("common.no", { ns: "app" }, "No");
  };
  const formatDate = (value?: string) =>
    value
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : "-";

  if (!role) return null;

  return (
    <RouteDrawer
      title={title}
      description={translate(
        "roles.drawer.description",
        { ns: "app" },
        "Review the role associated with this user."
      )}
      closeLabel={translate("buttons.close", "Close")}
      closeTo={closeTo}
    >
      <div
        ref={detailContext.ref}
        className="min-h-0 flex-1 overflow-y-auto px-5 py-5"
      >
        {query.isLoading ? (
          <LoadingState className="min-h-48" />
        ) : (
          <div className="space-y-5">
            {query.isError ? (
              <Alert>
                <AlertDescription>
                  {translate(
                    "roles.detail.unavailable",
                    { ns: "app" },
                    "Additional role details are unavailable. Showing the relation data included with the user."
                  )}
                </AlertDescription>
              </Alert>
            ) : null}

            <RoleDetailSection
              title={translate(
                "roles.detail.identity",
                { ns: "app" },
                "Role identity"
              )}
              items={[
                [
                  translate("roles.fields.name", { ns: "app" }, "Name"),
                  role.name,
                ],
                [
                  translate("roles.fields.title", { ns: "app" }, "Title"),
                  title,
                ],
                [
                  translate(
                    "roles.fields.description",
                    { ns: "app" },
                    "Description"
                  ),
                  description || "-",
                ],
              ]}
            />

            <Separator />

            <RoleDetailSection
              title={translate(
                "roles.detail.settings",
                { ns: "app" },
                "Settings"
              )}
              items={[
                [
                  translate(
                    "roles.fields.default",
                    { ns: "app" },
                    "Default role"
                  ),
                  formatBoolean(result?.default),
                ],
                [
                  translate("roles.fields.hidden", { ns: "app" }, "Hidden"),
                  formatBoolean(result?.hidden),
                ],
                [
                  translate(
                    "roles.fields.allowConfigure",
                    { ns: "app" },
                    "Can configure"
                  ),
                  formatBoolean(result?.allowConfigure),
                ],
              ]}
            />

            {actions.length ? (
              <>
                <Separator />
                <section className="space-y-3">
                  <h3 className="text-sm font-medium">
                    {translate(
                      "roles.detail.actions",
                      { ns: "app" },
                      "Allowed actions"
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {actions.map((action) => (
                      <Badge key={action} variant="outline">
                        {action}
                      </Badge>
                    ))}
                  </div>
                </section>
              </>
            ) : null}

            <Separator />

            <RoleDetailSection
              title={translate(
                "roles.detail.timestamps",
                { ns: "app" },
                "Timestamps"
              )}
              items={[
                [
                  translate(
                    "roles.fields.createdAt",
                    { ns: "app" },
                    "Created at"
                  ),
                  formatDate(result?.createdAt),
                ],
                [
                  translate(
                    "roles.fields.updatedAt",
                    { ns: "app" },
                    "Updated at"
                  ),
                  formatDate(result?.updatedAt),
                ],
              ]}
            />
          </div>
        )}
      </div>
    </RouteDrawer>
  );
}

function RoleDetailSection({
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
