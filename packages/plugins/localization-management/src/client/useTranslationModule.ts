import { useAppLangContext } from '@nocobase/client';

export const useTranslationModule = () => {
  const appLang = useAppLangContext();
  const { resources, lang, moment, ...rest } = appLang || {};
  const resourcesKeys = Object.keys(resources).map((item) => `resources.${item}`);
  return [...Object.keys(rest), ...resourcesKeys];
};
