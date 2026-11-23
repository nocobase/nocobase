import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { ComponentType } from 'react';

export interface AppHeaderAction {
  readonly id: string;
  readonly component: ComponentType;
}

/** Client service providers register actions before the authenticated shell renders. */
export class AppHeaderActionRegistry {
  private readonly actions = new Map<string, AppHeaderAction>();

  public add(action: AppHeaderAction): void {
    if (this.actions.has(action.id)) {
      throw new Error(
        `App header action "${action.id}" is already registered.`,
      );
    }
    this.actions.set(action.id, action);
  }

  public list(): readonly AppHeaderAction[] {
    return [...this.actions.values()];
  }
}

export const appHeaderActionsToken: ServiceToken<AppHeaderActionRegistry> =
  createServiceToken('@nocobase/app-client/header-actions');
