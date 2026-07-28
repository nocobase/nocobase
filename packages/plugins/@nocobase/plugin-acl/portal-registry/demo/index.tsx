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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
        title="Inaccessible resources disappear from navigation"
        description="A denied collection is removed from the sidebar and its direct route is guarded. Other accessible navigation remains unchanged."
        prompt={{
          title: "Resource navigation",
          description:
            "Generate application resources, sidebar behavior, and guarded routes backed by NocoBase collections.",
          defaultScene: "User and role administration",
          defaultTarget:
            "Allow the Users resource but remove Roles from navigation and block its direct URL.",
          requirements: `- Mark collection resources with meta.acl.type = "collection".
- Let the Starter filter inaccessible sidebar items and choose the first accessible default route.
- Wrap list, create, show, and edit routes with ResourceAccessGuard.
- Mark non-collection utility pages as authenticated, snippet, route, or acl: false instead of treating them as collections.
- If a parent route is denied but an accessible child remains, navigation must continue to the child route.`,
        }}
      >
        <OutcomeComparison
          allowedTitle="Users permission granted"
          deniedTitle="Users permission denied"
          allowed={<NavigationPreview showUsers />}
          denied={<NavigationPreview showUsers={false} />}
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
            "Require users:list before rendering the complete page.",
          requirements: `- Wrap the complete business page with AclPage.
- Use anyOf when one accessible collection is enough, or allOf when every permission is required.
- Provide a useful page-level fallback instead of rendering an empty screen.
- Keep each inner data region independently protected when the page combines multiple collections.`,
        }}
      >
        <OutcomeComparison
          allowedTitle="Page allowed"
          deniedTitle="Page denied"
          allowed={<UserDirectoryPreview />}
          denied={<PageDeniedPreview />}
        />
      </AclScenarioSection>

      <AclScenarioSection
        eyebrow="Region permission"
        title="Only the protected region changes"
        description="On a page with multiple data sources, denying Roles must not hide the Users table. The restricted panel can be hidden or replaced with a local explanation."
        prompt={{
          title: "Region permission",
          description:
            "Generate a multi-table page where each region follows its own collection ACL.",
          defaultScene: "Identity administration dashboard",
          defaultTarget:
            "Keep Users visible while replacing the denied Roles panel with a local fallback.",
          requirements: `- Keep the outer page visible when its page-level permission is satisfied.
- Wrap every collection-backed panel in its own AclRegion.
- Enable each data query only when the corresponding list permission is allowed.
- Use fallback="hidden" for optional panels and fallback="forbidden" or a custom ReactNode when the missing region should be explained.
- Never use permission for one collection to hide unrelated tables or controls.`,
        }}
      >
        <OutcomeComparison
          allowedTitle="Both regions allowed"
          deniedTitle="Roles region denied"
          allowed={<RegionPreview showRoles />}
          denied={<RegionPreview showRoles={false} />}
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
          allowed={<ActionsPreview allowed />}
          denied={<ActionsPreview allowed={false} />}
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
          allowed={<ProfileFormPreview restricted={false} />}
          denied={<ProfileFormPreview restricted />}
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

function NavigationPreview({ showUsers }: { showUsers: boolean }) {
  return (
    <div className="grid min-h-48 grid-cols-[150px_minmax(0,1fr)] overflow-hidden rounded-xl border bg-background">
      <aside className="border-r bg-muted/35 p-3">
        <div className="mb-3 text-xs font-semibold text-muted-foreground">
          Workspace
        </div>
        <NavItem icon={<LayoutPanelTop />} label="Dashboard" />
        {showUsers ? (
          <NavItem icon={<UsersRound />} label="Users" active />
        ) : null}
        <NavItem icon={<UserRoundCog />} label="Roles" />
      </aside>
      <div className="flex items-center justify-center p-5 text-center">
        {showUsers ? (
          <div>
            <UsersRound className="mx-auto size-7 text-primary" />
            <div className="mt-2 font-medium">Users</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Route is available
            </div>
          </div>
        ) : (
          <div>
            <LayoutPanelTop className="mx-auto size-7 text-muted-foreground" />
            <div className="mt-2 font-medium">Dashboard</div>
            <div className="mt-1 max-w-48 text-xs text-muted-foreground">
              Users is absent from navigation and its direct route is guarded.
            </div>
          </div>
        )}
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

function RegionPreview({ showRoles }: { showRoles: boolean }) {
  return (
    <div
      className={`grid gap-3 rounded-xl border bg-background p-3 ${
        showRoles
          ? "md:grid-cols-[minmax(0,1.3fr)_minmax(180px,0.7fr)]"
          : "grid-cols-1"
      }`}
    >
      <Card size="sm">
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <CompactUsersTable limit={2} />
        </CardContent>
      </Card>
      {showRoles ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <RoleRow title="Administrator" name="admin" />
            <RoleRow title="Member" name="member" />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ActionsPreview({ allowed }: { allowed: boolean }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Users</CardTitle>
          <CardDescription>Record actions</CardDescription>
        </div>
        {allowed ? (
          <Button size="sm">
            <Plus /> New user
          </Button>
        ) : null}
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
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="View user"
                    >
                      <Eye />
                    </Button>
                    {allowed ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit user"
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete user"
                        >
                          <Trash2 />
                        </Button>
                      </>
                    ) : null}
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

function ProfileFormPreview({ restricted }: { restricted: boolean }) {
  const user = demoUsers[1];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit profile</CardTitle>
        <CardDescription>{user.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DemoField label="Nickname">
          <Input defaultValue={user.name} />
        </DemoField>
        <DemoField label="Email">
          {restricted ? (
            <div className="rounded-md border bg-muted/45 px-3 py-2 text-sm text-muted-foreground">
              {user.email}
              <Badge className="ml-2" variant="outline">
                Read only
              </Badge>
            </div>
          ) : (
            <Input defaultValue={user.email} />
          )}
        </DemoField>
        {!restricted ? (
          <DemoField label="Phone">
            <Input defaultValue={user.phone} />
          </DemoField>
        ) : null}
        <Button size="sm">Save changes</Button>
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

function RoleRow({ title, name }: { title: string; name: string }) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-0.5 font-mono text-xs text-muted-foreground">
        {name}
      </div>
    </div>
  );
}
