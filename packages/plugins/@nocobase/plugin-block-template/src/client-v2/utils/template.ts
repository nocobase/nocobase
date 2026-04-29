/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ISchema } from '@formily/json-schema';
import { cloneDeep, mergeWith } from 'lodash';

export function mergeTemplateSchema(
  schema: any,
  templateschemacache: Record<string, any>,
  templateInfos: Map<string, any>,
  savedSchemaUids: Set<string> = new Set(),
): any {
  if (!schema) {
    return schema;
  }

  const templateRootUid = schema['x-template-root-uid'];
  const templateSchema = templateRootUid ? templateschemacache[templateRootUid] : null;
  const source = cloneDeep(schema);

  if (templateSchema) {
    const merged = mergeWith(cloneDeep(templateSchema), source, (objectValue, sourceValue, key) => {
      if (sourceValue === null || sourceValue === undefined) {
        return objectValue;
      }
      if (Array.isArray(sourceValue)) {
        return sourceValue;
      }
      if (key === 'properties' && sourceValue && typeof sourceValue === 'object') {
        return undefined;
      }
      return undefined;
    });
    decorateTemplateSchema(merged, templateInfos, savedSchemaUids);
    return merged;
  }

  if (source.properties) {
    for (const key of Object.keys(source.properties)) {
      source.properties[key] = mergeTemplateSchema(
        source.properties[key],
        templateschemacache,
        templateInfos,
        savedSchemaUids,
      );
    }
  }

  decorateTemplateSchema(source, templateInfos, savedSchemaUids);
  return source;
}

export function decorateTemplateSchema(
  schema: ISchema,
  templateInfos: Map<string, any>,
  savedSchemaUids: Set<string> = new Set(),
) {
  if (!schema) {
    return;
  }

  if (schema['x-block-template-key']) {
    schema['x-template-title'] = templateInfos.get(schema['x-block-template-key'])?.title;
  }

  if (savedSchemaUids.has(schema['x-uid'])) {
    delete schema['x-virtual'];
    savedSchemaUids.delete(schema['x-uid']);
  }

  if (schema.properties) {
    for (const key of Object.keys(schema.properties)) {
      decorateTemplateSchema(schema.properties[key], templateInfos, savedSchemaUids);
    }
  }
}
