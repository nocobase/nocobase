import { useTranslation } from 'react-i18next';

export const usePluginUtils = () => {
  const { t } = useTranslation('multi-app-manager');
  return { t };
};

export const i18nText = (text) => {
  return `{{t("${text}", { ns: 'multi-app-manager' })}}`;
};
