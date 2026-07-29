import { lazy } from "react";
import { Smartphone } from "lucide-react";
import { Route } from "react-router";

import type { AppExtension } from "@/app/extensions";
import { AuthDemoRoute } from "@/components/auth/demo/auth-demo-route";

const SmsSignInForm = lazy(() => import("./sms-sign-in-form"));
const SmsAuthDemoPage = lazy(() =>
  import("./demo").then((module) => ({ default: module.SmsAuthDemoPage }))
);

const smsAuthExtension: AppExtension = {
  id: "nocobase-auth-sms",
  resources: [
    {
      name: "auth-sms-demo",
      list: "/auth/sms",
      meta: {
        parent: "auth-components",
        label: "SMS",
        icon: <Smartphone />,
        acl: { type: "authenticated" },
      },
    },
  ],
  routes: (
    <Route
      path="/auth/sms"
      element={
        <AuthDemoRoute>
          <SmsAuthDemoPage />
        </AuthDemoRoute>
      }
    />
  ),
  authAdapters: [
    {
      authType: "SMS",
      placement: "form",
      Component: SmsSignInForm,
    },
  ],
};

export default smsAuthExtension;
