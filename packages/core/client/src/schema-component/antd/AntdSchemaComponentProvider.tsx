import React from 'react';
import * as components from '.';
import { Plugin } from '../../application/Plugin';
import * as common from '../common';
import { SchemaComponentOptions } from '../core';
import { useFilterActionProps } from './filter/useFilterActionProps';
import { requestChartData } from './g2plot/requestChartData';

import { pageTabSettings, pageSettings } from './page';
import { formSettings, readPrettyFormSettings, formDetailsSettings, formFilterSettings } from './form-v2';
import { formV1Settings } from './form';
import { formItemSettings, filterFormItemSettings } from './form-item';
import { actionSettings } from './action';

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
    // page
    this.app.schemaSettingsManager.add(pageSettings);
    this.app.schemaSettingsManager.add(pageTabSettings);

    // form-item
    this.app.schemaSettingsManager.add(formItemSettings);
    this.app.schemaSettingsManager.add(filterFormItemSettings);

    // form-v1
    this.app.schemaSettingsManager.add(formV1Settings);

    // form-v2
    this.app.schemaSettingsManager.add(formSettings);
    this.app.schemaSettingsManager.add(formFilterSettings);
    this.app.schemaSettingsManager.add(readPrettyFormSettings);
    this.app.schemaSettingsManager.add(formDetailsSettings);

    // action
    this.app.schemaSettingsManager.add(actionSettings);
  }
}
