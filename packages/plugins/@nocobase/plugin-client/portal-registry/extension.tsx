import type { AppExtension } from "../../app/extension";
import { Layers3 } from "lucide-react";
import { Fragment, lazy } from "react";
import { Route } from "react-router";
import { LazyRouteSurfaceDemo } from "./demo/lazy-route";

const exampleModules = import.meta.glob<{ default: AppExtension }>(
  "./examples/*/extension.tsx",
  { eager: true }
);
const exampleExtensions = Object.values(exampleModules)
  .map((module) => module.default)
  .sort((left, right) => left.id.localeCompare(right.id));

const DemoHome = lazy(() =>
  import("./demo").then((module) => ({
    default: module.RouteSurfacesDemoHome,
  }))
);
const DemoDrawer = lazy(() =>
  import("./demo").then((module) => ({ default: module.DemoDrawerRoute }))
);
const DemoSecondDrawer = lazy(() =>
  import("./demo").then((module) => ({
    default: module.DemoSecondDrawerRoute,
  }))
);
const DemoDialog = lazy(() =>
  import("./demo").then((module) => ({ default: module.DemoDialogRoute }))
);
const DemoPage = lazy(() =>
  import("./demo").then((module) => ({ default: module.DemoPageRoute }))
);
const DemoPageDrawer = lazy(() =>
  import("./demo").then((module) => ({
    default: module.DemoPageDrawerRoute,
  }))
);
const DemoPageDrawerDialog = lazy(() =>
  import("./demo").then((module) => ({
    default: module.DemoPageDrawerDialogRoute,
  }))
);

const routeSurfacesExtension: AppExtension = {
  id: "nocobase-route-surfaces",
  resources: [
    {
      name: "route-surfaces",
      list: "/route-surfaces",
      meta: {
        label: "Route surfaces",
        icon: <Layers3 />,
        description: "URL-backed drawer, dialog, page, and nested route patterns.",
        acl: { type: "authenticated" },
      },
    },
    ...exampleExtensions.flatMap((extension) => extension.resources ?? []),
  ],
  routes: (
    <>
      <Route
        key="route-surfaces-overlays"
        path="/route-surfaces"
        element={
          <LazyRouteSurfaceDemo>
            <DemoHome />
          </LazyRouteSurfaceDemo>
        }
      >
        <Route
          path="drawer"
          element={
            <LazyRouteSurfaceDemo>
              <DemoDrawer />
            </LazyRouteSurfaceDemo>
          }
        >
          <Route
            path="second"
            element={
              <LazyRouteSurfaceDemo>
                <DemoSecondDrawer />
              </LazyRouteSurfaceDemo>
            }
          />
        </Route>
        <Route
          path="dialog"
          element={
            <LazyRouteSurfaceDemo>
              <DemoDialog />
            </LazyRouteSurfaceDemo>
          }
        />
      </Route>
      <Route
        key="route-surfaces-page"
        path="/route-surfaces/page"
        element={
          <LazyRouteSurfaceDemo>
            <DemoPage />
          </LazyRouteSurfaceDemo>
        }
      >
        <Route
          path="drawer"
          element={
            <LazyRouteSurfaceDemo>
              <DemoPageDrawer />
            </LazyRouteSurfaceDemo>
          }
        >
          <Route
            path="dialog"
            element={
              <LazyRouteSurfaceDemo>
                <DemoPageDrawerDialog />
              </LazyRouteSurfaceDemo>
            }
          />
        </Route>
      </Route>
      {exampleExtensions.map((extension) => (
        <Fragment key={extension.id}>{extension.routes}</Fragment>
      ))}
    </>
  ),
};

export default routeSurfacesExtension;
