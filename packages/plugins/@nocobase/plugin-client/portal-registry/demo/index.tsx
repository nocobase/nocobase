import { ArrowLeft, ArrowRight, Layers3 } from "lucide-react";
import { useOutlet, useNavigate } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RouteDialog,
  RouteDrawer,
  RoutePage,
  useRouteSurfaceClose,
} from "../index";
import { RouteSurfacePromptGenerator } from "./prompt-generator";
import { routeSurfaceScenarios } from "./scenarios";

const demoBase = "/route-surfaces";

export function RouteSurfacesDemoHome() {
  const navigate = useNavigate();
  const overlay = useOutlet();

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-2">
          <Badge variant="secondary">Route surfaces</Badge>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            URL-backed pages and overlays
          </h1>
          <p className="max-w-3xl text-muted-foreground">
            Keep business content independent from whether it appears as a page,
            drawer, dialog, or nested combination. Every preview below supports a
            direct URL and browser history.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {routeSurfaceScenarios.map((scenario) => (
            <Card key={scenario.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline">Scenario {scenario.number}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {scenario.routeShape}
                  </span>
                </div>
                <CardTitle>{scenario.title}</CardTitle>
                <CardDescription>{scenario.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(scenario.path)}
                >
                  Open preview
                  <ArrowRight />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <RouteSurfacePromptGenerator />
      </div>
      {overlay}
    </>
  );
}

export function DemoDrawerRoute() {
  const navigate = useNavigate();
  const nested = useOutlet();

  return (
    <RouteDrawer
      title="Customer details"
      description="A routed drawer keeps the scenario page mounted behind it."
      closeLabel="Close"
      closeTo={demoBase}
      nested={nested}
    >
      <DemoSurfaceBody
        label="Drawer"
        title="Northwind renewal"
        description="Business content does not know that it is rendered inside a drawer."
      >
        <Button onClick={() => navigate("second")}>
          Open second-level drawer
          <ArrowRight />
        </Button>
      </DemoSurfaceBody>
    </RouteDrawer>
  );
}

export function DemoSecondDrawerRoute() {
  return (
    <RouteDrawer
      title="Renewal activity"
      description="The lower drawer is pushed outward and remains behind the layer mask."
      closeLabel="Close"
      closeTo={`${demoBase}/drawer`}
    >
      <DemoSurfaceBody
        label="Second-level drawer"
        title="Latest review"
        description="Clicking this layer's backdrop closes only the top drawer."
      />
    </RouteDrawer>
  );
}

export function DemoDialogRoute() {
  return (
    <RouteDialog
      title="Approve renewal"
      description="A modal route for a focused decision."
      closeLabel="Close"
      closeTo={demoBase}
    >
      <DemoSurfaceBody
        label="Dialog"
        title="Approval required"
        description="The page stays mounted while the URL represents the active dialog."
      />
    </RouteDialog>
  );
}

export function DemoPageRoute() {
  const nested = useOutlet();

  return (
    <RoutePage closeTo={demoBase}>
      <DemoPageContent nested={nested} />
    </RoutePage>
  );
}

function DemoPageContent({ nested }: { nested: React.ReactNode }) {
  const close = useRouteSurfaceClose();
  const navigate = useNavigate();

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="secondary">Child page</Badge>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Customer workspace
            </h1>
            <p className="text-muted-foreground">
              This route replaces the Demo home instead of rendering inside its Outlet.
            </p>
          </div>
          <Button variant="outline" onClick={() => void close()}>
            <ArrowLeft />
            Back to scenarios
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers3 className="size-5 text-primary" />
              <CardTitle>Page-owned workflow</CardTitle>
            </div>
            <CardDescription>
              A page can still host routed overlays without becoming coupled to their content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("drawer")}>Open page drawer</Button>
          </CardContent>
        </Card>
      </div>
      {nested}
    </>
  );
}

export function DemoPageDrawerRoute() {
  const navigate = useNavigate();
  const nested = useOutlet();

  return (
    <RouteDrawer
      title="Customer activity"
      description="This drawer belongs to the child page route."
      closeLabel="Close"
      closeTo={`${demoBase}/page`}
      nested={nested}
    >
      <DemoSurfaceBody
        label="Page drawer"
        title="Renewal conversation"
        description="Open a dialog above this drawer to test mixed presentation types."
      >
        <Button onClick={() => navigate("dialog")}>
          Open confirmation dialog
          <ArrowRight />
        </Button>
      </DemoSurfaceBody>
    </RouteDrawer>
  );
}

export function DemoPageDrawerDialogRoute() {
  return (
    <RouteDialog
      title="Confirm follow-up"
      description="The dialog is nested in the drawer route subtree."
      closeLabel="Close"
      closeTo={`${demoBase}/page/drawer`}
    >
      <DemoSurfaceBody
        label="Nested dialog"
        title="Schedule a follow-up?"
        description="Closing returns to the drawer; closing the drawer then returns to the page."
      />
    </RouteDialog>
  );
}

function DemoSurfaceBody({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
      <div className="space-y-5">
        <Badge variant="outline">{label}</Badge>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
          <DemoField label="Owner" value="Ada Lovelace" />
          <DemoField label="Status" value="In review" />
          <DemoField label="Value" value="$48,000" />
          <DemoField label="Renewal" value="September 30" />
        </div>
        {children ? <div>{children}</div> : null}
      </div>
    </div>
  );
}

function DemoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
