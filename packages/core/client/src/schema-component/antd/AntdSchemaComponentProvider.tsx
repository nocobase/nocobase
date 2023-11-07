import React from 'react';
import * as components from '.';
import { Plugin } from '../../application/Plugin';
import * as common from '../common';
import { SchemaComponentOptions } from '../core';
import { useFilterActionProps } from './filter/useFilterActionProps';
import { requestChartData } from './g2plot/requestChartData';

import { pageTabSettings, pageSettings } from './page';
import { formSettings } from './form-v2';
import { formItemSettings } from './form-item';

// TODO: delete this, replaced by `AntdSchemaComponentPlugin`
export const AntdSchemaComponentProvider = (props) => {
  const { children } = props;
  return (
    <SchemaComponentOptions
      scope={{ requestChartData, useFilterActionProps }}
      components={{ ...components, ...common } as any}
    >
      {children}
    </SchemaComponentOptions>
  );
};

export class AntdSchemaComponentPlugin extends Plugin {
  async load() {
    this.addComponents();
    this.addScopes();
    this.addSchemaSettings();
  }

  addComponents() {
    this.app.addComponents({
      ...(components as any),
      ...common,
    });
  }

  addScopes() {
    this.app.addScopes({
      requestChartData,
      useFilterActionProps,
    });
  }

  addSchemaSettings() {
    this.app.schemaSettingsManager.add(pageSettings);
    this.app.schemaSettingsManager.add(pageTabSettings);
    this.app.schemaSettingsManager.add(formSettings);
    this.app.schemaSettingsManager.add(formItemSettings);
  }
}
