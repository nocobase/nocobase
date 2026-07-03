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
  test('creates a body field grid for comment item content configuration', () => {
    const createModelOptions = RecordCommentsBlockModel.meta.createModelOptions as {
      subModels?: {
        items?: Array<{
          subModels?: {
            actions?: Array<{
              use?: string;
            }>;
            bodyFields?: {
              use?: string;
            };
          };
        }>;
      };
    };

    expect(createModelOptions.subModels?.items?.[0]?.subModels?.bodyFields).toEqual({
      use: 'DetailsGridModel',
    });
  });

  test('creates comment record actions in quote, edit, delete order', () => {
    const createModelOptions = RecordCommentsBlockModel.meta.createModelOptions as {
      subModels?: {
        items?: Array<{
          subModels?: {
            actions?: Array<{
              use?: string;
            }>;
          };
        }>;
      };
    };

    expect(createModelOptions.subModels?.items?.[0]?.subModels?.actions?.map((action) => action.use)).toEqual([
      'QuoteReplyRecordCommentActionModel',
      'EditRecordCommentActionModel',
      'DeleteRecordCommentActionModel',
    ]);
  });

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

  test('hides owner mapping fields using the selected association foreign key when available', () => {
    const flow: any = (RecordCommentsBlockModel as any).globalFlowRegistry.getFlow('recordCommentsSettings');
    const step: any = flow?.steps?.fieldMapping;
    const ctx = {
      model: {
        props: {},
        collection: {
          fields: [
            { name: 'postId', type: 'bigInt', interface: 'integer', title: 'Post ID' },
            { name: 'post', type: 'belongsTo', interface: 'm2o', title: 'Post', target: 'posts' },
          ],
        },
        context: {
          association: {
            collection: {
              name: 'posts',
            },
            foreignKey: 'postId',
          },
        },
        getResourceSettingsInitParams: () => ({
          associationName: 'posts.comments',
          sourceId: '{{ ctx.popup.record.uuid }}',
        }),
      },
    };

    const schema = step.uiSchema(ctx);
    const params = step.defaultParams(ctx);

    expect(schema.ownerField).toBeUndefined();
    expect(schema.ownerValueField).toBeUndefined();
    expect(params).toMatchObject({
      ownerField: 'postId',
      ownerValueField: '{{ ctx.popup.record.uuid }}',
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

  test('field mapping handler updates props and reapplies the owner filter', async () => {
    const flow: any = (RecordCommentsBlockModel as any).globalFlowRegistry.getFlow('recordCommentsSettings');
    const step: any = flow?.steps?.fieldMapping;
    const model = {
      setProps: vi.fn(),
      applyOwnerFilter: vi.fn(async () => undefined),
    };

    await step.handler({ model } as any, {
      contentField: 'content',
      commenterField: 'createdBy',
      ownerField: 'post',
      ownerValueField: 'ctx.record.id',
      dateField: 'createdAt',
    });

    expect(model.setProps).toHaveBeenCalledWith({
      contentField: 'content',
      commenterField: 'createdBy',
      ownerField: 'post',
      ownerValueField: 'ctx.record.id',
      dateField: 'createdAt',
    });
    expect(model.applyOwnerFilter).toHaveBeenCalled();
  });

  test('field mapping before-save hook persists pending mapping props', () => {
    const flow: any = (RecordCommentsBlockModel as any).globalFlowRegistry.getFlow('recordCommentsSettings');
    const step: any = flow?.steps?.fieldMapping;
    const model = {
      setProps: vi.fn(),
    };

    step.beforeParamsSave({ model } as any, {
      contentField: 'content',
      commenterField: 'author',
      ownerField: 'task',
      ownerValueField: 'taskId',
      dateField: 'createdAt',
    });

    expect(model.setProps).toHaveBeenCalledWith({
      contentField: 'content',
      commenterField: 'author',
      ownerField: 'task',
      ownerValueField: 'taskId',
      dateField: 'createdAt',
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

  test('prefers configured default sorting over the date field sorting', () => {
    const fakeResource = {
      setPageSize: vi.fn(),
      setSort: vi.fn(),
      addFilterGroup: vi.fn(),
      addAppends: vi.fn(),
    };

    const model = {
      props: {
        pageSize: 20,
        globalSort: ['-createdAt'],
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

    expect(fakeResource.setSort).toHaveBeenCalledWith(['-createdAt']);
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

  test('page size handler returns to the first page by default', () => {
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
      shouldAutoJumpToLastPage: RecordCommentsBlockModel.prototype.shouldAutoJumpToLastPage,
    };

    step.handler({ model } as any, { pageSize: 10 });

    expect(resource.setPageSize).toHaveBeenCalledWith(10);
    expect(resource.setPage).toHaveBeenCalledWith(1);
  });

  test('page size handler keeps the list on the last page when auto jump to last page is enabled', () => {
    const flow: any = (RecordCommentsBlockModel as any).globalFlowRegistry.getFlow('recordCommentsSettings');
    const step: any = flow?.steps?.pageSize;
    const resource = {
      setPageSize: vi.fn(),
      setPage: vi.fn(),
      getCount: vi.fn(() => 41),
      getPageSize: vi.fn(() => 20),
    };
    const model = {
      props: {
        autoJumpToLastPage: true,
      },
      resource,
      setProps: vi.fn(),
      getLastPage: RecordCommentsBlockModel.prototype.getLastPage,
      shouldAutoJumpToLastPage: RecordCommentsBlockModel.prototype.shouldAutoJumpToLastPage,
    };

    step.handler({ model } as any, { pageSize: 10 });

    expect(resource.setPageSize).toHaveBeenCalledWith(10);
    expect(resource.setPage).toHaveBeenCalledWith(5);
  });

  test('auto jump to last page setting moves between the last page and first page', () => {
    const flow: any = (RecordCommentsBlockModel as any).globalFlowRegistry.getFlow('recordCommentsSettings');
    const step: any = flow?.steps?.autoJumpToLastPage;
    const resource = {
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

    step.handler({ model } as any, { autoJumpToLastPage: false });
    step.handler({ model } as any, { autoJumpToLastPage: true });

    expect(model.setProps).toHaveBeenNthCalledWith(1, { autoJumpToLastPage: false });
    expect(model.setProps).toHaveBeenNthCalledWith(2, { autoJumpToLastPage: true });
    expect(resource.setPage).toHaveBeenNthCalledWith(1, 1);
    expect(resource.setPage).toHaveBeenNthCalledWith(2, 3);
  });

  test('settings expose data scope, default sorting, last-page jump, and select-mode page size controls', () => {
    const flow: any = (RecordCommentsBlockModel as any).globalFlowRegistry.getFlow('recordCommentsSettings');
    const settingKeys = Object.keys(flow?.steps || {});

    expect(flow?.steps?.dataScope).toMatchObject({
      use: 'dataScope',
    });
    expect(flow?.steps?.defaultSorting).toMatchObject({
      use: 'sortingRule',
    });
    expect(flow?.steps?.pageSize?.uiMode).toMatchObject({
      type: 'select',
      key: 'pageSize',
    });
    expect(flow?.steps?.autoJumpToLastPage?.uiMode).toMatchObject({
      type: 'switch',
      key: 'autoJumpToLastPage',
    });
    expect(flow?.steps?.autoJumpToLastPage?.defaultParams).toMatchObject({
      autoJumpToLastPage: false,
    });
    expect(settingKeys.indexOf('autoJumpToLastPage')).toBeGreaterThan(settingKeys.indexOf('defaultSorting'));
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

  test('does not report preparing state before the initial last page is loaded by default', () => {
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
      shouldAutoJumpToLastPage: RecordCommentsBlockModel.prototype.shouldAutoJumpToLastPage,
    };

    expect(RecordCommentsBlockModel.prototype.isPreparingLastPageLoad.call(model)).toBe(false);
  });

  test('reports preparing state before the initial last page is loaded when auto jump is enabled', () => {
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
        autoJumpToLastPage: true,
        pageSize: 20,
      },
      getLastPage: RecordCommentsBlockModel.prototype.getLastPage,
      shouldAutoJumpToLastPage: RecordCommentsBlockModel.prototype.shouldAutoJumpToLastPage,
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
        autoJumpToLastPage: true,
        pageSize: 20,
      },
      refresh: vi.fn(() => refreshPromise),
      getLastPage: RecordCommentsBlockModel.prototype.getLastPage,
      isPreparingLastPageLoad: RecordCommentsBlockModel.prototype.isPreparingLastPageLoad,
      shouldAutoJumpToLastPage: RecordCommentsBlockModel.prototype.shouldAutoJumpToLastPage,
    };

    const ensurePromise = RecordCommentsBlockModel.prototype.ensureLastPageLoaded.call(model);

    expect(resource.setPage).toHaveBeenCalledWith(3);
    expect(RecordCommentsBlockModel.prototype.isPreparingLastPageLoad.call(model)).toBe(true);

    resolveRefresh?.();
    await ensurePromise;

    expect(RecordCommentsBlockModel.prototype.isPreparingLastPageLoad.call(model)).toBe(false);
  });

  test('page changes disable automatic last-page loading and refresh the resource', async () => {
    const resource = {
      loading: false,
      setPage: vi.fn(),
    };
    const model = {
      shouldLoadLastPage: true,
      resource,
      refresh: vi.fn(async () => undefined),
    };

    await RecordCommentsBlockModel.prototype.handlePageChange.call(model, 4);

    expect(model.shouldLoadLastPage).toBe(false);
    expect(resource.setPage).toHaveBeenCalledWith(4);
    expect(resource.loading).toBe(true);
    expect(model.refresh).toHaveBeenCalled();
  });
});

describe('RecordCommentsBlockModel rendering guards', () => {
  test('shows a mapping warning before required fields are configured', () => {
    const element = RecordCommentsBlockModel.prototype.renderComponent.call({
      mapping: {
        contentField: 'content',
      },
      context: {
        t: (value: string) => value,
      },
    });

    expect(element.props.message).toBe(
      'Please configure the comment content field, commenter field, comment owner field, and comment date field.',
    );
    expect(element.props.type).toBe('warning');
  });

  test('shows a type warning when the owner value does not match the owner field', () => {
    const element = RecordCommentsBlockModel.prototype.renderComponent.call({
      mapping: {
        contentField: 'content',
        commenterField: 'createdBy',
        ownerField: 'post',
        dateField: 'createdAt',
      },
      ownerFilterValueState: {
        compatible: false,
      },
      context: {
        t: (value: string) => value,
      },
    });

    expect(element.props.message).toBe(
      'The comment owner field value type does not match the comment owner field. Please reconfigure the field mapping.',
    );
    expect(element.props.type).toBe('warning');
  });

  test('shows an empty owner warning when the current record has no owner value', () => {
    const element = RecordCommentsBlockModel.prototype.renderComponent.call({
      mapping: {
        contentField: 'content',
        commenterField: 'createdBy',
        ownerField: 'post',
        dateField: 'createdAt',
      },
      ownerFilterValueState: {
        compatible: true,
        value: undefined,
      },
      context: {
        t: (value: string) => value,
      },
    });

    expect(element.props.message).toBe('The current record value is empty, so comments cannot be loaded.');
    expect(element.props.type).toBe('warning');
  });

  test('renders the comment view with current resource data when mapping is valid', () => {
    const handlePageChange = vi.fn();
    const records = [{ id: 1, content: 'Hello' }];
    const element = RecordCommentsBlockModel.prototype.renderComponent.call({
      mapping: {
        contentField: 'content',
        commenterField: 'createdBy',
        ownerField: 'post',
        dateField: 'createdAt',
      },
      ownerFilterValueState: {
        compatible: true,
        value: 10,
      },
      resource: {
        getData: vi.fn(() => records),
      },
      handlePageChange,
    });

    expect(element.props.dataSource).toBe(records);
    element.props.onPageChange(2);
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });
});
