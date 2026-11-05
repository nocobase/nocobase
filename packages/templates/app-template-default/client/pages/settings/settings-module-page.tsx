import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useEffect,
  useMemo,
  useRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router';

import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#components/ui/tabs';
import { settingsHomeRoute } from '#lib/navigation-transform';

import { useRouteAccess, useRouteTrail } from '../../routing/route-context.js';
import { routeKey } from '../../routing/route-navigation.js';

const TAB_NAVIGATION = 'settingsTabNavigation';

interface SettingsModuleTabsState {
  /** The module group: its pages are the tabs. */
  readonly module?: AppClientRegisteredRoute;
  /** The tabs the viewer may open, in route order. */
  readonly tabs: readonly AppClientRegisteredRoute[];
  /** The tab page the current URL is on. */
  readonly active?: AppClientRegisteredRoute;
}

/**
 * The module the current page belongs to, read from the route trail: a settings module registered as a group has its
 * menu pages as tabs. A direct child group of the settings group is a category rather than a module, so a page placed
 * straight in a category has no tabs.
 */
function useSettingsModuleTabs(): SettingsModuleTabsState {
  const trail = useRouteTrail();
  const { denied } = useRouteAccess();
  return useMemo(() => {
    const pageIndex = trail.findIndex((entry) => entry.route.componentLoader);
    const page = trail[pageIndex]?.route;
    const group = pageIndex > 0 ? trail[pageIndex - 1].route : undefined;
    const parent = pageIndex > 1 ? trail[pageIndex - 2].route : undefined;
    if (!page || !group || group.componentLoader || settingsHomeRoute(group))
      return { tabs: [], active: page };
    if (parent && settingsHomeRoute(parent)) return { tabs: [], active: page };
    const tabs = (group.children ?? []).filter(
      (child) =>
        child.componentLoader &&
        child.navigation &&
        !denied.has(routeKey(child)),
    );
    return { module: group, tabs, active: page };
  }, [trail, denied]);
}

/**
 * The frame of a settings module page. When the module has several views it is a route group whose pages are its tabs:
 * each tab is its own URL, so refresh, bookmarks and Back keep the view, and a tab the viewer may not open is not
 * shown. A module with one view the viewer may open shows no tab bar.
 */
export function SettingsModulePage({
  title,
  description,
  actions,
  children,
}: {
  /** Defaults to the module group's navigation title. */
  readonly title?: string;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { module, tabs, active } = useSettingsModuleTabs();
  const { loading } = useRouteAccess();
  const activeRef = useRef<HTMLButtonElement>(null);
  const focusedRef = useRef(false);
  const moduleTitle = module?.navigation
    ? t(module.navigation.title, {
        ns: module.packageName,
        defaultValue: module.navigation.title,
      })
    : undefined;
  const heading = title ?? moduleTitle;
  // Until the shell's permission check answers, a tab the viewer may not open could still be listed.
  const showTabs = !loading && tabs.length > 1 && active !== undefined;
  // Each tab is a route, so switching remounts the page; keep keyboard focus on the selected tab.
  useEffect(() => {
    if (
      !focusedRef.current &&
      location.state &&
      typeof location.state === 'object' &&
      Reflect.get(location.state, TAB_NAVIGATION) === true &&
      activeRef.current
    ) {
      const frame = requestAnimationFrame(() => {
        const selected = activeRef.current;
        if (selected) {
          if (
            !selected
              .closest('[role="tablist"]')
              ?.contains(selected.ownerDocument.activeElement)
          )
            selected.focus();
          focusedRef.current = true;
        }
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [location.state, tabs]);
  const header = (
    <PageHeader title={heading} description={description} actions={actions} />
  );
  // Keep the content under the same frame while permissions reload or the tab count changes.
  const value = active ? routeKey(active) : 'settings-content';
  return (
    <PageContainer>
      {header}
      <Tabs
        className='gap-6'
        value={value}
        onValueChange={(next) => {
          const tab = tabs.find((candidate) => routeKey(candidate) === next);
          if (tab && tab !== active)
            void navigate(tab.path, { state: { [TAB_NAVIGATION]: true } });
        }}
      >
        {/* Many tabs scroll sideways on a narrow screen instead of widening the page. */}
        {showTabs ? (
          <div className='-mx-1 max-w-full overflow-x-auto px-1'>
            <TabsList variant='line' aria-label={heading}>
              {tabs.map((tab) => (
                <TabsTrigger
                  key={routeKey(tab)}
                  ref={tab === active ? activeRef : undefined}
                  value={routeKey(tab)}
                >
                  {tab.navigation
                    ? t(tab.navigation.title, {
                        ns: tab.packageName,
                        defaultValue: tab.navigation.title,
                      })
                    : null}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        ) : null}
        <TabsContent value={value} className='space-y-6'>
          {children}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
