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
import { Map } from './models/components';
import { setDefaultZoomLevel } from './models/fieldModels/setDefaultZoomLevel';
import { generateNTemplate, NAMESPACE } from './locale';

export class PluginMapClient extends Plugin {
  async load() {
    this.app.addComponents({ Map });
    this.app.addFieldInterfaces(fields);
    this.app.addFieldInterfaceGroups({
      map: {
        label: generateNTemplate('Map-based geometry'),
      },
    });
    this.app.pluginSettingsManager.addMenuItem({
      key: NAMESPACE,
      title: generateNTemplate('Map manager'),
      icon: 'EnvironmentOutlined',
      aclSnippet: 'pm.map.configuration',
    });
    this.app.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'index',
      componentLoader: () =>
        import('./models/components/Configuration').then((mod) => ({ default: mod.Configuration })),
      aclSnippet: 'pm.map.configuration',
    });
    this.flowEngine.registerActions({ setDefaultZoomLevel });
    this.flowEngine.registerModelLoaders({
      MapActionGroupModel: {
        loader: () => import('./models/MapActionGroupModel'),
      },
      MapBlockModel: {
        loader: () => import('./models/MapBlockModel'),
      },
      PointFieldModel: {
        loader: () => import('./models/fieldModels/PointFieldModel'),
      },
      DisplayPointFieldModel: {
        loader: () => import('./models/fieldModels/DisplayPointFieldModel'),
      },
      CircleFieldModel: {
        loader: () => import('./models/fieldModels/CircleFieldModel'),
      },
      DisplayCircleFieldModel: {
        loader: () => import('./models/fieldModels/DisplayCircleFieldModel'),
      },
      PolygonFieldModel: {
        loader: () => import('./models/fieldModels/PolygonFieldModel'),
      },
      DisplayPolygonFieldModel: {
        loader: () => import('./models/fieldModels/DisplayPolygonFieldModel'),
      },
      LineStringFieldModel: {
        loader: () => import('./models/fieldModels/LineStringFieldModel'),
      },
      DisplayLineStringFieldModel: {
        loader: () => import('./models/fieldModels/DisplayLineStringFieldModel'),
      },
    });
  }
}

export default PluginMapClient;
