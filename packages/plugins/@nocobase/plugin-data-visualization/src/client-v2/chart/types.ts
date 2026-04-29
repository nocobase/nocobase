/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';

export type FieldRenderProps = {
  label: string;
  interface?: string;
};

export type RenderProps = {
  data: Record<string, any>[];
  xField?: string;
  yField?: string;
  title?: string;
  fieldProps: Record<string, FieldRenderProps>;
  themeToken?: any;
};

export type ChartType = {
  name: string;
  title: string;
  Component: React.FC<any>;
  getProps?: (props: RenderProps) => any;
};

export type ChartProps = ChartType;

export class Chart implements ChartType {
  name: string;
  title: string;
  Component: React.FC<any>;
  getProps?: (props: RenderProps) => any;

  constructor(options: ChartType) {
    this.name = options.name;
    this.title = options.title;
    this.Component = options.Component;
    this.getProps = options.getProps;
  }
}
