import { MenuProps } from 'antd';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SelectWithTitle, useAPIClient, useSystemSettings } from '..';
import locale from '../locale';

export const useLanguageSettings = () => {
  const { t, i18n } = useTranslation();
  const api = useAPIClient();
  const { data } = useSystemSettings();
  const enabledLanguages: string[] = useMemo(() => data?.data?.enabledLanguages || [], [data?.data?.enabledLanguages]);
  const result = useMemo<MenuProps['items'][0]>(() => {
    return {
      key: 'language',
      eventKey: 'LanguageSettings',
      label: (
        <SelectWithTitle
          title={t('Language')}
          options={Object.keys(locale)
            .filter((lang) => enabledLanguages.includes(lang))
            .map((lang) => {
              return {
                label: locale[lang].label,
                value: lang,
              };
            })}
          defaultValue={i18n.language}
          onChange={async (lang) => {
            await api.resource('users').updateProfile({
              values: {
                appLang: lang,
              },
            });
            api.auth.setLocale(lang);
            window.location.reload();
          }}
        />
      ),
    };
  }, [api, enabledLanguages, i18n, t]);

  if (enabledLanguages.length < 2) {
    return null;
  }

  return result;
};
