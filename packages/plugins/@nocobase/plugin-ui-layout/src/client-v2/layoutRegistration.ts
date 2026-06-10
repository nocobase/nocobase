/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application, LayoutRegisterOptions } from '@nocobase/client-v2';
import { DEFAULT_ADMIN_UI_LAYOUT, UI_LAYOUT_TYPE_DESKTOP, UI_LAYOUT_TYPE_MOBILE } from '../constants';

export type UiLayoutRuntimeRecord = {
  uid: string;
  title?: string;
  layoutType: string;
  routeName: string;
  routePath: string;
  authCheck: boolean;
  enabled: boolean;
};

type UiLayoutListBody = {
  data?: UiLayoutRuntimeRecord[];
};

type UiLayoutRegistrationApp = {
  apiClient: Pick<Application['apiClient'], 'request'>;
  layoutManager: Pick<Application['layoutManager'], 'hasLayout' | 'registerLayout'>;
};

const ADMIN_LAYOUT_MODEL_CLASS = 'AdminLayoutModel';
const MOBILE_LAYOUT_MODEL_CLASS = 'MobileLayoutModel';
const MOBILE_ROOT_PAGE_MODEL_CLASS = 'MobileRootPageModel';
const MOBILE_CHILD_PAGE_MODEL_CLASS = 'MobileChildPageModel';

const layoutRegisterOptionsByType: Record<
  string,
  Pick<LayoutRegisterOptions, 'layoutModelClass' | 'rootPageModelClass' | 'childPageModelClass'>
> = {
  [UI_LAYOUT_TYPE_DESKTOP]: {
    layoutModelClass: ADMIN_LAYOUT_MODEL_CLASS,
  },
  [UI_LAYOUT_TYPE_MOBILE]: {
    layoutModelClass: MOBILE_LAYOUT_MODEL_CLASS,
    rootPageModelClass: MOBILE_ROOT_PAGE_MODEL_CLASS,
    childPageModelClass: MOBILE_CHILD_PAGE_MODEL_CLASS,
  },
};

export function getUiLayoutModelClass(layoutType: string) {
  return layoutRegisterOptionsByType[layoutType]?.layoutModelClass;
}

function isDefaultAdminUiLayout(record: Pick<UiLayoutRuntimeRecord, 'uid'>) {
  return record.uid === DEFAULT_ADMIN_UI_LAYOUT.uid;
}

export function toUiLayoutRegisterOptions(record: UiLayoutRuntimeRecord): LayoutRegisterOptions | null {
  if (!record.enabled || isDefaultAdminUiLayout(record)) {
    return null;
  }

  const codeDefinedOptions = layoutRegisterOptionsByType[record.layoutType];
  if (!codeDefinedOptions) {
    return null;
  }

  return {
    routeName: record.routeName,
    routePath: record.routePath,
    uid: record.uid,
    ...codeDefinedOptions,
    authCheck: record.authCheck,
  };
}

export async function fetchUiLayouts(apiClient: UiLayoutRegistrationApp['apiClient']) {
  const response = await apiClient.request<UiLayoutListBody>({
    url: 'uiLayouts:listEnabled',
    method: 'get',
    skipNotify: true,
  });
  const records = response?.data?.data;
  return Array.isArray(records) ? records : [];
}

export function registerUiLayoutRecords(
  layoutManager: UiLayoutRegistrationApp['layoutManager'],
  records: UiLayoutRuntimeRecord[],
) {
  for (const record of records) {
    const options = toUiLayoutRegisterOptions(record);
    if (!options || layoutManager.hasLayout(options.routeName)) {
      continue;
    }

    try {
      layoutManager.registerLayout(options);
    } catch (error) {
      console.warn(`[NocoBase] plugin-ui-layout failed to register UI layout '${options.routeName}'.`, error);
    }
  }
}

export async function registerUiLayoutsFromApi(app: UiLayoutRegistrationApp) {
  let records: UiLayoutRuntimeRecord[];
  try {
    records = await fetchUiLayouts(app.apiClient);
  } catch (error) {
    console.warn('[NocoBase] plugin-ui-layout failed to load UI layouts.', error);
    return;
  }

  registerUiLayoutRecords(app.layoutManager, records);
}
