import React from 'react';
import { SchemaComponentOptions } from '@nocobase/client';
import { ChartFilterItemDesigner } from './FilterItemDesigner';
import { useChartFilterActionProps, useChartFilterResetProps } from './FilterActionInitializers';

export const ChartFilterBlockProvider: React.FC = (props) => {
  return (
    <SchemaComponentOptions
      components={{ ChartFilterItemDesigner }}
      scope={{ useChartFilterActionProps, useChartFilterResetProps }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};
