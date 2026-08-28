/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type SourceRecord = {
  id: number | string;
  name?: string;
  sourceType?: string;
  enabled?: boolean;
  options?: Record<string, unknown>;
};

export type SourceFormValues = {
  name?: string;
  sourceType?: string;
  enabled?: boolean;
  options?: Record<string, unknown>;
};

export type SourceResource = {
  create(params: { values: SourceFormValues }): Promise<unknown>;
  update(params: { filterByTk: SourceRecord['id']; values: SourceFormValues }): Promise<unknown>;
  destroy(params: { filterByTk: SourceRecord['id'] }): Promise<unknown>;
};

export async function saveSourceRecord(params: {
  mode: 'create' | 'edit';
  resource: SourceResource;
  values: SourceFormValues;
  record?: SourceRecord;
}) {
  const { mode, resource, values, record } = params;

  if (mode === 'create') {
    await resource.create({ values });
    return;
  }

  if (record?.id == null) {
    throw new Error('Edit mode requires record.id');
  }

  await resource.update({
    filterByTk: record.id,
    values: {
      ...record,
      ...values,
      options: {
        ...(record.options || {}),
        ...(values.options || {}),
      },
    },
  });
}

export async function deleteSourceRecord(resource: SourceResource, record: SourceRecord) {
  if (record.id == null) {
    throw new Error('Delete requires record.id');
  }

  await resource.destroy({ filterByTk: record.id });
}
