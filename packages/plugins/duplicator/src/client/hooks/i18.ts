import { useTranslation } from 'react-i18next';

export const usePluginUtils = () => {
  const { t } = useTranslation('duplicator');

  return { t };
};
