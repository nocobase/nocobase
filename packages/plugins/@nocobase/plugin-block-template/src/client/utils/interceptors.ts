/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AxiosRequestConfig } from 'axios';
import { findSchemaCache, findParentSchemaByUid, findFirstVirtualSchema, convertToCreateSchema } from './template';

/**
 * Register template block related interceptors for axios
 * Handles schema removal and patching operations for template blocks
 * @param apiClient The API client instance
 * @param templateBlocks The template blocks cache
 */
export function registerTemplateBlockInterceptors(apiClient: any, templateBlocks: Record<string, any>) {
  apiClient.axios.interceptors.request.use(async (config: AxiosRequestConfig) => {
    // Handle schema removal
    if (config.url?.includes('uiSchemas:remove')) {
      const uidWithQuery = config.url.split('/').pop();
      const uid = uidWithQuery?.split('?')[0];
      const query = uidWithQuery?.split('?')[1];
      const skipRemovePatch = query?.includes('resettemplate=true');
      const currentSchema = findSchemaCache(templateBlocks, uid);
      const ret = findParentSchemaByUid(currentSchema, uid);
      if (ret && ret.parent && !skipRemovePatch) {
        const { parent } = ret;
        if (!parent['x-removed-properties']) {
          parent['x-removed-properties'] = [];
        }
        parent['x-removed-properties'].push(ret.key);
        await apiClient.request({
          url: `/uiSchemas:patch`,
          method: 'post',
          data: {
            'x-uid': parent['x-uid'],
            'x-removed-properties': parent['x-removed-properties'],
          },
        });
      }
    }

    // Handle schema patching
    if (config.url?.includes('uiSchemas:patch')) {
      const xUid = config.data?.['x-uid'];
      const currentSchema = findSchemaCache(templateBlocks, xUid);
      const virtualSchema = findFirstVirtualSchema(currentSchema, xUid);
      if (virtualSchema) {
        const newSchema = convertToCreateSchema(virtualSchema.schema);
        await apiClient.request({
          url: `/uiSchemas:insertAdjacent/${virtualSchema.insertTarget}?position=${virtualSchema.insertPosition}`,
          method: 'post',
          data: {
            schema: newSchema,
          },
        });
      }
    }

    // TODO: After drag and drop, template synchronization may be lost. Only necessary properties should be synced to data
    return config;
  });
}
