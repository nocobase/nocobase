import {
  Check,
  Eye,
  LayoutPanelTop,
  LockKeyhole,
  Pencil,
  Plus,
  Trash2,
  UserRoundCog,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CanAccess } from "@/components/access-control/can-access";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { RoleConstraint } from "@/lib/nocobase/acl";
import { AclField, AclPage, AclRegion } from "../components/acl-boundary";
import { AclPreviewProvider } from "./acl-preview-provider";
import { AclBoundaryApi } from "./boundary-api";
import { AclScenarioSection } from "./scenario-section";

const demoUsers = [
  {
    id: 1,
    name: "Alex Johnson",
    username: "alex",
    email: "alex@example.com",
    phone: "+1 202 555 0148",
    role: "Administrator",
  },
  {
    id: 2,
    name: "Jamie Chen",
    username: "jamie",
    email: "jamie@example.com",
    phone: "+1 202 555 0186",
    role: "Member",
  },
  {
    id: 3,
    name: "Morgan Lee",
    username: "morgan",
    email: "morgan@example.com",
    phone: "+1 202 555 0162",
    role: "Member",
  },
];

const usersRouteRoles = {
  anyOf: ["admin"],
} satisfies RoleConstraint;

const allowedRegionPermissions = {
  "users:list": {},
  "departments:list": {},
};

const restrictedRegionPermissions = {
  "users:list": {},
};

const allowedActionPermissions = {
  "users:get": {},
  "users:create": {},
  "users:update": {},
  "users:destroy": {},
};

const restrictedActionPermissions = {
  "users:get": {},
  "users:update": {},
  "users:destroy": {},
};

const restrictedRecordPermissions = demoUsers.flatMap((user) => [
  {
    resource: "users",
    action: "update",
    id: user.id,
    allowed: false,
  },
  {
    resource: "users",
    action: "destroy",
    id: user.id,
    allowed: false,
  },
]);

const editableFieldPermissions = {
  "users:update": { fields: ["nickname", "email", "phone"] },
};

const restrictedFieldPermissions = {
  "users:update": { fields: ["nickname"] },
};

export function AclPatternsPage() {
  return (
    <div className="space-y-10 pb-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
          Permission patterns
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Compare the authorized and restricted outcomes of navigation, pages,
          regions, record actions, and form fields using the same fixed data.
        </p>
      </header>

      <AclScenarioSection
        eyebrow="Navigation permission"
        title="Role-restricted routes disappear from navigation"
        description="A route outside the current effective role is removed from the sidebar and its direct URL is guarded. Other accessible navigation remains unchanged."
        prompt={{
          title: "Resource navigation",
          description:
            "Generate application resources, sidebar behavior, and guarded routes backed by NocoBase collections.",
          defaultScene: "User and role administration",
          defaultTarget:
            "Allow administrators to open Users, but remove it from navigation and block its direct URL for other roles.",
          requirements: `- Put role constraints on the route resource through meta.acl.roles using anyOf, allOf, or noneOf.
- Use meta.acl.type = "authenticated" when the route itself is role-controlled and its inner regions perform collection checks.
- Let the Starter filter inaccessible sidebar items and choose the first accessible default route.
- Wrap list, create, show, and edit routes with the Starter CanAccess and provide an AccessDenied fallback.
- Mark non-collection utility pages as authenticated, snippet, route, or acl: false instead of treating them as collections.
- If a parent route is denied but an accessible child remains, navigation must continue to the child route.`,
        }}
      >
        <OutcomeComparison
          allowedTitle="Users permission granted"
          deniedTitle="Users permission denied"
          allowed={
            <AclPreviewProvider roles={["admin"]}>
              <NavigationPreview />
            </AclPreviewProvider>
          }
          denied={
            <AclPreviewProvider roles={["member"]}>
              <NavigationPreview />
            </AclPreviewProvider>
          }
        />
      </AclScenarioSection>

      <AclScenarioSection
        eyebrow="Page permission"
        title="A complete page is either available or replaced"
        description="Page-level permission is useful when the whole route has one business purpose. Denial produces an understandable destination instead of a blank screen."
        prompt={{
          title: "Page permission",
          description:
            "Generate a complete page whose availability depends on NocoBase permissions.",
          defaultScene: "User directory and account administration page",
          defaultTarget:
            "Allow administrators and user managers to render the complete page.",
          requirements: `- Wrap the complete business page with AclPage.
- Use the AclPage roles prop with anyOf, allOf, or noneOf for page-level role access.
- Keep anyOf and allOf for resource permissions when the page also needs collection access.
- Provide a useful page-level fallback instead of rendering an empty screen.
- Keep each inner data region independently protected when the page combines multiple collections.`,
        }}
      >
        <OutcomeComparison
          allowedTitle="Page allowed"
          deniedTitle="Page denied"
          allowed={
            <AclPreviewProvider roles={["user-manager"]}>
              <PagePermissionPreview />
            </AclPreviewProvider>
          }
          denied={
            <AclPreviewProvider roles={["member"]}>
              <PagePermissionPreview />
            </AclPreviewProvider>
          }
        />
      </AclScenarioSection>

      <AclScenarioSection
        eyebrow="Region permission"
        title="Only the protected region changes"
        description="On a page with multiple resources, denying Departments hides only that panel and must not affect the Users table."
        prompt={{
          title: "Region permission",
          description:
            "Generate a multi-resource page where each region follows its own collection ACL.",
          defaultScene: "Organization management dashboard",
          defaultTarget:
            "Keep Users visible while hiding the denied Departments panel.",
          requirements: `- Keep the outer page visible when its page-level permission is satisfied.
- Wrap every collection-backed panel in its own AclRegion.
- Enable each data query only when the corresponding list permission is allowed.
- Use fallback="hidden" so denied regions do not reveal unavailable resources or placeholders.
- Never use permission for one collection to hide unrelated tables or controls.`,
        }}
      >
        <OutcomeComparison
          allowedTitle="Both regions allowed"
          deniedTitle="Departments resource hidden"
          allowed={
            <AclPreviewProvider
              roles={["member"]}
              permissions={allowedRegionPermissions}
            >
              <RegionPreview />
            </AclPreviewProvider>
          }
          denied={
            <AclPreviewProvider
              roles={["member"]}
              permissions={restrictedRegionPermissions}
            >
              <RegionPreview />
            </AclPreviewProvider>
          }
        />
      </AclScenarioSection>

      <AclScenarioSection
        eyebrow="Action and record permission"
        title="Only unavailable actions are removed"
        description="Collection permission controls global actions such as Create. Record ACL metadata controls Edit and Delete for each individual row."
        prompt={{
          title: "Action permission",
          description:
            "Generate a data table whose toolbar and row actions respond to collection and record scopes.",
          defaultScene: "User administration table",
          defaultTarget:
            "Allow all actions for one user record and show a view-only row when update and delete are denied.",
          requirements: `- Use the Starter dataProvider so X-With-ACL-Meta captures NocoBase allowedActions from list, get, and getMany responses.
- Use the built-in Create, Show, Edit, and Delete buttons; do not manually compare user IDs or role names.
- Collection-level denial hides the action everywhere.
- Record-level allowedActions must hide or disable only the affected row action.
- Keep 403 responses authenticated and let NocoBase perform the final action validation.`,
        }}
      >
        <OutcomeComparison
          allowedTitle="Create and row actions allowed"
          deniedTitle="Create, Update, and Delete denied"
          allowed={
            <AclPreviewProvider
              roles={["admin"]}
              permissions={allowedActionPermissions}
            >
              <ActionsPreview />
            </AclPreviewProvider>
          }
          denied={
            <AclPreviewProvider
              roles={["viewer"]}
              permissions={restrictedActionPermissions}
              recordPermissions={restrictedRecordPermissions}
            >
              <ActionsPreview />
            </AclPreviewProvider>
          }
        />
      </AclScenarioSection>

      <AclScenarioSection
        eyebrow="Field permission"
        title="A form can mix editable, read-only, and hidden fields"
        description="Field ACL does not have to hide the complete form. Only protected inputs change, while permitted fields remain usable."
        prompt={{
          title: "Field permission",
          description:
            "Generate a form or detail page whose individual fields follow NocoBase field ACL.",
          defaultScene: "User profile edit form",
          defaultTarget:
            "Allow nickname editing, make email read-only, and hide phone when those fields are denied.",
          requirements: `- Wrap each protected field or field group with AclField.
- Pass the collection resource, application action, and exact field name.
- Choose whether a denied field is hidden, replaced by read-only output, or shown with a custom fallback.
- Do not infer field access from the overall edit permission.
- Submit only values the current UI is allowed to edit; NocoBase still performs final field validation.`,
        }}
      >
        <OutcomeComparison
          allowedTitle="All fields editable"
          deniedTitle="Email read-only and phone hidden"
          allowed={
            <AclPreviewProvider
              roles={["admin"]}
              permissions={editableFieldPermissions}
            >
              <ProfileFormPreview />
            </AclPreviewProvider>
          }
          denied={
            <AclPreviewProvider
              roles={["member"]}
              permissions={restrictedFieldPermissions}
            >
              <ProfileFormPreview />
            </AclPreviewProvider>
          }
        />
      </AclScenarioSection>

      <AclBoundaryApi />
    </div>
  );
}

function OutcomeComparison({
  allowedTitle,
  deniedTitle,
  allowed,
  denied,
}: {
  allowedTitle: string;
  deniedTitle: string;
  allowed: React.ReactNode;
  denied: React.ReactNode;
}) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <div className="min-w-0 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <Check className="size-4" />
          {allowedTitle}
        </div>
        {allowed}
      </div>
      <div className="min-w-0 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
          <LockKeyhole className="size-4" />
          {deniedTitle}
        </div>
        {denied}
      </div>
    </div>
  );
}

function NavigationPreview() {
  return (
    <div className="grid min-h-48 grid-cols-[150px_minmax(0,1fr)] overflow-hidden rounded-xl border bg-background">
      <aside className="border-r bg-muted/35 p-3">
        <div className="mb-3 text-xs font-semibold text-muted-foreground">
          Workspace
        </div>
        <NavItem icon={<LayoutPanelTop />} label="Dashboard" />
        <CanAccess roles={usersRouteRoles}>
          <NavItem icon={<UsersRound />} label="Users" active />
        </CanAccess>
        <NavItem icon={<UserRoundCog />} label="Roles" />
      </aside>
      <div className="flex items-center justify-center p-5 text-center">
        <CanAccess
          roles={usersRouteRoles}
          fallback={
            <div>
              <LayoutPanelTop className="mx-auto size-7 text-muted-foreground" />
              <div className="mt-2 font-medium">Dashboard</div>
              <div className="mt-1 max-w-48 text-xs text-muted-foreground">
                Users is absent from navigation and its direct route is guarded.
              </div>
            </div>
          }
        >
          <div>
            <UsersRound className="mx-auto size-7 text-primary" />
            <div className="mt-2 font-medium">Users</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Route is available
            </div>
          </div>
        </CanAccess>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`mb-1 flex items-center gap-2 rounded-md px-2 py-2 text-xs ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
      }`}
    >
      <span className="[&_svg]:size-3.5">{icon}</span>
      {label}
    </div>
  );
}

function PagePermissionPreview() {
  return (
    <AclPage
      roles={{ anyOf: ["admin", "user-manager"] }}
      fallback={<PageDeniedPreview />}
    >
      <UserDirectoryPreview />
    </AclPage>
  );
}

function UserDirectoryPreview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User directory</CardTitle>
        <CardDescription>3 users</CardDescription>
      </CardHeader>
      <CardContent>
        <CompactUsersTable />
      </CardContent>
    </Card>
  );
}

function PageDeniedPreview() {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed bg-background p-6 text-center">
      <div>
        <LockKeyhole className="mx-auto size-8 text-muted-foreground" />
        <div className="mt-3 font-medium">You cannot open this page</div>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
          Ask an administrator for access to the user directory or return to an
          available page.
        </p>
        <Button className="mt-4" variant="outline" size="sm">
          Return to dashboard
        </Button>
      </div>
    </div>
  );
}

function RegionPreview() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-background p-3 md:flex-row">
      <AclRegion resource="users" action="list">
        <Card size="sm" className="min-w-0 flex-1">
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <CompactUsersTable limit={2} />
          </CardContent>
        </Card>
      </AclRegion>
      <AclRegion resource="departments" action="list">
        <Card size="sm" className="md:w-56">
          <CardHeader>
            <CardTitle>Departments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ResourceRow title="Engineering" name="engineering" />
            <ResourceRow title="Operations" name="operations" />
          </CardContent>
        </Card>
      </AclRegion>
    </div>
  );
}

function ActionsPreview() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Users</CardTitle>
          <CardDescription>Record actions</CardDescription>
        </div>
        <CanAccess resource="users" action="create">
          <Button size="sm">
            <Plus /> New user
          </Button>
        </CanAccess>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-3 font-medium">User</th>
              <th className="pb-3 font-medium">Role</th>
              <th className="pb-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {demoUsers.slice(0, 2).map((user) => (
              <tr key={user.id} className="border-b last:border-0">
                <td className="py-3 font-medium">{user.name}</td>
                <td className="py-3 text-muted-foreground">{user.role}</td>
                <td className="py-3">
                  <div className="flex justify-end gap-1">
                    <CanAccess resource="users" action="show" id={user.id}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="View user"
                      >
                        <Eye />
                      </Button>
                    </CanAccess>
                    <CanAccess resource="users" action="edit" id={user.id}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Edit user"
                      >
                        <Pencil />
                      </Button>
                    </CanAccess>
                    <CanAccess resource="users" action="delete" id={user.id}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete user"
                      >
                        <Trash2 />
                      </Button>
                    </CanAccess>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function ProfileFormPreview() {
  const user = demoUsers[1];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit profile</CardTitle>
        <CardDescription>{user.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AclField resource="users" action="edit" field="nickname">
          <DemoField label="Nickname">
            <Input defaultValue={user.name} />
          </DemoField>
        </AclField>
        <AclField
          resource="users"
          action="edit"
          field="email"
          fallback={
            <DemoField label="Email">
              <div className="rounded-md border bg-muted/45 px-3 py-2 text-sm text-muted-foreground">
                {user.email}
                <Badge className="ml-2" variant="outline">
                  Read only
                </Badge>
              </div>
            </DemoField>
          }
        >
          <DemoField label="Email">
            <Input defaultValue={user.email} />
          </DemoField>
        </AclField>
        <AclField resource="users" action="edit" field="phone">
          <DemoField label="Phone">
            <Input defaultValue={user.phone} />
          </DemoField>
        </AclField>
        <CanAccess resource="users" action="edit">
          <Button size="sm">Save changes</Button>
        </CanAccess>
      </CardContent>
    </Card>
  );
}

function DemoField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium">{label}</span>
      {children}
    </label>
  );
}

function CompactUsersTable({ limit = 3 }: { limit?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[360px] text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-3 font-medium">User</th>
            <th className="pb-3 font-medium">Email</th>
          </tr>
        </thead>
        <tbody>
          {demoUsers.slice(0, limit).map((user) => (
            <tr key={user.id} className="border-b last:border-0">
              <td className="py-3">
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground">
                  {user.username}
                </div>
              </td>
              <td className="py-3 text-muted-foreground">{user.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResourceRow({ title, name }: { title: string; name: string }) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-0.5 font-mono text-xs text-muted-foreground">
        {name}
      </div>
    </div>
  );
}
