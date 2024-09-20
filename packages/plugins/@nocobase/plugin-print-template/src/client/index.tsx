/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, SchemaComponent } from '@nocobase/client';
import { PluginSettingsTable } from './PluginSettingsTable';
import { PluginSettingsTablePage } from './PluginSettingsTablePage';
import { PluginSettingsTableProvider } from './PluginSettingsTableProvider';
import { tStr, useT } from './locale';
import React from 'react';
import {
  createPrintTemplateActionSchema,
  useCancelPrintTemplateFile,
  useDownloadPrintTemplateFile,
  usePrintTemplateActionProps,
  usePrintTemplateListSelect,
} from './schema';
import { printTemplateActionSettings } from './settings';
import { createPrintTemplateActionInitializerItem } from './initializer';

export class PluginTemplatePrintClient extends Plugin {
  async load() {
    // 打印模板设置路由
    this.app.pluginSettingsManager.add('template-print', {
      title: tStr('template print setting menu'),
      icon: 'PrinterOutlined',
      Component: PluginSettingsTable,
    });
    this.app.addProvider(PluginSettingsTableProvider);

    // Action Button - Template Print Action
    this.app.addScopes({
      usePrintTemplateActionProps,
      useDownloadPrintTemplateFile,
      usePrintTemplateListSelect,
      useCancelPrintTemplateFile,
    });
    this.app.schemaSettingsManager.add(printTemplateActionSettings);

    // this.app.schemaInitializerManager.addItem(
    //   'table:configureActions',
    //   'enableActions.printTemplate',
    //   createPrintTemplateActionInitializerItem('table-v2'),
    // );

    this.app.schemaInitializerManager.addItem(
      'details:configureActions',
      'enableActions.templatePrint',
      createPrintTemplateActionInitializerItem('details'),
    );
  }
}

export default PluginTemplatePrintClient;
