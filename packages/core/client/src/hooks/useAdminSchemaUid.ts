import { useSystemSettings } from '../system-settings';

export const useAdminSchemaUid = () => {
  const ctx = useSystemSettings();
  return ctx?.data?.data?.options?.adminSchemaUid;
};
