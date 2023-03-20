import { useTranslation } from 'react-i18next';

export const usePluginUtils = () => {
  const { t } = useTranslation('multi-app-share-collection');

  return { t };
};

export const i18nText = (text) => {
  return `{{t("${text}", { ns: 'multi-app-share-collection' })}}`;
};
