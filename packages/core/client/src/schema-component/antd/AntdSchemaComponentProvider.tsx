import React from 'react';
import * as components from '.';
import { Plugin } from '../../application/Plugin';
import * as common from '../common';
import { SchemaComponentOptions } from '../core';
import { useFilterActionProps } from './filter/useFilterActionProps';
import { requestChartData } from './g2plot/requestChartData';

import { actionSettings } from './action';
import { formV1Settings } from './form';
import { filterFormItemSettings, formItemSettings } from './form-item';
import { formDetailsSettings, formSettings, readPrettyFormSettings } from './form-v2';
import { pageSettings, pageTabSettings } from './page';

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
    this.app.schemaSettingsManager.add(readPrettyFormSettings);
    this.app.schemaSettingsManager.add(formDetailsSettings);

    // action
    this.app.schemaSettingsManager.add(actionSettings);
  }
}
