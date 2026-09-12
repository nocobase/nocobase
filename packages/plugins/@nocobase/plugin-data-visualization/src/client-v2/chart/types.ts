/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo } from 'react';

import { parseField } from '../flow/utils';
import configs, { AnySchema, AnySchemaProperties, Config, ConfigType } from './configs';

export type FieldOption = {
  value: string;
  label: string;
  key: string;
  alias?: string;
  name?: string;
  type?: string;
  interface?: string;
  uiSchema?: AnySchema;
  target?: string;
  targetFields?: FieldOption[];
};

export type MeasureProps = {
  field: string | string[];
  aggregation?: string;
  alias?: string;
};

export type DimensionProps = {
  field: string | string[];
  alias?: string;
  format?: string;
};

export type Transformer = (val: any, ...args: any[]) => string | number;

export type FieldRenderProps = {
  label: string;
  interface?: string;
  transformer?: Transformer;
};

export type RenderProps = {
  data: Record<string, any>[];
  general: any;
  advanced: any;
  fieldProps: {
    [field: string]: FieldRenderProps;
  };
};

export interface ChartType {
  name: string;
  title: string;
  enableAdvancedConfig?: boolean;
  Component: React.FC<any>;
  schema: AnySchema;
  init?: (
    fields: FieldOption[],
    query: {
      measures?: MeasureProps[];
      dimensions?: DimensionProps[];
    },
  ) => {
    general?: any;
    advanced?: any;
  };
  getProps(props: RenderProps): any;
  getReference?: () => {
    title: string;
    link: string;
  };
}

export type ChartProps = {
  name: string;
  title: string;
  enableAdvancedConfig?: boolean;
  Component: React.FC<any>;
  config?: Config[];
};

export class Chart implements ChartType {
  name: string;
  title: string;
  enableAdvancedConfig = false;
  Component: React.FC<any>;
  config: Config[];
  configTypes = new Map<string, ConfigType>();

  constructor({ name, title, enableAdvancedConfig, Component, config }: ChartProps) {
    this.name = name;
    this.title = title;
    this.Component = memo(Component, (prev, next) => JSON.stringify(prev) === JSON.stringify(next));
    this.config = config;
    this.enableAdvancedConfig = enableAdvancedConfig || false;
    this.addConfigTypes(configs);
  }

  get schema() {
    if (!this.config) {
      return {};
    }
    const properties = this.config.reduce((props, conf) => {
      let schema: AnySchemaProperties = {};
      if (typeof conf === 'string') {
        conf = this.configTypes.get(conf);
      }
      if (typeof conf === 'function') {
        schema = conf();
      } else {
        if (conf.configType) {
          const func = this.configTypes.get(conf.configType as string) as Function;
          schema = func?.(conf) || {};
        } else {
          schema = conf as AnySchemaProperties;
        }
      }
      return {
        ...props,
        ...schema,
      };
    }, {} as any);
    return {
      type: 'object',
      properties,
    };
  }

  addConfigTypes(configs: { [key: string]: ConfigType }) {
    Object.entries(configs).forEach(([key, func]) => {
      this.configTypes.set(key, func);
    });
  }

  infer(
    fields: FieldOption[],
    {
      measures,
      dimensions,
    }: {
      measures?: MeasureProps[];
      dimensions?: DimensionProps[];
    },
  ) {
    let xField: FieldOption;
    let yField: FieldOption;
    let seriesField: FieldOption;
    let colorField: FieldOption;
    let yFields: FieldOption[] = [];
    const getField = (fields: FieldOption[], selected: { field: string | string[]; alias?: string }) => {
      if (selected.alias) {
        return fields.find((f) => f.value === selected.alias);
      }
      const { alias } = parseField(selected.field);
      return fields.find((f) => f.value === alias);
    };
    if (measures?.length) {
      yField = getField(fields, measures[0]);
      yFields = measures.map((measure) => getField(fields, measure));
    }
    if (dimensions) {
      if (dimensions.length === 1) {
        xField = getField(fields, dimensions[0]);
      } else if (dimensions.length > 1) {
        let xIndex: number;
        dimensions.forEach((dimension, index) => {
          const field = getField(fields, dimension);
          if (['date', 'time', 'datetime'].includes(field?.type)) {
            xField = field;
            xIndex = index;
          }
        });
        xIndex = xIndex || 0;
        xField = xField || getField(fields, dimensions[xIndex]);
        const restFields = dimensions.filter((_, index) => index !== xIndex).map((item) => getField(fields, item));
        if (restFields.length === 1) {
          seriesField = restFields[0];
          colorField = restFields[0];
        } else if (restFields.length > 1) {
          colorField = restFields[0];
          seriesField = restFields[1];
        }
      }
    }
    return { xField, yField, seriesField, colorField, yFields };
  }

  getProps(props: RenderProps): any {
    return props;
  }
}
