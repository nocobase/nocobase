/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel } from '@nocobase/client-v2';
import { define, observable, reaction } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { getTOptions, tExpr } from '../locale';
import { getPortalEntryActionStore } from './portalEntryActionStore';
import type { AppPortalAppItem, AppPortalAppStatus, AppPortalItem, AppPortalsPayload } from './types';
import { getPortalEntryUrl } from './url';

type PortalEntryActionProps = ButtonProps & {
  entryPortal?: AppPortalItem;
  entryPortalTitle?: string;
  entryPortalTargetTitle?: string;
  entryPortalApp?: AppPortalAppItem;
};

const MAIN_APP_NAME = 'main';
const DEFAULT_PORTAL_ICON = 'PartitionOutlined';
const BUTTON_SETTINGS_FLOW_KEY = 'buttonSettings';
const BUTTON_SETTINGS_STEP_KEY = 'general';

type EntryActionAvailability = 'available' | 'unavailable';

function getEntryPortalTitle(entryPortal?: AppPortalItem) {
  return entryPortal?.title || entryPortal?.routePath;
}

function getEntryPortalAppTitle(
  entryPortal?: AppPortalItem,
  entryPortalApp?: AppPortalAppItem,
  t?: (key: string) => string,
) {
  if (!entryPortal) {
    return undefined;
  }
  if (entryPortal.appName === MAIN_APP_NAME) {
    return t?.('Main application') || 'Main';
  }
  return entryPortalApp?.title || entryPortalApp?.name || entryPortal.appName;
}

function getQualifiedEntryPortalTitle(
  entryPortal?: AppPortalItem,
  entryPortalApp?: AppPortalAppItem,
  t?: (key: string) => string,
  title = getEntryPortalTitle(entryPortal),
) {
  const appTitle = getEntryPortalAppTitle(entryPortal, entryPortalApp, t);
  return appTitle && title ? `${appTitle} / ${title}` : title;
}

function getQualifiedEntryPortalTargetTitle(
  entryPortal?: AppPortalItem,
  entryPortalApp?: AppPortalAppItem,
  t?: (key: string) => string,
  title = getEntryPortalTitle(entryPortal),
) {
  const appTitle = getEntryPortalAppTitle(entryPortal, entryPortalApp, t);
  return appTitle && title ? `${appTitle} / ${title}` : title;
}

function getEntryPortalIcon(entryPortal?: AppPortalItem) {
  return entryPortal?.icon || DEFAULT_PORTAL_ICON;
}

function getEntryPortalDisplayTitle(props: PortalEntryActionProps) {
  return props.entryPortalTitle || getEntryPortalTitle(props.entryPortal);
}

function getEntryPortalTargetTitle(props: PortalEntryActionProps, t?: (key: string) => string) {
  return (
    props.entryPortalTargetTitle ||
    getQualifiedEntryPortalTargetTitle(props.entryPortal, props.entryPortalApp, t) ||
    getEntryPortalDisplayTitle(props)
  );
}

function getEntryPortalTargetDescription(props: PortalEntryActionProps, t?: (key: string) => string) {
  const title = getEntryPortalTargetTitle(props, t);
  const routePath = props.entryPortal?.routePath;
  return title && routePath ? `${title} (${routePath})` : title || routePath;
}

function isSamePortal(source: AppPortalItem, target: AppPortalItem) {
  if (source.appName !== target.appName) {
    return false;
  }

  return (!!source.uid && !!target.uid && source.uid === target.uid) || source.routePath === target.routePath;
}

function findAvailablePortal(portal: AppPortalItem | undefined, payload: AppPortalsPayload) {
  if (!portal) {
    return undefined;
  }

  return payload.portals.find((item) => isSamePortal(portal, item));
}

function uniqueStrings(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => !!value))];
}

function shouldUseQualifiedDisplayTitle(payload: AppPortalsPayload) {
  return payload.apps.length > 0 || uniqueStrings(payload.portals.map((portal) => portal.appName)).length > 1;
}

function getEntryPortalSelectionTitle(
  portal: AppPortalItem | undefined,
  payload: AppPortalsPayload,
  t: (key: string) => string,
) {
  const title = getEntryPortalTitle(portal);
  if (!portal || !title) {
    return title;
  }
  const hasSameAppTitleInAnotherLayout = payload.portals.some(
    (candidate) =>
      candidate.appName === portal.appName &&
      getEntryPortalTitle(candidate) === title &&
      candidate.layout !== portal.layout,
  );
  if (!hasSameAppTitleInAnotherLayout) {
    return title;
  }
  return `${title} (${t(portal.layout === 'mobile' ? 'Mobile' : 'Desktop')})`;
}

function getAppStatusValues(status: AppPortalAppItem['status']): AppPortalAppStatus[] {
  if (!status) {
    return [];
  }
  if (typeof status === 'string') {
    return [status];
  }
  return Object.values(status).filter((value): value is AppPortalAppStatus => typeof value === 'string');
}

function getEntryActionAvailabilityByAppStatus(status: AppPortalAppItem['status']): EntryActionAvailability {
  const statusValues = getAppStatusValues(status);
  if (!statusValues.length || statusValues.includes('running')) {
    return 'available';
  }
  return 'unavailable';
}

function findPortalApp(appName: string, payload: AppPortalsPayload, savedApp?: AppPortalAppItem) {
  return payload.apps.find((item) => item.name === appName) || (savedApp?.name === appName ? savedApp : undefined);
}

export class PortalEntryActionModel extends ActionModel {
  declare props: PortalEntryActionProps;
  entryActionAvailability: EntryActionAvailability = 'available';
  private availabilityRequest?: Promise<void>;
  private disposeAppPortalsReaction?: () => void;

  defaultProps: PortalEntryActionProps = {
    type: 'default',
    title: tExpr('Portal'),
    icon: DEFAULT_PORTAL_ICON,
  };

  enableEditType = false;
  enableEditDanger = false;
  enableEditTitle = true;
  enableEditIconOnly = false;

  onInit(options: unknown) {
    super.onInit(options);
    define(this, {
      entryActionAvailability: observable.ref,
    });
    this.syncEntryTitle();
    this.checkEntryPortalAvailability();
  }

  async afterAddAsSubModel() {
    await super.afterAddAsSubModel();
    this.syncEntryTitle();
    await this.checkEntryPortalAvailability();
  }

  protected onMount() {
    super.onMount();
    if (this.disposeAppPortalsReaction) {
      return;
    }

    const app = this.context.app;
    if (!app) {
      return;
    }

    const store = getPortalEntryActionStore(app);
    this.disposeAppPortalsReaction = reaction(
      () => store.revision,
      () => {
        this.checkEntryPortalAvailability();
      },
    );
  }

  protected onUnmount(): void {
    super.onUnmount();
    this.disposeAppPortalsReaction?.();
    this.disposeAppPortalsReaction = undefined;
  }

  setProps(props: PortalEntryActionProps): void;
  setProps(key: string, value: unknown): void;
  setProps(props: PortalEntryActionProps | string, value?: unknown): void {
    if (typeof props === 'string') {
      super.setProps(props, value);
    } else {
      super.setProps(props);
    }
    this.syncEntryTitle();
  }

  getTitle() {
    return super.getTitle() || getEntryPortalDisplayTitle(this.props);
  }

  getTitleFieldDescription() {
    const targetDescription = getEntryPortalTargetDescription(this.props, this.t);
    return targetDescription ? `${this.context.t('Target portal', getTOptions())}: ${targetDescription}` : undefined;
  }

  isEntryActionAvailable() {
    return this.entryActionAvailability === 'available';
  }

  getEntryActionUnavailableMessage() {
    if (this.entryActionAvailability === 'unavailable') {
      return this.context.t('This entry is currently unavailable. Please check the application status.', getTOptions());
    }
    return undefined;
  }

  private isDefaultTitle(title: unknown) {
    return (
      typeof title === 'string' &&
      [this.defaultProps.title, this.context.t('Portal', getTOptions()), 'Portal'].filter(Boolean).includes(title)
    );
  }

  private isDefaultIcon(icon: unknown) {
    return typeof icon === 'string' && icon === DEFAULT_PORTAL_ICON;
  }

  private isAutoTitle(title: unknown, candidates: string[]) {
    return typeof title === 'string' && candidates.includes(title);
  }

  private syncEntryTitle(extraAutoTitleCandidates: string[] = []) {
    const title = getEntryPortalDisplayTitle(this.props);
    const portalTitle = getEntryPortalTitle(this.props.entryPortal);
    const autoTitleCandidates = uniqueStrings([
      portalTitle,
      this.props.entryPortalTitle,
      getEntryPortalTargetTitle(this.props, this.t),
      ...extraAutoTitleCandidates,
    ]);
    if (
      title &&
      (!this.props.title ||
        this.isDefaultTitle(this.props.title) ||
        this.isAutoTitle(this.props.title, autoTitleCandidates))
    ) {
      super.setProps('title', title);
    }
    const icon = getEntryPortalIcon(this.props.entryPortal);
    if (icon && (!this.props.icon || this.isDefaultIcon(this.props.icon))) {
      super.setProps('icon', icon);
    }
    if (title) {
      this.syncTitleStepParams(title, icon, autoTitleCandidates);
    }
  }

  private syncTitleStepParams(title: string, icon?: string | null, autoTitleCandidates: string[] = []) {
    const params = this.getStepParams(BUTTON_SETTINGS_FLOW_KEY, BUTTON_SETTINGS_STEP_KEY) || {};
    const nextParams: { title?: string; icon?: string } = {};
    if (!params.title || this.isDefaultTitle(params.title) || this.isAutoTitle(params.title, autoTitleCandidates)) {
      nextParams.title = title;
    }
    if (icon && (!params.icon || this.isDefaultIcon(params.icon))) {
      nextParams.icon = icon;
    }
    if (Object.keys(nextParams).length) {
      this.setStepParams(BUTTON_SETTINGS_FLOW_KEY, BUTTON_SETTINGS_STEP_KEY, nextParams);
    }
  }

  onClick() {
    const portal = this.props.entryPortal;
    if (!portal || this.hidden || this.entryActionAvailability !== 'available') {
      return;
    }
    const app = this.context.app;
    const payload = app ? getPortalEntryActionStore(app).payload : undefined;
    const currentPortal = payload ? findAvailablePortal(portal, payload) || portal : portal;
    const currentApp = payload?.apps.find((item) => item.name === currentPortal.appName) || this.props.entryPortalApp;
    const url = getPortalEntryUrl(app, currentPortal, currentApp);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private get t() {
    return (key: string) => String(this.context.t(key, getTOptions()));
  }

  private setEntryActionAvailability(availability: EntryActionAvailability) {
    if (this.entryActionAvailability !== availability) {
      this.entryActionAvailability = availability;
    }
  }

  private getAvailabilityForExistingPortal(portal: AppPortalItem, payload: AppPortalsPayload): EntryActionAvailability {
    const currentApp = findPortalApp(portal.appName, payload, this.props.entryPortalApp);
    return getEntryActionAvailabilityByAppStatus(currentApp?.status);
  }

  private syncCurrentPortal(currentPortal: AppPortalItem, payload: AppPortalsPayload) {
    const previousPortal = this.props.entryPortal;
    const previousApp = this.props.entryPortalApp;
    const previousDisplayTitle = getEntryPortalDisplayTitle(this.props);
    const previousTargetTitle = getEntryPortalTargetTitle(this.props, this.t);
    const previousPortalTitle = getEntryPortalSelectionTitle(previousPortal, payload, this.t);
    const previousQualifiedTitle = getQualifiedEntryPortalTitle(
      previousPortal,
      previousApp,
      this.t,
      previousPortalTitle,
    );
    const useQualifiedDisplayTitle = previousDisplayTitle === previousQualifiedTitle;
    const currentApp = payload.apps.find((item) => item.name === currentPortal.appName) || previousApp;
    const currentPortalTitle = getEntryPortalSelectionTitle(currentPortal, payload, this.t);
    const currentDisplayTitle =
      shouldUseQualifiedDisplayTitle(payload) || useQualifiedDisplayTitle
        ? getQualifiedEntryPortalTitle(currentPortal, currentApp, this.t, currentPortalTitle)
        : currentPortalTitle;
    const currentTargetTitle = getQualifiedEntryPortalTargetTitle(
      currentPortal,
      currentApp,
      this.t,
      currentPortalTitle,
    );

    super.setProps({
      entryPortal: currentPortal,
      entryPortalApp: currentApp,
      entryPortalTitle: currentDisplayTitle,
      entryPortalTargetTitle: currentTargetTitle,
    });
    this.syncEntryTitle(
      uniqueStrings([
        previousDisplayTitle,
        previousTargetTitle,
        previousQualifiedTitle,
        getEntryPortalTitle(previousPortal),
      ]),
    );
  }

  private checkEntryPortalAvailability() {
    if (this.availabilityRequest) {
      return this.availabilityRequest;
    }
    this.availabilityRequest = this.loadEntryPortalAvailability().finally(() => {
      this.availabilityRequest = undefined;
    });
    return this.availabilityRequest;
  }

  private async loadEntryPortalAvailability() {
    const portal = this.props.entryPortal;
    const app = this.context.app;
    if (!portal || !app) {
      return;
    }

    try {
      const payload = await getPortalEntryActionStore(app).load();
      const currentPortal = findAvailablePortal(portal, payload);
      if (currentPortal) {
        this.setEntryActionAvailability(this.getAvailabilityForExistingPortal(currentPortal, payload));
        this.syncCurrentPortal(currentPortal, payload);
      } else {
        this.setEntryActionAvailability('unavailable');
      }
    } catch {
      return;
    }
  }
}

PortalEntryActionModel.define({
  label: tExpr('Portal'),
});
