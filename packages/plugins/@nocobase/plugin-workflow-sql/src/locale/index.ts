import { useTranslation } from 'react-i18next';

export const NAMESPACE = '@nocobase/plugin-workflow-sql';

export function useLang(key: string, options = {}) {
  const { t } = usePluginTranslation(options);
  return t(key);
}

export function usePluginTranslation(options) {
  return useTranslation(NAMESPACE, options);
}
