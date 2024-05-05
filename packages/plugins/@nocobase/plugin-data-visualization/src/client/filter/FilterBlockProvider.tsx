/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext, useEffect } from 'react';
import { SchemaComponentOptions } from '@nocobase/client';
import { ChartFilterItemDesigner } from './FilterItemDesigner';
import {
  useChartFilterActionProps,
  useChartFilterResetProps,
  useChartFilterCollapseProps,
  ChartFilterCollapseDesigner,
  ChartFilterActionDesigner,
} from './FilterActionInitializers';
import { ChartFilterGrid } from './FilterBlockInitializer';
import { useChartsTranslation } from '../locale';
import { css } from '@emotion/css';
import { ChartFilterContext } from './FilterProvider';
import { ChartFilterCheckbox } from './FilterCheckbox';
import { ArrayItems } from '@formily/antd-v5';
import { ChartFilterFormItem } from './FilterItemInitializers';
import { ChartFilterForm } from './FilterForm';
import { CollectionFieldInitializer } from './CollectionFieldInitializer';

export const ChartFilterBlockProvider: React.FC = (props) => {
  const { t } = useChartsTranslation();
  const { setEnabled } = useContext(ChartFilterContext);
  useEffect(() => {
    setEnabled(true);
  }, [setEnabled]);
  return (
    <div
      className={css`
        .ant-card {
          box-shadow: none;
          border: none;
          margin-bottom: 6px;
        }
      `}
    >
      <SchemaComponentOptions
        components={{
          ChartFilterItemDesigner,
          ChartFilterForm,
          ChartFilterGrid,
          ChartFilterCheckbox,
          ChartFilterFormItem,
          ArrayItems,
          ChartFilterCollapseDesigner,
          ChartFilterActionDesigner,
          CollectionFieldInitializer,
        }}
        scope={{ t, useChartFilterActionProps, useChartFilterResetProps, useChartFilterCollapseProps }}
      >
        {props.children}
      </SchemaComponentOptions>
    </div>
  );
};
