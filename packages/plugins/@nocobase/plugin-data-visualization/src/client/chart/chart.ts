/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo } from 'react';
import { FieldOption } from '../hooks';
import { DimensionProps, MeasureProps, QueryProps } from '../renderer';
import { parseField } from '../utils';
import { ISchema } from '@formily/react';
import configs, { AnySchemaProperties, Config, ConfigType } from './configs';
import { Transformer } from '../transformers';

export type RenderProps = {
  data: Record<string, any>[];
  general: any;
  advanced: any;
  fieldProps: {
    [field: string]: {
      label: string;
      transformer: Transformer;
      interface: string;
    };
  };
};

export interface ChartType {
  name: string;
  title: string;
  enableAdvancedConfig?: boolean;
  Component: React.FC<any>;
  schema: ISchema;
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

  /*
   * Generate config schema according to this.config
   * How to set up this.config:
   * 1. string - the config function name in config.ts
   * 2. object - { configType: string, ...props }
   *    - sttingType is the config function name in config.ts, and the other props are the arguments of the function
   * 3. object - use the object directly as the properties of the schema
   * 4. function - use the custom function to return the properties of the schema
   */
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
    let yFields: FieldOption[];
    const getField = (fields: FieldOption[], selected: { field: string | string[]; alias?: string }) => {
      if (selected.alias) {
        return fields.find((f) => f.value === selected.alias);
      }
      const { alias } = parseField(selected.field);
      return fields.find((f) => f.value === alias);
    };
    if (measures?.length) {
      yField = getField(fields, measures[0]);
      yFields = measures.map((m) => getField(fields, m));
    }
    if (dimensions) {
      if (dimensions.length === 1) {
        xField = getField(fields, dimensions[0]);
      } else if (dimensions.length > 1) {
        // If there is a time field, it is used as the x-axis field by default.
        let xIndex: number;
        dimensions.forEach((d, i) => {
          const field = getField(fields, d);
          if (['date', 'time', 'datetime'].includes(field?.type)) {
            xField = field;
            xIndex = i;
          }
        });
        xIndex = xIndex || 0;
        xField = xField || getField(fields, dimensions[xIndex]);
        const restFields = dimensions.filter((_, i) => i !== xIndex).map((i) => getField(fields, i));
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

  /**
   * getProps
   * Accept the information that the chart component needs to render,
   * process it and return the props of the chart component.
   */
  getProps(props: RenderProps): any {
    return props;
  }
}
