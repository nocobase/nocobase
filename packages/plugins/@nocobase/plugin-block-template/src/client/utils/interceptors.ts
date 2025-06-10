/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AxiosRequestConfig } from 'axios';
import {
  findSchemaCache,
  findFirstVirtualSchema,
  convertToCreateSchema,
  collectSchemaFirstVirtualUids,
  findSchemaByUid,
} from './template';
import { ISchema } from '@nocobase/client';
import _ from 'lodash';

/**
 * Register template block related interceptors for axios
 * Handles schema removal and patching operations for template blocks
 * @param apiClient The API client instance
 * @param pageBlocks The template blocks cache
 */
export function registerTemplateBlockInterceptors(
  apiClient: any,
  pageBlocks: Record<string, any>,
  savedSchemaUids: Set<string>,
) {
  const setToTrueSchema = (uid: string) => {
    const cacheSchema = findSchemaCache(pageBlocks, uid);
    const deleteVirtual = (schema: ISchema) => {
      if (schema?.['x-virtual']) {
        savedSchemaUids.add(schema['x-uid']);
      }
      if (schema?.properties) {
        for (const key in schema.properties) {
          deleteVirtual(schema.properties[key]);
        }
      }
    };
    const schema = findSchemaByUid(cacheSchema, uid);
    deleteVirtual(schema);
  };

  apiClient.axios.interceptors.request.use(async (config: AxiosRequestConfig) => {
    // Handle schema patching
    if (config.url?.includes('uiSchemas:patch') || config.url?.includes('uiSchemas:initializeActionContext')) {
      const xUid = config.data?.['x-uid'];
      const currentPageSchema = findSchemaCache(pageBlocks, xUid);
      const currentSchema = findSchemaByUid(currentPageSchema, xUid);
      const uids = collectSchemaFirstVirtualUids(currentSchema);
      for (const uid of uids) {
        const virtualSchema = findFirstVirtualSchema(currentPageSchema, uid);
        if (virtualSchema) {
          const newSchema = convertToCreateSchema(virtualSchema.schema);
          await apiClient.request({
            url: `/blockTemplates:saveSchema/${virtualSchema.insertTarget}?position=${virtualSchema.insertPosition}`,
            method: 'post',
            data: {
              schema: newSchema,
            },
          });
          setToTrueSchema(virtualSchema.schema['x-uid']);
        }
      }
    }

    // Handle schema batch patch
    if (config.url?.includes('uiSchemas:batchPatch')) {
      const schemas = config.data;
      for (const schema of schemas) {
        const currentSchema = findSchemaCache(pageBlocks, schema['x-uid']);
        const virtualSchema = findFirstVirtualSchema(currentSchema, schema['x-uid']);
        if (virtualSchema) {
          await apiClient.request({
            url: `/blockTemplates:saveSchema/${virtualSchema.insertTarget}?position=${virtualSchema.insertPosition}`,
            method: 'post',
            data: {
              schema: convertToCreateSchema(virtualSchema.schema),
            },
          });
          setToTrueSchema(virtualSchema.schema['x-uid']);
        }
      }
    }

    if (config.url?.includes('uiSchemas:insertAdjacent')) {
      const uidWithQuery = config.url.split('/').pop();
      const wrap = config.data?.wrap;
      const schema = config.data?.schema;
      const uid = uidWithQuery?.split('?')[0];
      const schemaId = schema['x-uid'] || schema;
      const currentSchema = findSchemaCache(pageBlocks, uid);
      const virtualSchema = findFirstVirtualSchema(currentSchema, uid, wrap);

      if (virtualSchema) {
        await apiClient.request({
          url: `/blockTemplates:saveSchema/${virtualSchema.insertTarget}?position=${virtualSchema.insertPosition}`,
          method: 'post',
          data: {
            schema: convertToCreateSchema(virtualSchema.schema, [schemaId, wrap?.['x-uid']].filter(Boolean)),
          },
        });
        setToTrueSchema(virtualSchema.schema['x-uid']);
      }
      const cs = findSchemaCache(pageBlocks, schemaId);
      const vs = findFirstVirtualSchema(cs, schemaId, wrap);
      if (vs && vs.insertTarget) {
        await apiClient.request({
          url: `/blockTemplates:saveSchema/${vs.insertTarget}?position=${vs.insertPosition}`,
          method: 'post',
          data: {
            schema: convertToCreateSchema(vs.schema, [schemaId, wrap?.['x-uid']].filter(Boolean)),
          },
        });
        setToTrueSchema(vs.schema['x-uid']);
        if (wrap) {
          setToTrueSchema(wrap['x-uid']);
        }
      }
    }

    return config;
  });
}
