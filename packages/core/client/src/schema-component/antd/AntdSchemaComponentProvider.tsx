import React from 'react';
import * as components from '.';
import * as common from '../common';
import { SchemaComponentOptions } from '../core/SchemaComponentOptions';
import { useFilterActionProps } from './filter/useFilterActionProps';
import { requestChartData } from './g2plot/requestChartData';

export const AntdSchemaComponentProvider = (props) => {
  const { children } = props;
  return <SchemaComponentOptions scope={{ requestChartData, useFilterActionProps }} components={{ ...components, ...common } as any}>{children}</SchemaComponentOptions>;
};
