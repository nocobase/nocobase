import React, { useContext, useEffect } from 'react';
import { SchemaComponentOptions } from '@nocobase/client';
import { ChartFilterItemDesigner } from './FilterItemDesigner';
import {
  useChartFilterActionProps,
  useChartFilterResetProps,
  useChartFilterCollapseProps,
} from './FilterActionInitializers';
import { ChartFilterGrid, ChartFilterForm } from './FilterBlockInitializer';
import { useChartsTranslation } from '../locale';
import { css } from '@emotion/css';
import { theme } from 'antd';
import { ChartFilterContext } from './FilterProvider';

export const ChartFilterBlockProvider: React.FC = (props) => {
  const { t } = useChartsTranslation();
  const { token } = theme.useToken();
  const { setEnabled } = useContext(ChartFilterContext);
  useEffect(() => {
    setEnabled(true);
  }, []);
  return (
    <div
      className={css`
        .ant-card {
          box-shadow: none;
          border: ${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary};
        }
      `}
    >
      <SchemaComponentOptions
        components={{ ChartFilterItemDesigner, ChartFilterForm, ChartFilterGrid }}
        scope={{ t, useChartFilterActionProps, useChartFilterResetProps, useChartFilterCollapseProps }}
      >
        {props.children}
      </SchemaComponentOptions>
    </div>
  );
};
