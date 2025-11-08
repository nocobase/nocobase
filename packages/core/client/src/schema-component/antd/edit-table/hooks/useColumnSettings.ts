/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';

export interface ColumnSettings {
  key: string;
  title: string;
  dataIndex: string;
  visible: boolean;
  fixed?: 'left' | 'right' | false;
  width?: number;
  order?: number;
}

export interface UseColumnSettingsResult {
  getSettings: () => ColumnSettings[] | null;
  saveSettings: (settings: ColumnSettings[]) => void;
  clearSettings: () => void;
}

/**
 * Hook for managing table column settings in localStorage
 */
export const useColumnSettings = (tableId: string): UseColumnSettingsResult => {
  const { t } = useTranslation();
  const STORAGE_KEY = `nocobase_table_column_settings_${tableId}`;

  const getSettings = useCallback((): ColumnSettings[] | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to parse table column settings from localStorage:', error);
      return null;
    }
  }, [STORAGE_KEY]);

  const saveSettings = useCallback(
    (settings: ColumnSettings[]) => {
      try {
        const jsonString = JSON.stringify(settings);
        localStorage.setItem(STORAGE_KEY, jsonString);

        // Trigger custom event to notify Table components
        const customEvent = new CustomEvent('nocobase-table-settings-changed', {
          detail: {
            key: STORAGE_KEY,
            tableId: tableId,
            settings: settings,
          },
        });
        window.dispatchEvent(customEvent);
      } catch (error) {
        console.warn('Failed to save table column settings to localStorage:', error);
        message.error(t('Failed to save table settings'));
      }
    },
    [STORAGE_KEY, tableId, t],
  );

  const clearSettings = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);

      // Trigger custom event to notify Table components
      const customEvent = new CustomEvent('nocobase-table-settings-changed', {
        detail: {
          key: STORAGE_KEY,
          tableId: tableId,
          settings: null,
        },
      });
      window.dispatchEvent(customEvent);
    } catch (error) {
      console.warn('Failed to clear table column settings from localStorage:', error);
      message.error(t('Failed to clear table settings'));
    }
  }, [STORAGE_KEY, tableId, t]);

  return {
    getSettings,
    saveSettings,
    clearSettings,
  };
};
