import { MenuProps, Select } from 'antd';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useSystemSettings } from '..';
import locale from '../locale';

export const useLanguageSettings = () => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const api = useAPIClient();
  const { data } = useSystemSettings();
  const enabledLanguages: string[] = data?.data?.enabledLanguages || [];
  const result = useMemo<MenuProps['items'][0]>(() => {
    return {
      key: 'language',
      eventKey: 'LanguageSettings',
      onClick: () => {
        setOpen(true);
      },
      label: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {t('Language')}{' '}
          <Select
            data-testid="antd-select"
            popupMatchSelectWidth={false}
            style={{ minWidth: 100 }}
            bordered={false}
            open={open}
            onDropdownVisibleChange={(open) => {
              setOpen(open);
            }}
            options={Object.keys(locale)
              .filter((lang) => enabledLanguages.includes(lang))
              .map((lang) => {
                return {
                  label: locale[lang].label,
                  value: lang,
                };
              })}
            value={i18n.language}
            onChange={async (lang) => {
              await api.resource('users').updateProfile({
                values: {
                  appLang: lang,
                },
              });
              api.auth.setLocale(lang);
              await i18n.changeLanguage(lang);
              window.location.reload();
            }}
          />
        </div>
      ),
    };
  }, [enabledLanguages, i18n, open]);

  if (enabledLanguages.length < 2) {
    return null;
  }

  return result;
};
