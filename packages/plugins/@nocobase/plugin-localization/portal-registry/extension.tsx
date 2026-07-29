import type { AppExtension } from "@/app/extensions";
import { LoadingState } from "@/components/app-shell/loading-state";
import { Languages } from "lucide-react";
import { lazy, Suspense } from "react";
import { Route } from "react-router";
import { LanguageUserMenuItems } from "./components";
import "./locales";
import { NocoBaseI18nBootstrap } from "./provider";

const I18nDemoPage = lazy(() =>
  import("./demo").then((module) => ({ default: module.I18nDemoPage }))
);

const nocobaseI18nExtension: AppExtension = {
  id: "nocobase-i18n",
  Provider: NocoBaseI18nBootstrap,
  UserMenuItems: LanguageUserMenuItems,
  resources: [
    {
      name: "i18n-demo",
      list: "/i18n",
      meta: {
        label: "Internationalization",
        i18nKey: "navigation.demo",
        i18nOptions: { ns: "nocobase-i18n" },
        icon: <Languages />,
        description: "Optional frontend internationalization for the Starter.",
        acl: { type: "authenticated" },
      },
    },
  ],
  routes: (
    <Route
      key="nocobase-i18n-demo"
      path="/i18n"
      element={
        <Suspense fallback={<LoadingState className="min-h-80" />}>
          <I18nDemoPage />
        </Suspense>
      }
    />
  ),
};

export default nocobaseI18nExtension;
