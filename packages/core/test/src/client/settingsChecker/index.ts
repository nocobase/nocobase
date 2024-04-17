import { CheckDeleteSettingOptions, checkDeleteSetting } from './delete';
import { CheckDialogSettingOptions, checkDialogSetting } from './dialog';
import { CheckSwitchSettingOptions, checkSwitchSetting } from './switch';

export * from './delete';
export * from './dialog';
export * from './switch';

type CheckSettingsOptions =
  | ({ type: 'switch' } & CheckSwitchSettingOptions)
  | ({ type: 'dialog' } & CheckDialogSettingOptions)
  | ({ type: 'delete' } & CheckDeleteSettingOptions);

const types = {
  switch: checkSwitchSetting,
  dialog: checkDialogSetting,
  delete: checkDeleteSetting,
};

export async function checkSettings(list: CheckSettingsOptions[]) {
  for (const item of list) {
    const type = item.type;
    const checker = types[type];
    await checker(item as any);
  }
}
