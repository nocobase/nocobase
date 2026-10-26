import { useSettingsLeave } from '../settings/hooks.js';
/** Reuse the application's BrowserRouter-compatible guard for close, history and sidebar navigation. */
export function useFormGuard(dirty: boolean, busy: boolean) {
  const leave = useSettingsLeave(dirty, busy);
  return {
    allowLeave: leave.allow,
    beforeClose: leave.guard,
    guard: leave.dialog,
  };
}
