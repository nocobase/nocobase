import { screen } from '@testing-library/react';

import { CheckDeleteSettingOptions, checkDeleteSetting } from './delete';
import { CheckModalSettingOptions, checkModalSetting } from './modal';
import { CheckSwitchSettingOptions, checkSwitchSetting } from './switch';
import { SelectSettingOptions, checkSelectSetting } from './select';

export * from './delete';
export * from './modal';
export * from './switch';
export * from './select';

type CheckSettingsOptions =
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
    const type = item.type;
    const checker = types[type];
    await checker(item as any);
  }
}
