/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import { fields } from './fields';
import { tExpr } from './locale';
import { setDefaultZoomLevel } from './models/fieldModels/setDefaultZoomLevel';

export class PluginMapClient extends Plugin {
  async load() {
    this.app.addFieldInterfaces(fields);
    this.app.addFieldInterfaceGroups({
      map: {
        label: tExpr('Map-based geometry'),
        order: 300,
      },
    });

    this.pluginSettingsManager.addMenuItem({
      key: 'map',
      title: this.t('Map manager'),
      icon: 'EnvironmentOutlined',
      aclSnippet: 'pm.map.configuration',
    });
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'map',
      key: 'index',
      title: this.t('Map manager'),
      componentLoader: () => import('./pages/Configuration'),
    });

    this.flowEngine.registerActions({ setDefaultZoomLevel });
    this.flowEngine.registerModelLoaders({
      CircleFieldModel: {
        loader: () => import('./models/fieldModels'),
      },
      DisplayCircleFieldModel: {
        loader: () => import('./models/fieldModels'),
      },
      DisplayLineStringFieldModel: {
        loader: () => import('./models/fieldModels'),
      },
      DisplayPointFieldModel: {
        loader: () => import('./models/fieldModels'),
      },
      DisplayPolygonFieldModel: {
        loader: () => import('./models/fieldModels'),
      },
      LineStringFieldModel: {
        loader: () => import('./models/fieldModels'),
      },
      MapActionGroupModel: {
        loader: () => import('./models/MapActionGroupModel'),
      },
      MapBlockModel: {
        loader: () => import('./models/MapBlockModel'),
      },
      MapFieldModel: {
        loader: () => import('./models/fieldModels'),
      },
      PointFieldModel: {
        loader: () => import('./models/fieldModels'),
      },
      PolygonFieldModel: {
        loader: () => import('./models/fieldModels'),
      },
    });
  }
}

export default PluginMapClient;
