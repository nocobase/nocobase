/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useSystemSettings, SchemaSettingsSelectItem } from '../../..';
import locale from '../../../locale';

export const LanguageSettings = () => {
  const { t, i18n } = useTranslation();
  const api = useAPIClient();
  const { data } = useSystemSettings() || {};
  const enabledLanguages: string[] = useMemo(() => data?.data?.enabledLanguages || [], [data?.data?.enabledLanguages]);
  if (enabledLanguages.length < 2) {
    return null;
  }
  return (
    <SchemaSettingsSelectItem
      title={t('Language')}
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
        await api.resource('users').updateLang({
          values: {
            appLang: lang,
          },
        });
        api.auth.setLocale(lang);
        window.location.reload();
      }}
    />
  );
};
