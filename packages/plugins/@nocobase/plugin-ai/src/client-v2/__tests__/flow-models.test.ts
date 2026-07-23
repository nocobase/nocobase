/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModel } from '@nocobase/flow-engine';
import { FlowEngine, MultiRecordResource, SingleRecordResource } from '@nocobase/flow-engine';
import { FormItemModel } from '@nocobase/client-v2';
import { describe, expect, it, vi } from 'vitest';
import { FlowModelsContext } from '../ai-employees/context/flow-models';

type GetContent = NonNullable<typeof FlowModelsContext.getContent>;
type WorkContextApplication = Parameters<GetContent>[0];

const collection = {
  name: 'customers',
  title: 'Customers',
  getFields: () => [{ name: 'name', type: 'string', title: 'Name' }],
};

const createApplication = (model: FlowModel) =>
  ({
    flowEngine: {
      getModel: vi.fn().mockReturnValue(model),
    },
  }) as unknown as WorkContextApplication;

const parseContextContent = async (model: FlowModel) => {
  const content = await FlowModelsContext.getContent?.(createApplication(model), {
    type: 'flow-model',
    uid: model.uid,
  });
  expect(typeof content).toBe('string');
  return JSON.parse(content as string) as Record<string, unknown>;
};

describe('FlowModelsContext', () => {
  it('includes record data for single-record collection resources', async () => {
    const engine = new FlowEngine();
    const resource = engine.context.createResource(SingleRecordResource);
    const record = { id: 1, name: 'Alice' };
    resource.setData(record);
    const model = {
      uid: 'details-block',
      title: 'Customer details',
      use: 'DetailsBlockModel',
      collection,
      resource,
    } as unknown as FlowModel;

    const content = await parseContextContent(model);

    expect(content).toMatchObject({
      collection: {
        name: 'customers',
        title: 'Customers',
      },
      data: record,
    });
    expect(content).not.toHaveProperty('dataScope');
  });

  it('recognizes cross-bundle single-record resources without changing their constructor identity', async () => {
    const record = { id: 2, name: 'Bob' };
    const resource = {
      isNewRecord: false,
      getFilter: vi.fn(),
      getData: vi.fn().mockReturnValue(record),
      refresh: vi.fn(),
    };
    const model = {
      uid: 'custom-details-block',
      title: 'Custom customer details',
      use: 'CustomDetailsBlockModel',
      collection,
      resource,
    } as unknown as FlowModel;

    const content = await parseContextContent(model);

    expect(content).toMatchObject({ data: record });
    expect(resource.getFilter).not.toHaveBeenCalled();
  });

  it('keeps multi-record and other filterable resources on the data-scope path', async () => {
    const engine = new FlowEngine();
    const multiResource = engine.context.createResource(MultiRecordResource);
    multiResource.addFilterGroup('scope', { status: 'active' });
    const multiModel = {
      uid: 'customers-table',
      title: 'Customers',
      use: 'TableBlockModel',
      collection,
      resource: multiResource,
    } as unknown as FlowModel;
    const filterableResource = {
      getFilter: vi.fn().mockReturnValue({ category: 'retail' }),
      getData: vi.fn().mockReturnValue([{ id: 3, name: 'Carol' }]),
    };
    const filterableModel = {
      uid: 'filterable-block',
      title: 'Filterable customers',
      use: 'CustomFilterableBlockModel',
      collection,
      resource: filterableResource,
    } as unknown as FlowModel;

    const multiContent = await parseContextContent(multiModel);
    const filterableContent = await parseContextContent(filterableModel);

    expect(multiContent).toMatchObject({
      dataScope: {
        filter: { $and: [{ status: 'active' }] },
      },
    });
    expect(multiContent).not.toHaveProperty('data');
    expect(filterableContent).toMatchObject({
      dataScope: {
        filter: { category: 'retail' },
      },
    });
    expect(filterableContent).not.toHaveProperty('data');
  });
});

const createFormItemModel = (collectionField: Record<string, unknown>, label?: string): FormItemModel => {
  const item = Object.create(FormItemModel.prototype) as FormItemModel;
  const define = (key: string, value: unknown) => Object.defineProperty(item, key, { value, configurable: true });
  define('collectionField', collectionField);
  define('props', label === undefined ? {} : { label });
  define('_options', { uid: 'form-item', use: 'FormItemModel' });
  define('uid', 'form-item');
  define('title', collectionField.title);
  define('use', 'FormItemModel');
  return item;
};

const createFormModel = (items: FormItemModel[], value: Record<string, unknown> = {}): FlowModel =>
  ({
    uid: 'form-block',
    form: { getFieldsValue: vi.fn().mockReturnValue(value) },
    subModels: { items },
  }) as unknown as FlowModel;

describe('FlowModelsContext form field titles', () => {
  it('prefers the custom form item label over the collection field title', async () => {
    const address = createFormItemModel({ name: 'address', type: 'text', title: '地址' }, '改善措施');
    const content = await parseContextContent(createFormModel([address]));

    expect(content.fields).toEqual([expect.objectContaining({ name: 'address', title: '改善措施' })]);
  });

  it('falls back to the collection field title when no custom label is set', async () => {
    const address = createFormItemModel({ name: 'address', type: 'text', title: '地址' });
    const content = await parseContextContent(createFormModel([address]));

    expect(content.fields).toEqual([expect.objectContaining({ name: 'address', title: '地址' })]);
  });

  it('keeps the internal field name as the data key regardless of the custom label', async () => {
    const address = createFormItemModel({ name: 'address', type: 'text', title: '地址' }, '改善措施');
    const content = await parseContextContent(createFormModel([address], { address: '测试测试' }));

    const field = (content.fields as Array<Record<string, unknown>>)[0];
    expect(field.name).toBe('address');
    expect(field.name).not.toBe('改善措施');
    expect(content.value).toEqual({ address: '测试测试' });
  });

  it('outputs the custom label for form items in the generic component tree', async () => {
    const address = createFormItemModel({ name: 'address', type: 'text', title: '地址' }, '改善措施');
    const root = {
      uid: 'root',
      title: 'Root',
      use: 'SomeContainerModel',
      subModels: { items: [address] },
    } as unknown as FlowModel;
    const content = await parseContextContent(root);

    const children = content.children as { items: Array<{ props: Record<string, unknown> }> };
    expect(children.items[0].props).toMatchObject({ name: 'address', title: '改善措施' });
  });
});
