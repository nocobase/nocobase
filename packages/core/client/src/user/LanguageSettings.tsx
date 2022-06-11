import { Menu, Select } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useCurrentUserContext, useSystemSettings } from '..';
import locale from '../locale';

export const LanguageSettings = () => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const api = useAPIClient();
  const ctx = useCurrentUserContext();
  const { data } = useSystemSettings();
  const enabledLanguages: string[] = data?.data?.enabledLanguages || [];
  if (enabledLanguages.length < 2) {
    return null;
  }
  // console.log('data', data?.data?.enabledLanguages);
  return (
    <Menu.Item
      key="language"
      eventKey={'LanguageSettings'}
      onClick={() => {
        setOpen(true);
      }}
    >
      {t('Language')}{' '}
      <Select
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
    </Menu.Item>
  );
};
