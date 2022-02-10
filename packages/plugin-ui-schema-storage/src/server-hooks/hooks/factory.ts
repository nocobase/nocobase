import { HookType } from '../index';

export function hookFactory(hookType: HookType, hookName: string, hookFunc) {
  return {
    hookType,
    hookName,
    hookFunc,
  };
}
