/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { Schema } from '@nocobase/utils';
import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import _ from 'lodash';
import { Repository } from '@nocobase/database';
import { cleanSchema, mergeSchema } from '../utils/template';

/**
 * Template data middleware
 * Handles UI Schema related requests and fills template data
 *
 * @param ctx - Context object containing request and response information
 * @param next - Next middleware function
 */
export async function templateDataMiddleware(ctx: Context, next) {
  await next();

  if (
    ctx.action.resourceName === 'uiSchemas' &&
    ['getProperties', 'getJsonSchema', 'getParentJsonSchema'].includes(ctx.action.actionName)
  ) {
    const schema = ctx.body;
    const schemaRepository = ctx.db.getRepository<UiSchemaRepository>('uiSchemas');
    const blockTemplateRepository = ctx.db.getRepository('blockTemplates');

    // convert x-template-root-ref to x-template-root-uid
    await convertTemplateRootRefToUid(schema, schemaRepository);

    // Fill template data, log error if any occurs
    await fillTemplateData(schema, schemaRepository, blockTemplateRepository).catch((e) => {
      ctx.logger.error(e);
    });
  }
}

async function convertTemplateRootRefToUid(schema: Schema, schemaRepository: UiSchemaRepository) {
  if (schema?.['x-template-root-ref']) {
    const rootParentUid = schema['x-template-root-ref']['x-template-uid'];
    const rootParentSchema = await schemaRepository.getJsonSchema(rootParentUid, { readFromCache: true });
    const templateRootUid = _.get(rootParentSchema, schema['x-template-root-ref']['x-path']);
    if (templateRootUid) {
      schema['x-template-root-uid'] = templateRootUid;
    }
  }
}

async function fillTemplateData(
  schema: Schema,
  schemaRepository: UiSchemaRepository,
  blockTemplateRepository: Repository,
) {
  const [uids, keys] = collectBlockTemplateData(schema);
  if (uids.size > 0) {
    schema['x-template-schemas'] = {};
  }
  if (keys.size > 0) {
    schema['x-template-infos'] = {};
  }
  if (!schema['x-template-root-uid'] && schema['x-template-uid']) {
    // when not fetch the root template schema, we need to make the schema complete (this is used in the mobile popup link)
    const template = await schemaRepository.getJsonSchema(schema['x-template-uid'], {
      includeAsyncNode: true,
      readFromCache: true,
    });
    const newSchema = mergeSchema(template, schema, _.cloneDeep(template));
    cleanSchema(newSchema, schema['x-template-uid']);
    _.merge(schema, newSchema);
  }

  const chunkSize = 5;
  const uidChunks = _.chunk(Array.from(uids), chunkSize);
  for (const uidChunk of uidChunks) {
    const batchResults = await Promise.all(
      uidChunk.map((uid) =>
        schemaRepository.getJsonSchema(uid, { readFromCache: true }).then((templateSchema) => [uid, templateSchema]),
      ),
    );
    for (const [uid, templateSchema] of batchResults) {
      schema['x-template-schemas'][uid] = templateSchema;
    }
  }
  const templates = await blockTemplateRepository.find({
    filter: {
      key: { $in: Array.from(keys) },
    },
  });
  for (const template of templates) {
    schema['x-template-infos'][template.key] = template;
  }
}

function collectBlockTemplateData(schema: Schema, data: [Set<string>, Set<string>] = [new Set(), new Set()]) {
  if (schema?.['x-template-root-uid']) {
    data[0].add(schema['x-template-root-uid']);
  }
  if (schema?.['x-block-template-key']) {
    data[1].add(schema['x-block-template-key']);
  }
  if (!schema?.properties) {
    return data;
  }
  for (const property of Object.values(schema.properties)) {
    collectBlockTemplateData(property, data);
  }
  return data;
}
