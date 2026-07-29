import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PropRow = [
  name: string,
  type: string,
  defaultValue: string,
  description: string
];

const canAccessProps: PropRow[] = [
  [
    "roles",
    "RoleConstraint",
    "undefined",
    "Checks the current effective roles with anyOf, allOf, and noneOf.",
  ],
  [
    "resource / action",
    "string",
    "undefined",
    "Checks a NocoBase resource action. When roles are also present, both checks must pass.",
  ],
  [
    "id / field",
    "BaseKey / string",
    "undefined",
    "Optionally narrows the decision to one record or field.",
  ],
  [
    "fallback",
    "ReactNode",
    "null",
    "Renders when the access request is denied.",
  ],
];

const pageProps: PropRow[] = [
  [
    "anyOf",
    "AclPermission[]",
    "undefined",
    "Allows the page when any listed permission is available.",
  ],
  [
    "allOf",
    "AclPermission[]",
    "undefined",
    "Requires every listed permission before rendering the page.",
  ],
  [
    "roles",
    "RoleConstraint",
    "undefined",
    "Requires the current effective roles to match anyOf, allOf, and noneOf constraints.",
  ],
  [
    "fallback",
    "ReactNode",
    "AccessDenied",
    "Replaces the complete page when its permission test fails.",
  ],
  ["children", "ReactNode", "required", "The protected page content."],
];

const regionProps: PropRow[] = [
  [
    "resource",
    "string",
    "required",
    "NocoBase collection or ACL resource name.",
  ],
  [
    "action",
    "string",
    "required",
    "Resource action such as list, show, create, edit, or delete.",
  ],
  [
    "id",
    "BaseKey",
    "undefined",
    "Optional record ID for record-scoped permission checks.",
  ],
  [
    "dataSourceKey",
    "string",
    "undefined",
    "Selects a non-main NocoBase data source.",
  ],
  [
    "fallback",
    '"hidden" | "forbidden" | ReactNode',
    '"hidden"',
    "Hides the region or replaces it with a local denied state.",
  ],
  ["children", "ReactNode", "required", "The protected page region."],
];

const fieldProps: PropRow[] = [
  [
    "resource",
    "string",
    "required",
    "NocoBase collection containing the field.",
  ],
  [
    "action",
    "string",
    "required",
    "The action whose field whitelist should be checked.",
  ],
  ["field", "string", "required", "Exact NocoBase field name."],
  [
    "dataSourceKey",
    "string",
    "undefined",
    "Selects a non-main NocoBase data source.",
  ],
  [
    "fallback",
    "ReactNode",
    "null",
    "Optional read-only replacement for a denied field.",
  ],
  ["children", "ReactNode", "required", "The protected field or field group."],
];

const runtimeApis: PropRow[] = [
  [
    "AclStoreProvider",
    "{ store, children }",
    "required",
    "Connects React ACL hooks and components to the application aclStore. The Starter mounts it at the application root.",
  ],
  [
    "useGetRoles",
    "() => QueryResult<string[]>",
    "-",
    "Returns the current effective ACL role names, including all participating roles in union mode.",
  ],
];

export function AclBoundaryApi() {
  return (
    <section className="space-y-5 border-t pt-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Permission boundaries
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">
          Components behind the patterns
        </h2>
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">
          Use the smallest boundary that matches the intended user experience:
          complete page, independent region, or individual field.
        </p>
      </div>
      <div className="space-y-7">
        <ComponentApi
          title="CanAccess"
          description="The Starter access boundary for role-only, resource-only, or combined permission checks."
          rows={canAccessProps}
        />
        <ComponentApi
          title="AclPage"
          description="Protects a complete route or business page. This corresponds to the Page permission pattern above."
          rows={pageProps}
        />
        <ComponentApi
          title="AclRegion"
          description="Protects one independent area inside a larger page. This corresponds to the Region permission pattern."
          rows={regionProps}
        />
        <ComponentApi
          title="AclField"
          description="Protects one field or field group. This corresponds to the Field permission pattern."
          rows={fieldProps}
        />
        <ComponentApi
          title="ACL context APIs"
          description="Read the active role context from the application ACL store. Demo previews use an isolated in-memory store with the same evaluator."
          rows={runtimeApis}
        />
      </div>
    </section>
  );
}

function ComponentApi({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: PropRow[];
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
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
            {rows.map(([name, type, defaultValue, propDescription]) => (
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
                  {propDescription}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
