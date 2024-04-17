import { iconChecker, IconCheckOptions } from './icon';
import { radioChecker, RadioCheckOptions } from './radio';
import { inputChecker, InputCheckOptions } from './input';

export * from './icon';
export * from './radio';
export * from './icon';

export type FormItemCheckOptions =
  | ({ type: 'icon' } & IconCheckOptions)
  | ({ type: 'radio' } & RadioCheckOptions)
  | ({ type: 'input' } & InputCheckOptions);

const checkers = {
  icon: iconChecker,
  radio: radioChecker,
  input: inputChecker,
};

export async function checkFormItems(list: FormItemCheckOptions[]) {
  for (const item of list) {
    const type = item.type;
    const checker = checkers[type];
    await checker(item as any);
  }
}
