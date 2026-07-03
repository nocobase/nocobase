/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

import type { FlowModel } from '@nocobase/flow-engine';
import type { RecordCommentsBlockModel } from '../RecordCommentsBlockModel';

const state = vi.hoisted(() => ({
  renderedForks: [] as Array<{ model: MockForkModel }>,
  addSubModelProps: undefined as
    | {
        subModelKey?: string;
        subModelBaseClasses?: string[];
      }
    | undefined,
}));

class MockContext {
  values = new Map<string, unknown>();

  defineProperty(name: string, descriptor: { get?: () => unknown; value?: unknown }) {
    this.values.set(name, descriptor.get ? descriptor.get() : descriptor.value);
  }

  defineMethod(name: string, value: unknown) {
    this.values.set(name, value);
  }
}

class MockForkModel {
  uid: string;
  forkId: string;
  context = new MockContext();

  constructor(uid: string, forkId: string) {
    this.uid = uid;
    this.forkId = forkId;
  }
}

vi.mock('@nocobase/flow-engine', () => ({
  AddSubModelButton: ({
    children,
    subModelKey,
    subModelBaseClasses,
  }: {
    children?: React.ReactNode;
    subModelKey?: string;
    subModelBaseClasses?: string[];
  }) => {
    state.addSubModelProps = { subModelKey, subModelBaseClasses };
    return <div>{children}</div>;
  },
  DndProvider: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DragHandler: () => <span>Drag</span>,
  Droppable: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  FlowModelRenderer: ({ model }: { model: MockForkModel }) => {
    state.renderedForks.push({ model });
    return <button type="button">Rendered {model.uid}</button>;
  },
  FlowSettingsButton: ({ children }: { children?: React.ReactNode }) => <button type="button">{children}</button>,
  observer: (component: unknown) => component,
}));

vi.mock('@emotion/css', () => ({
  css: () => 'record-comment-actions',
}));

describe('RecordCommentActions', () => {
  beforeEach(() => {
    state.renderedForks = [];
    state.addSubModelProps = undefined;
  });

  it('creates action forks with the current comment context', async () => {
    const { RecordCommentActions } = await import('../components/RecordCommentActions');
    const setEditing = vi.fn();
    const resource = { destroy: vi.fn() };
    const collection = { filterTargetKey: 'id' };
    const record = { id: 'comment/1', content: 'Hello' };
    const action = {
      uid: 'delete action',
      createFork: vi.fn((_props: object, forkKey: string) => new MockForkModel('delete action', forkKey)),
    };
    const itemModel = {
      context: {
        flowSettingsEnabled: false,
      },
      mapSubModels: (_key: string, callback: (model: typeof action, index: number) => React.ReactNode) =>
        callback(action, 0),
    };
    const blockModel = {
      collection,
      resource,
    } as unknown as RecordCommentsBlockModel;

    render(
      <RecordCommentActions
        blockModel={blockModel}
        record={record}
        itemModel={itemModel as unknown as FlowModel}
        forkKeyPrefix="comment item"
        setEditing={setEditing}
      />,
    );

    expect(action.createFork).toHaveBeenCalledWith({}, 'comment_item_comment_1_delete_action_0');
    expect(screen.getByRole('button', { name: 'Rendered delete action' })).toBeInTheDocument();

    const forkContext = state.renderedForks[0].model.context.values;
    expect(forkContext.get('record')).toBe(record);
    expect(forkContext.get('resource')).toBe(resource);
    expect(forkContext.get('collection')).toBe(collection);
    expect(forkContext.get('blockModel')).toBe(blockModel);
    expect(forkContext.get('setEditing')).toBe(setEditing);
  });

  it('shows the add-action settings button in configuration mode', async () => {
    const { RecordCommentActions } = await import('../components/RecordCommentActions');
    const itemModel = {
      context: {
        flowSettingsEnabled: true,
      },
      translate: (value: string) => value,
      mapSubModels: () => null,
    };

    render(
      <RecordCommentActions
        blockModel={{ collection: {}, resource: {} } as RecordCommentsBlockModel}
        record={{ id: 1 }}
        itemModel={itemModel as unknown as FlowModel}
        forkKeyPrefix="comment"
        setEditing={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Actions' })).toBeInTheDocument();
    expect(state.addSubModelProps).toEqual({
      subModelKey: 'actions',
      subModelBaseClasses: ['RecordCommentActionGroupModel'],
    });
  });
});
