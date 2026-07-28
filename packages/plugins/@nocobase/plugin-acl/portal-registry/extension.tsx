import type { AppExtension } from "@/app/extensions";
import { Blocks, PanelsTopLeft, ShieldCheck } from "lucide-react";
import { lazy } from "react";
import { Outlet, Route } from "react-router";
import { LazyAclRoute } from "./demo/lazy-route";

const AclComponentsPage = lazy(() =>
  import("./demo/components").then((module) => ({
    default: module.AclComponentsPage,
  }))
);
const AclPatternsPage = lazy(() =>
  import("./demo").then((module) => ({ default: module.AclPatternsPage }))
);

const nocobaseAclExtension: AppExtension = {
  id: "nocobase-acl",
  resources: [
    {
      name: "acl-integration",
      meta: {
        label: "Access control",
        icon: <ShieldCheck />,
        description: "NocoBase ACL integration for admin applications.",
        acl: { type: "authenticated" },
      },
    },
    {
      name: "acl-components",
      list: "/acl",
      meta: {
        parent: "acl-integration",
        label: "Role switcher",
        icon: <Blocks />,
        acl: { type: "authenticated" },
      },
    },
    {
      name: "acl-patterns",
      list: "/acl/patterns",
      meta: {
        parent: "acl-integration",
        label: "Permission patterns",
        icon: <PanelsTopLeft />,
        acl: { type: "authenticated" },
      },
    },
  ],
  routes: (
    <Route key="nocobase-acl" path="/acl" element={<Outlet />}>
      <Route
        index
        element={
          <LazyAclRoute>
            <AclComponentsPage />
          </LazyAclRoute>
        }
      />
      <Route
        path="patterns"
        element={
          <LazyAclRoute>
            <AclPatternsPage />
          </LazyAclRoute>
        }
      />
    </Route>
  ),
};

export default nocobaseAclExtension;
