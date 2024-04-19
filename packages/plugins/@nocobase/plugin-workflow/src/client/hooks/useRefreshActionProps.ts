import { useResourceActionContext } from '@nocobase/client';

export function useRefreshActionProps() {
  const service = useResourceActionContext();
  return {
    async onClick() {
      service?.refresh?.();
    },
  };
}
