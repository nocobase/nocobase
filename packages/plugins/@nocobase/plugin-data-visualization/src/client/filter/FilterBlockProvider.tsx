import React from 'react';
import { SchemaComponentOptions } from '@nocobase/client';
import { ChartFilterItemDesigner } from './FilterItemDesigner';
import {
  useChartFilterActionProps,
  useChartFilterResetProps,
  useChartFilterCollapseProps,
} from './FilterActionInitializers';
import { ChartFilterGrid } from './FilterBlockInitializer';
import { useChartsTranslation } from '../locale';

export const ChartFilterBlockProvider: React.FC = (props) => {
  const { t } = useChartsTranslation();
  return (
    <SchemaComponentOptions
      components={{ ChartFilterItemDesigner, ChartFilterGrid }}
      scope={{ t, useChartFilterActionProps, useChartFilterResetProps, useChartFilterCollapseProps }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};
