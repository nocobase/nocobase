/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { InstallOptions, Plugin } from '@nocobase/server';
import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { uploadSelfMiddleware } from './middleware';
import { uploadSelfAction } from './actions/uploadSelfAction';
import { createAction } from './actions/createAction';
import { updateAction } from './actions/updateAction';
import { tableListAction } from './actions/tableList';
import { allListAction } from './actions/allListAction';
import { formatTemplateAction } from './actions/formatTemplateAction';

export class PluginTemplatePrintServer extends Plugin {
  private currentDictionaryCollections = [];

  private fileManagerPlugin: PluginFileManagerServer;
  async init() {
    this.fileManagerPlugin = this.pm.get('file-manager') as PluginFileManagerServer;
    if (!this.fileManagerPlugin) {
      throw new Error('File manager plugin is not installed.');
    }
    const canUseCollection = await this.db.getCollection('collections').model.findAll();

    this.currentDictionaryCollections = canUseCollection.map((item) => {
      const tmpItem = item.toJSON();
      return {
        id: tmpItem.name,
        name: tmpItem.name,
      };
    });
    // this.currentDictionaryCollections = Array.from(this.db.collections.keys()).map((name, index) => {
    //   return {
    //     name,
    //     id: index,
    //   };
    // });
  }
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.init();
    this.app.resourceManager.registerActionHandler('tableList', (ctx, next) => {
      return tableListAction(ctx, next, this.currentDictionaryCollections);
    });
    this.app.resourceManager.use(uploadSelfMiddleware);

    this.app.resourceManager.registerActionHandler('uploadSelf', uploadSelfAction);
    this.app.resourceManager.registerActionHandler('create', (ctx, next) => {
      return createAction(ctx, next, this.fileManagerPlugin);
    });
    this.app.resourceManager.registerActionHandler('update', (ctx, next) => {
      return updateAction(ctx, next, this.fileManagerPlugin);
    });

    this.app.resourceManager.registerActionHandler('allList', (ctx, next) => {
      return allListAction(ctx, next, this.db.getCollection('printTemplate'));
    });
    this.app.resourceManager.registerActionHandler('formatTemplate', (ctx, next) => {
      return formatTemplateAction(ctx, next, this.app, this.db, this.fileManagerPlugin);
    });
    this.app.acl.allow('printTemplate', '*', 'public');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginTemplatePrintServer;
