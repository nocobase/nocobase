import { useEffect, useState, type PropsWithChildren } from "react";

import { LoadingState } from "@/components/app-shell/loading-state";
import { nocobaseClient } from "@/lib/nocobase/client";
import { setLocalePersistence } from "@/providers/i18n";
import { useSystemSettings } from "@/providers/system-settings";
import { loadServerLocaleResources } from "./server-resources";

export function NocoBaseI18nBootstrap({ children }: PropsWithChildren) {
  const { settings } = useSystemSettings();
  const [ready, setReady] = useState(false);

  useEffect(
    () =>
      setLocalePersistence(async (locale) => {
        if (!nocobaseClient.getToken()) return;
        await nocobaseClient.action("users", "updateLang", {
          method: "POST",
          body: { appLang: locale },
        });
      }),
    []
  );

  useEffect(() => {
    let active = true;
    void loadServerLocaleResources(settings)
      .catch((error) => {
        console.warn("Unable to load NocoBase locale resources", error);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [settings]);

  if (!ready) {
    return <LoadingState className="min-h-80" />;
  }

  return children;
}
