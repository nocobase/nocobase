/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormBlockModel, FormItemModel } from '@nocobase/client';
import type { FlowModel } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { FlowModelsContext } from '../../ai-employees/context/flow-models';

type GetContent = NonNullable<typeof FlowModelsContext.getContent>;
type WorkContextApplication = Parameters<GetContent>[0];

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
  expect(content).toBeDefined();
  return content as Record<string, unknown>;
};

const createFormItemModel = (collectionField: Record<string, unknown>, label?: string): FormItemModel => {
  const item = Object.create(FormItemModel.prototype) as FormItemModel;
  const define = (key: string, value: unknown) => Object.defineProperty(item, key, { value, configurable: true });
  define('collectionField', collectionField);
  define('props', label === undefined ? {} : { label });
  define('subModels', {});
  define('uid', 'form-item');
  define('title', collectionField.title);
  define('use', 'FormItemModel');
  return item;
};

const createFormModel = (items: FormItemModel[], value: Record<string, unknown> = {}): FormBlockModel => {
  const form = Object.create(FormBlockModel.prototype) as FormBlockModel;
  const define = (key: string, propertyValue: unknown) =>
    Object.defineProperty(form, key, { value: propertyValue, configurable: true });
  define('uid', 'form-block');
  define('title', 'Form block');
  define('use', 'FormBlockModel');
  define('form', { getFieldsValue: vi.fn().mockReturnValue(value) });
  define('subModels', { items });
  return form;
};

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
