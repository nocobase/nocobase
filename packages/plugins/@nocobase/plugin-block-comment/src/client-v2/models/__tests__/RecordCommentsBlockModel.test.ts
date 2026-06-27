/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, test, vi } from 'vitest';

import { COMMENT_OWNER_FILTER_BY_TK_VARIABLE } from '../utils';
import { RecordCommentsBlockModel } from '../RecordCommentsBlockModel';

describe('RecordCommentsBlockModel field mapping settings', () => {
  test('hides owner mapping fields when the block is created from an association field', () => {
    const flow: any = (RecordCommentsBlockModel as any).globalFlowRegistry.getFlow('recordCommentsSettings');
    const step: any = flow?.steps?.fieldMapping;
    const ctx = {
      model: {
        props: {},
        collection: {
          fields: [{ name: 'post', type: 'belongsTo', interface: 'm2o', title: 'Post', target: 'posts' }],
        },
        context: {
          association: {
            collection: {
              name: 'posts',
            },
          },
        },
        getResourceSettingsInitParams: () => ({
          associationName: 'posts.comments',
        }),
      },
    };

    const schema = step.uiSchema(ctx);
    const params = step.defaultParams(ctx);

    expect(schema.ownerField).toBeUndefined();
    expect(schema.ownerValueField).toBeUndefined();
    expect(params).toMatchObject({
      ownerField: 'post',
      ownerValueField: COMMENT_OWNER_FILTER_BY_TK_VARIABLE,
    });
  });

  test('keeps owner mapping fields visible for direct comment collection blocks', () => {
    const flow: any = (RecordCommentsBlockModel as any).globalFlowRegistry.getFlow('recordCommentsSettings');
    const step: any = flow?.steps?.fieldMapping;
    const ctx = {
      model: {
        props: {},
        collection: {
          fields: [{ name: 'post', type: 'belongsTo', interface: 'm2o', title: 'Post', target: 'posts' }],
        },
        context: {},
        getResourceSettingsInitParams: () => ({
          collectionName: 'comments',
        }),
      },
      collection: {
        fields: [{ name: 'post', type: 'belongsTo', interface: 'm2o', title: 'Post', target: 'posts' }],
      },
    };

    const schema = step.uiSchema(ctx);
    const params = step.defaultParams(ctx);

    expect(schema.ownerField).toBeTruthy();
    expect(schema.ownerValueField).toBeTruthy();
    expect(params).toMatchObject({
      ownerField: undefined,
      ownerValueField: undefined,
    });
  });
});

describe('RecordCommentsBlockModel pagination and sorting', () => {
  test('sorts comments by date field in ascending order', () => {
    const fakeResource = {
      setPageSize: vi.fn(),
      setSort: vi.fn(),
      addFilterGroup: vi.fn(),
      addAppends: vi.fn(),
      getCount: vi.fn(() => 0),
      getPageSize: vi.fn(() => 20),
    };

    const model = {
      props: {
        pageSize: 20,
      },
      mapping: {
        dateField: 'createdAt',
        commenterField: 'createdBy',
      },
      context: {
        createResource: () => fakeResource,
      },
      ownerValue: undefined,
      collection: {},
    };

    RecordCommentsBlockModel.prototype.createResource.call(model);

    expect(fakeResource.setSort).toHaveBeenCalledWith(['createdAt']);
  });

  test('uses normalized owner values when creating owner filters', () => {
    const fakeResource = {
      setPageSize: vi.fn(),
      setSort: vi.fn(),
      addFilterGroup: vi.fn(),
      addAppends: vi.fn(),
    };

    const model = {
      props: {
        pageSize: 20,
      },
      mapping: {
        ownerField: 'task',
      },
      ownerFilterValueState: {
        compatible: true,
        value: 123,
      },
      context: {
        createResource: () => fakeResource,
      },
      collection: {
        fields: [
          {
            name: 'task',
            type: 'belongsTo',
            interface: 'm2o',
            targetCollection: {
              fields: [{ name: 'id', type: 'bigInt', interface: 'integer' }],
            },
          },
        ],
      },
    };

    RecordCommentsBlockModel.prototype.createResource.call(model);

    expect(fakeResource.addFilterGroup).toHaveBeenCalledWith('record-comments-owner', {
      task: {
        id: {
          $eq: 123,
        },
      },
    });
  });

  test('does not create owner filters when owner values are incompatible', () => {
    const fakeResource = {
      setPageSize: vi.fn(),
      setSort: vi.fn(),
      addFilterGroup: vi.fn(),
      addAppends: vi.fn(),
    };

    const model = {
      props: {
        pageSize: 20,
      },
      mapping: {
        ownerField: 'task',
      },
      ownerFilterValueState: {
        compatible: false,
      },
      context: {
        createResource: () => fakeResource,
      },
      collection: {
        fields: [{ name: 'task', type: 'belongsTo', interface: 'm2o' }],
      },
    };

    RecordCommentsBlockModel.prototype.createResource.call(model);

    expect(fakeResource.addFilterGroup).not.toHaveBeenCalled();
  });

  test('page size handler keeps the list on the last page', () => {
    const flow: any = (RecordCommentsBlockModel as any).globalFlowRegistry.getFlow('recordCommentsSettings');
    const step: any = flow?.steps?.pageSize;
    const resource = {
      setPageSize: vi.fn(),
      setPage: vi.fn(),
      getCount: vi.fn(() => 41),
      getPageSize: vi.fn(() => 20),
    };
    const model = {
      props: {},
      resource,
      setProps: vi.fn(),
      getLastPage: RecordCommentsBlockModel.prototype.getLastPage,
    };

    step.handler({ model } as any, { pageSize: 10 });

    expect(resource.setPageSize).toHaveBeenCalledWith(10);
    expect(resource.setPage).toHaveBeenCalledWith(5);
  });

  test('ensureLastPageLoaded snaps back when the current page is larger than the last page', async () => {
    const resource = {
      loading: false,
      setPage: vi.fn(),
      getPage: vi.fn(() => 2),
      getCount: vi.fn(() => 20),
      getPageSize: vi.fn(() => 20),
    };
    const model = {
      shouldLoadLastPage: false,
      loadingLastPage: {
        value: false,
      },
      resource,
      props: {
        pageSize: 20,
      },
      refresh: vi.fn(async () => undefined),
      getLastPage: RecordCommentsBlockModel.prototype.getLastPage,
    };

    await RecordCommentsBlockModel.prototype.ensureLastPageLoaded.call(model);

    expect(resource.setPage).toHaveBeenCalledWith(1);
    expect(model.refresh).toHaveBeenCalled();
  });

  test('reports preparing state before the initial last page is loaded', () => {
    const resource = {
      getPage: vi.fn(() => 1),
      getCount: vi.fn(() => 41),
      getPageSize: vi.fn(() => 20),
    };
    const model = {
      shouldLoadLastPage: true,
      loadingLastPage: {
        value: false,
      },
      resource,
      props: {
        pageSize: 20,
      },
      getLastPage: RecordCommentsBlockModel.prototype.getLastPage,
    };

    expect(RecordCommentsBlockModel.prototype.isPreparingLastPageLoad.call(model)).toBe(true);
  });

  test('keeps preparing state while the initial last page request is pending', async () => {
    let resolveRefresh: (() => void) | undefined;
    const refreshPromise = new Promise<void>((resolve) => {
      resolveRefresh = resolve;
    });
    const resource = {
      loading: false,
      setPage: vi.fn(),
      getPage: vi.fn(() => 1),
      getCount: vi.fn(() => 41),
      getPageSize: vi.fn(() => 20),
    };
    const model = {
      shouldLoadLastPage: true,
      loadingLastPage: {
        value: false,
      },
      resource,
      props: {
        pageSize: 20,
      },
      refresh: vi.fn(() => refreshPromise),
      getLastPage: RecordCommentsBlockModel.prototype.getLastPage,
      isPreparingLastPageLoad: RecordCommentsBlockModel.prototype.isPreparingLastPageLoad,
    };

    const ensurePromise = RecordCommentsBlockModel.prototype.ensureLastPageLoaded.call(model);

    expect(resource.setPage).toHaveBeenCalledWith(3);
    expect(RecordCommentsBlockModel.prototype.isPreparingLastPageLoad.call(model)).toBe(true);

    resolveRefresh?.();
    await ensurePromise;

    expect(RecordCommentsBlockModel.prototype.isPreparingLastPageLoad.call(model)).toBe(false);
  });
});
