import type { ComponentType, ReactElement, ReactNode } from 'react';
import { SettingsShell } from './settings-shell.js';
import {
  aiSettingsPath,
  knowledgeBaseRoutePath,
  vectorDatabaseRoutePath,
} from './route-paths.js';

export interface AISettingsShellProps {
  readonly children: ReactNode;
  /** Fill the scroll viewport on large screens; see `SettingsShell`. */
  readonly fill?: boolean;
}

export function getActiveAISettingsTabKey(
  pathname: string,
  search: string = '',
  state: unknown = undefined,
): string {
  const normalizedPath = pathname.replace(/\/+$/, '');
  if (
    normalizedPath === knowledgeBaseRoutePath ||
    pathname.startsWith(`${knowledgeBaseRoutePath}/`)
  ) {
    return 'knowledge-base';
  }
  if (
    normalizedPath === vectorDatabaseRoutePath ||
    pathname.startsWith(`${vectorDatabaseRoutePath}/`)
  ) {
    return 'vector-database';
  }
  if (normalizedPath === aiSettingsPath) {
    const stateTab =
      state !== null &&
      typeof state === 'object' &&
      'aiSettingsTab' in state &&
      typeof state.aiSettingsTab === 'string'
        ? state.aiSettingsTab
        : undefined;
    return new URLSearchParams(search).get('tab') ?? stateTab ?? 'ai-employee';
  }
  return 'ai-employee';
}

export function AISettingsShell({
  children,
  fill,
}: AISettingsShellProps): ReactElement {
  return (
    <SettingsShell
      title='AI Employees'
      description='employees.pageDescription'
      fill={fill}
    >
      {children}
    </SettingsShell>
  );
}

export function withAISettingsShell(Page: ComponentType): ComponentType {
  function AISettingsRoute(): ReactElement {
    return (
      <AISettingsShell>
        <Page />
      </AISettingsShell>
    );
  }
  AISettingsRoute.displayName = `withAISettingsShell(${Page.displayName ?? Page.name ?? 'Page'})`;
  return AISettingsRoute;
}
