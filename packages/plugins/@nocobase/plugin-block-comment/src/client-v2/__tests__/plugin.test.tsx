/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const state = vi.hoisted(() => ({
  registerComponents: vi.fn(),
  registerModelLoaders: vi.fn(),
}));

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();

  return {
    ...actual,
    Plugin: class {
      flowEngine: {
        flowSettings: {
          registerComponents: ReturnType<typeof vi.fn>;
        };
        registerModelLoaders: ReturnType<typeof vi.fn>;
      };

      constructor() {
        this.flowEngine = {
          flowSettings: {
            registerComponents: state.registerComponents,
          },
          registerModelLoaders: state.registerModelLoaders,
        };
      }
    },
  };
});

describe('PluginRecordCommentsClientV2', () => {
  beforeEach(() => {
    state.registerComponents.mockClear();
    state.registerModelLoaders.mockClear();
  });

  it('registers field select component and lazy model loaders', async () => {
    const { default: PluginRecordCommentsClientV2 } = await import('../plugin');
    const plugin = new PluginRecordCommentsClientV2();

    await plugin.load();

    expect(state.registerComponents).toHaveBeenCalledWith({
      RecordCommentFieldSelect: expect.objectContaining({
        type: expect.any(Function),
      }),
    });
    expect(state.registerModelLoaders).toHaveBeenCalledWith({
      RecordCommentsBlockModel: { loader: expect.any(Function) },
      RecordCommentItemModel: { loader: expect.any(Function) },
      RecordCommentActionGroupModel: { loader: expect.any(Function) },
      RecordCommentSubmitActionGroupModel: { loader: expect.any(Function) },
      EditRecordCommentActionModel: { loader: expect.any(Function) },
      DeleteRecordCommentActionModel: { loader: expect.any(Function) },
      QuoteReplyRecordCommentActionModel: { loader: expect.any(Function) },
    });

    const loaders = state.registerModelLoaders.mock.calls[0][0] as Record<
      string,
      {
        loader: () => Promise<Record<string, unknown>>;
      }
    >;

    await expect(loaders.RecordCommentsBlockModel.loader()).resolves.toMatchObject({
      RecordCommentsBlockModel: expect.any(Function),
      RecordCommentItemModel: expect.any(Function),
    });
    await expect(loaders.RecordCommentActionGroupModel.loader()).resolves.toMatchObject({
      RecordCommentActionGroupModel: expect.any(Function),
      RecordCommentSubmitActionGroupModel: expect.any(Function),
      EditRecordCommentActionModel: expect.any(Function),
      DeleteRecordCommentActionModel: expect.any(Function),
      QuoteReplyRecordCommentActionModel: expect.any(Function),
    });
    await expect(Promise.all(Object.values(loaders).map(({ loader }) => loader()))).resolves.toHaveLength(7);
  });
});
