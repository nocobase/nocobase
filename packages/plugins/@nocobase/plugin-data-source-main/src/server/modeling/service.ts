/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { assertModelingSupport, verifyCollectionDefinition } from './capabilities';
import { composeCollectionDefinition, normalizeCollectionInput } from './collections';
import { PlainObject, RELATION_INTERFACES } from './constants';
import { normalizeFieldInput, normalizeFieldList, validateChoiceFieldInput } from './fields';

function mergeSettings(input: PlainObject = {}) {
  const { settings, ...rest } = input;
  return {
    ...(settings || {}),
    ...rest,
  };
}

function validateApplyFieldInputs(fields?: PlainObject[]) {
  if (!Array.isArray(fields)) {
    return;
  }

  fields.forEach((field) => validateChoiceFieldInput(field));
}

export async function findCollection(ctx, collectionName: string) {
  return ctx.app.db.getRepository('collections').findOne({
    filter: {
      name: collectionName,
    },
    appends: ['fields'],
  });
}

export function pickCollectionApplyValues(values: PlainObject) {
  const normalized = { ...values };

  delete normalized.fields;
  delete normalized.name;
  delete normalized.replaceFields;
  delete normalized.verify;
  delete normalized.settings;

  return normalized;
}

export async function upsertFieldDefinition(ctx, rawInput: PlainObject) {
  const input = mergeSettings(rawInput);
  const collectionName = input.collectionName;

  if (!collectionName) {
    throw new Error('field apply requires collectionName');
  }

  validateChoiceFieldInput(input);
  const values = normalizeFieldInput(input, { collectionName });
  await assertModelingSupport(ctx.app, { fields: [values] });

  const repository = ctx.app.db.getRepository('fields');
  const existing = await repository.findOne({
    filter: {
      collectionName,
      name: values.name,
    },
  });

  if (existing) {
    await repository.update({
      filterByTk: existing.key,
      values,
      context: ctx,
    });
  } else {
    await repository.create({
      values,
      context: ctx,
    });
  }

  return repository.findOne({
    filter: {
      collectionName,
      name: values.name,
    },
  });
}

export async function applyFieldDefinition(ctx, rawInput: PlainObject, options: { relationOnly?: boolean } = {}) {
  const input = mergeSettings(rawInput);

  if (options.relationOnly && !RELATION_INTERFACES.has(input.interface)) {
    throw new Error(`fields:apply relation mode requires relation interface, got ${input.interface || 'empty'}`);
  }

  return upsertFieldDefinition(ctx, input);
}

export async function applyCollectionDefinition(
  ctx,
  rawInput: PlainObject,
  syncCollectionFields: (ctx: any, collectionName: string, values: { fields?: PlainObject[] }) => Promise<void>,
) {
  const input = mergeSettings(rawInput);
  const collectionName = input.name || ctx.action.params.filterByTk;
  const replaceFields = input.replaceFields === true;
  const shouldVerify = input.verify !== false;
  const repository = ctx.app.db.getRepository('collections');

  if (!collectionName) {
    throw new Error('collections:apply requires name');
  }

  validateApplyFieldInputs(input.fields);
  const existing = await findCollection(ctx, collectionName);

  if (!existing) {
    const values = composeCollectionDefinition({ ...input, name: collectionName }, { mode: 'create' });
    await assertModelingSupport(ctx.app, values);
    await repository.create({
      values,
      context: ctx,
    });
  } else {
    const values = normalizeCollectionInput({ ...input, name: collectionName }, { mode: 'update' });
    await assertModelingSupport(ctx.app, values);

    const collectionValues = pickCollectionApplyValues(values);
    if (Object.keys(collectionValues).length > 0) {
      await repository.update({
        filterByTk: collectionName,
        values: collectionValues,
        context: ctx,
      });
    }

    if (Array.isArray(values.fields) && values.fields.length > 0) {
      if (replaceFields) {
        await syncCollectionFields(ctx, collectionName, {
          fields: normalizeFieldList(values.fields, collectionName),
        });
      } else {
        for (const field of values.fields) {
          await upsertFieldDefinition(ctx, {
            ...field,
            collectionName,
          });
        }
      }
    }
  }

  const collection = await findCollection(ctx, collectionName);
  const verify = shouldVerify ? verifyCollectionDefinition(ctx.app, collectionName) : undefined;

  return {
    data: collection,
    verify,
  };
}
