import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleSwitcher } from "../components";
import { RoleSwitcherPromptGenerator } from "./role-switcher-prompt-generator";

type PropRow = [
  name: string,
  type: string,
  defaultValue: string,
  description: string
];

const roleSwitcherProps: PropRow[] = [
  [
    "className",
    "string",
    "undefined",
    "Styles the component wrapper so it can fit a toolbar, menu, or settings layout.",
  ],
  [
    "triggerClassName",
    "string",
    "undefined",
    "Styles only the Select trigger without changing the wrapper.",
  ],
  [
    "label",
    "ReactNode | false",
    '"Switch role"',
    "Replaces the field label. Pass false for a compact control without a label.",
  ],
  [
    "showWhenUnavailable",
    "boolean",
    "false",
    "Shows the current role as a non-interactive badge when the user cannot switch roles.",
  ],
];

const roleBehaviors = [
  [
    "Multiple assigned roles",
    "Renders a Select using roles from the signed-in identity.",
  ],
  ["allow-use-union", "Prepends Full permissions using the __union__ role."],
  [
    "only-use-union",
    "Shows Full permissions as the current non-interactive role.",
  ],
  ["allowAnonymous", "Appends Anonymous to the available role options."],
  [
    "One available role",
    "Returns null, or shows the current-role badge when showWhenUnavailable is true.",
  ],
];

export function AclComponentsPage() {
  return (
    <div className="space-y-12 pb-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
          Role switcher
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          A reusable role selector backed by the Starter&apos;s NocoBase ACL
          store and signed-in identity.
        </p>
      </header>

      <section className="space-y-5 border-t pt-8">
        <SectionTitle
          eyebrow="Role selection"
          title="RoleSwitcher"
          description="The component resolves the signed-in user's roles and NocoBase role mode automatically. Business pages only decide its placement and presentation."
        />
        <div className="grid items-start gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Live component</CardTitle>
              <CardDescription>
                Uses the current identity and active NocoBase ACL response.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RoleSwitcher
                showWhenUnavailable
                className="w-full max-w-sm"
                label="Working as"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Unavailable state</CardTitle>
              <CardDescription>
                With one usable role, showWhenUnavailable keeps identity visible
                without presenting a disabled Select.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-9 items-center gap-2 text-sm">
                <ShieldCheck className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Current role</span>
                <Badge variant="secondary">Member</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-5 border-t pt-8">
        <SectionTitle
          eyebrow="Prompt generator"
          title="Place the role switcher in an existing application surface"
          description="Describe the target placement and presentation. The generated prompt integrates the exported component without rebuilding its role-loading or switching behavior."
        />
        <RoleSwitcherPromptGenerator />
      </section>

      <section className="space-y-5 border-t pt-8">
        <SectionTitle
          eyebrow="Component API"
          title="Role switcher props"
          description="Role data, union mode, Anonymous, persistence, and reload behavior are built in rather than exposed as duplicated application props."
        />
        <PropsTable rows={roleSwitcherProps} />
      </section>

      <section className="space-y-5 border-t pt-8">
        <SectionTitle
          eyebrow="Automatic behavior"
          title="Role options follow NocoBase configuration"
          description="These states are derived from the identity and roles:check response, so applications do not maintain a second role list."
        />
        <Card className="gap-0 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Condition</TableHead>
                <TableHead>Rendered behavior</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roleBehaviors.map(([condition, behavior]) => (
                <TableRow key={condition}>
                  <TableCell className="font-medium">{condition}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {behavior}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>
    </div>
  );
}

function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prop</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Default</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([name, type, defaultValue, description]) => (
            <TableRow key={name}>
              <TableCell className="font-mono text-xs font-medium">
                {name}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {type}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {defaultValue}
              </TableCell>
              <TableCell className="min-w-72 whitespace-normal text-muted-foreground">
                {description}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
