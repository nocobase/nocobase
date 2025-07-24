/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemo, useState, useEffect } from 'react';
import { useFieldSchema } from '@formily/react';
import { useColumnSettings, ColumnSettings } from './useColumnSettings';

export interface TableColumnProps {
  key: string;
  dataIndex: string;
  columnHidden: boolean;
  fixed?: 'left' | 'right' | false;
  width?: number;
  _orderIndex?: number;
  [key: string]: any;
}

/**
 * Hook to integrate EditTable column settings with Table columns
 * This hook handles the merging of saved column settings with schema columns
 * @param originalColumns - The original columns from schema
 * @param enable - Whether to enable integration logic; if false, returns originalColumns directly
 */
export const useTableColumnIntegration = (originalColumns: TableColumnProps[], enable = true) => {
  const fieldSchema = useFieldSchema();

  // Get table ID for localStorage
  const tableId = fieldSchema?.['x-uid'] || 'default';
  const { getSettings } = useColumnSettings(tableId);

  // Add refresh trigger to force re-reading localStorage
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Listen for localStorage changes (cross-tab) and custom events (same-tab)
  useEffect(() => {
    const handleCustomStorageChange = (event: CustomEvent) => {
      const { key, tableId: eventTableId } = event.detail;

      // Only refresh if this is the target table
      if (key.includes(tableId) || eventTableId === tableId) {
        setRefreshTrigger((prev) => prev + 1);
      }
    };

    window.addEventListener('nocobase-table-settings-changed', handleCustomStorageChange as EventListener);

    return () => {
      window.removeEventListener('nocobase-table-settings-changed', handleCustomStorageChange as EventListener);
    };
  }, [tableId]);

  // Get saved column settings
  const savedColumnSettings = useMemo(() => {
    return getSettings();
  }, [getSettings, refreshTrigger]);

  // Merge original columns with saved settings
  const integratedColumns = useMemo(() => {
    if (!enable || !savedColumnSettings || savedColumnSettings.length === 0) {
      return originalColumns;
    }

    // Create a lookup map for saved column settings
    const savedSettingsMap = new Map<string, ColumnSettings>();
    savedColumnSettings.forEach((setting) => {
      savedSettingsMap.set(setting.key, setting);
    });

    // Apply saved settings to original columns
    const processedColumns = originalColumns.map((column) => {
      const savedSetting = savedSettingsMap.get(column.key);

      if (savedSetting) {
        // Merge saved settings with original column (saved settings take priority)
        const columnHidden = column.columnHidden || !savedSetting.visible;
        const columnWidth = savedSetting.width || column.width;
        const columnFixed = savedSetting.fixed || column.fixed;

        return {
          ...column,
          columnHidden,
          fixed: columnFixed,
          width: columnWidth,
          _orderIndex: savedSetting.order,
        };
      }

      return column;
    });

    // Sort columns by saved order if available
    const orderedColumns: TableColumnProps[] = [];
    const unorderedColumns: TableColumnProps[] = [];

    processedColumns.forEach((column) => {
      if (column._orderIndex !== undefined) {
        orderedColumns.push(column);
      } else {
        unorderedColumns.push(column);
      }
    });

    // Sort ordered columns by their order index
    orderedColumns.sort((a, b) => (a._orderIndex || 0) - (b._orderIndex || 0));

    // Clean up the temporary order index
    const finalColumns = [...orderedColumns, ...unorderedColumns];
    finalColumns.forEach((column) => {
      delete column._orderIndex;
    });

    return finalColumns;
  }, [originalColumns, savedColumnSettings]);

  return {
    columns: integratedColumns,
  };
};
