/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AxiosRequestConfig } from 'axios';
import { findSchemaCache, findFirstVirtualSchema, convertToCreateSchema, setToTrueSchema } from './template';

/**
 * Register template block related interceptors for axios
 * Handles schema removal and patching operations for template blocks
 * @param apiClient The API client instance
 * @param pageBlocks The template blocks cache
 */
export function registerTemplateBlockInterceptors(apiClient: any, pageBlocks: Record<string, any>) {
  apiClient.axios.interceptors.request.use(async (config: AxiosRequestConfig) => {
    // Handle schema patching
    if (config.url?.includes('uiSchemas:patch') || config.url?.includes('uiSchemas:initializeActionContext')) {
      const xUid = config.data?.['x-uid'];
      const currentSchema = findSchemaCache(pageBlocks, xUid);
      const virtualSchema = findFirstVirtualSchema(currentSchema, xUid);
      if (virtualSchema) {
        setToTrueSchema(virtualSchema.schema);
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

    // Handle schema batch patch
    if (config.url?.includes('uiSchemas:batchPatch')) {
      const schemas = config.data;
      for (const schema of schemas) {
        const currentSchema = findSchemaCache(pageBlocks, schema['x-uid']);
        const virtualSchema = findFirstVirtualSchema(currentSchema, schema['x-uid']);
        if (virtualSchema) {
          setToTrueSchema(virtualSchema.schema);
          await apiClient.request({
            url: `/uiSchemas:insertAdjacent/${virtualSchema.insertTarget}?position=${virtualSchema.insertPosition}`,
            method: 'post',
            data: {
              schema: convertToCreateSchema(virtualSchema.schema),
            },
          });
        }
      }
    }

    if (config.url?.includes('uiSchemas:insertAdjacent')) {
      const uidWithQuery = config.url.split('/').pop();
      const uid = uidWithQuery?.split('?')[0];
      const schemaId = config.data?.schema['x-uid'] || config.data?.schema;
      const currentSchema = findSchemaCache(pageBlocks, uid);
      const virtualSchema = findFirstVirtualSchema(currentSchema, uid);
      if (virtualSchema) {
        setToTrueSchema(virtualSchema.schema);
        await apiClient.request({
          url: `/uiSchemas:insertAdjacent/${virtualSchema.insertTarget}?position=${virtualSchema.insertPosition}`,
          method: 'post',
          data: {
            schema: convertToCreateSchema(virtualSchema.schema),
          },
        });
      }
      const cs = findSchemaCache(pageBlocks, schemaId);
      const vs = findFirstVirtualSchema(cs, schemaId);
      if (vs) {
        setToTrueSchema(vs.schema);
        if (config.data?.wrap) {
          setToTrueSchema(config.data.wrap);
        }
        await apiClient.request({
          url: `/uiSchemas:insertAdjacent/${vs.insertTarget}?position=${vs.insertPosition}`,
          method: 'post',
          data: {
            schema: convertToCreateSchema(vs.schema),
          },
        });
      }
    }

    return config;
  });
}
