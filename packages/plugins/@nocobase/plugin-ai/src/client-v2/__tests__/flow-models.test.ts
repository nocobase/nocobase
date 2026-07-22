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
