import type { useCan as CheckPermission } from '@nocobase/app-plugin-authorization/client';

const demoPermission: typeof CheckPermission = () => ({
  can: false,
  isPending: false,
  error: undefined,
  retry: () => undefined,
});
export { demoPermission as useCan };
