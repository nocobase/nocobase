/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect } from 'vitest';
import { screen } from '@testing-library/react';

import { CheckDeleteSettingOptions, checkDeleteSetting } from './delete';
import { CheckModalSettingOptions, checkModalSetting } from './modal';
import { CheckSwitchSettingOptions, checkSwitchSetting } from './switch';
import { SelectSettingOptions, checkSelectSetting } from './select';
import { showSettingsMenu } from '../renderSettings';

export * from './delete';
export * from './modal';
export * from './switch';
export * from './select';

export type CheckSettingsOptions =
  | ({ type: 'switch' } & CheckSwitchSettingOptions)
  | ({ type: 'modal' } & CheckModalSettingOptions)
  | ({ type: 'select' } & SelectSettingOptions)
  | ({ type: 'delete' } & CheckDeleteSettingOptions);

const types = {
  switch: checkSwitchSetting,
  modal: checkModalSetting,
  delete: checkDeleteSetting,
  select: checkSelectSetting,
};

export async function checkSettings(list: CheckSettingsOptions[], checkLength = false) {
  if (checkLength) {
    const menuList = screen.getByTestId('schema-settings-menu');
    expect(menuList.querySelectorAll('li[role="menuitem"]')).toHaveLength(list.length);
  }
  for (const item of list) {
    if (!screen.queryByTestId('schema-settings-menu')) {
      await showSettingsMenu();
    }
    const type = item.type;
    const checker = types[type];
    await checker(item as any);
  }
}
