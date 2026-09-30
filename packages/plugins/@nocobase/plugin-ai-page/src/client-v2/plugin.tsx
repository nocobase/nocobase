/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { adminLayoutPageTypeManager, Plugin } from '@nocobase/client-v2';

export class PluginAIPageClientV2 extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      AIPageModel: {
        loader: () => import('./models/AIPageModel'),
      },
    });

    adminLayoutPageTypeManager.register({
      name: 'aiPage',
      label: 'AI Page',
      sort: 20,
      routeOptions: { pageType: 'aiPage' },
      onRouteCreated: async ({ flowEngine, pageSchemaUid, values }) => {
        await this.app.apiClient.request({
          url: 'ai-page/v1/pages',
          method: 'POST',
          data: {
            pageSchemaUid,
            title: values.title,
          },
        });

        try {
          const model = await flowEngine.loadOrCreateModel({
            parentId: pageSchemaUid,
            subKey: 'page',
            subType: 'object',
            use: 'AIPageModel',
            props: { pageSchemaUid },
          });
          if (!model) {
            throw new Error('Failed to create the AI Page model');
          }
        } catch (error) {
          await this.app.apiClient.request({
            url: `ai-page/v1/pages/${encodeURIComponent(pageSchemaUid)}`,
            method: 'DELETE',
          });
          throw error;
        }
      },
      onRouteDeleted: async ({ pageSchemaUid }) => {
        await this.app.apiClient.request({
          url: `ai-page/v1/pages/${encodeURIComponent(pageSchemaUid)}`,
          method: 'DELETE',
        });
      },
    });
  }
}

export default PluginAIPageClientV2;
