import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { ComponentType } from 'react';
import type { AppClientRegisteredRoute } from './plugins.js';

export interface AppHeaderAction {
  readonly id: string;
  readonly component: ComponentType;
  /** When set, the action is visible only if this route is registered in the application. */
  readonly routeId?: string;
}

/** Client service providers register actions before the authenticated shell renders. */
export class AppHeaderActionRegistry {
  private readonly actions = new Map<string, AppHeaderAction>();

  private readonly excludedIds: ReadonlySet<string>;
  private readonly routeIds = new Set<string>();

  public constructor(
    routes: readonly AppClientRegisteredRoute[],
    excludedIds: readonly string[] = [],
  ) {
    this.excludedIds = new Set(excludedIds.map((id) => id.trim()));
    const visit = (route: AppClientRegisteredRoute): void => {
      if (route.componentLoader) this.routeIds.add(route.id);
      route.children?.forEach(visit);
    };
    routes.forEach(visit);
  }

  public add(action: AppHeaderAction): void {
    if (this.actions.has(action.id)) {
      throw new Error(
        `App header action "${action.id}" is already registered.`,
      );
    }
    this.actions.set(action.id, action);
  }

  public list(): readonly AppHeaderAction[] {
    return [...this.actions.values()].filter(
      ({ id, routeId }) =>
        !this.excludedIds.has(id) &&
        (routeId === undefined || this.routeIds.has(routeId)),
    );
  }
}

export const appHeaderActionsToken: ServiceToken<AppHeaderActionRegistry> =
  createServiceToken('@nocobase/app-client/header-actions');
