/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettingsSelectItem } from '@nocobase/client';
import { error } from '@nocobase/utils/client';
import React, { useEffect, useMemo } from 'react';
import { useThemeId } from '../components/InitializeTheme';
import { useThemeListContext } from '../components/ThemeListProvider';
import { useTranslation } from '../locale';
import { useUpdateThemeSettings } from '../hooks/useUpdateThemeSettings';

export const ThemeSettings = () => {
  const { t } = useTranslation();
  const { run, error: err, data } = useThemeListContext();
  const { updateUserThemeSettings } = useUpdateThemeSettings();
  const { currentThemeId } = useThemeId();
  const options = useMemo(() => {
    return data
      ?.filter((item) => item.optional)
      .map((item) => {
        return {
          label: t(item.config.name),
          value: item.id,
        };
      });
  }, [data, t]);

  useEffect(() => {
    if (!data) {
      run();
    }
  }, []);

  if (err) {
    error(err);
    return null;
  }
  return (
    <SchemaSettingsSelectItem
      title={t('Theme')}
      options={options}
      value={currentThemeId}
      onChange={(value) => {
        updateUserThemeSettings(value);
      }}
    />
  );
};
