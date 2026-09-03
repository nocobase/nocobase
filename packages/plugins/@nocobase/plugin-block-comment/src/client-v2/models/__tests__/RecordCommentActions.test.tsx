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
import { describe, expect, it, vi } from 'vitest';

import type { FlowModel } from '@nocobase/flow-engine';

import type { RecordCommentsBlockModel } from '../RecordCommentsBlockModel';
import { RecordCommentActions } from '../components/RecordCommentActions';

vi.mock('@nocobase/flow-engine', () => ({
  AddSubModelButton: ({ children, model }: { children: React.ReactNode; model: { uid: string } }) => (
    <button data-testid="settings-target" type="button">
      {model.uid}
      {children}
    </button>
  ),
  DndProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DragHandler: () => null,
  Droppable: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FlowModelRenderer: ({ model }: { model: { constructor: { name: string } } }) => (
    <button type="button">{model.constructor.name}</button>
  ),
  FlowSettingsButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  observer: <T extends React.ComponentType>(component: T) => component,
}));

type FakeFlowContext = Record<string, unknown> & {
  flowSettingsEnabled?: boolean;
  defineProperty: (name: string, descriptor: PropertyDescriptor) => void;
  defineMethod: (name: string, value: unknown) => void;
};

type FakeAction = {
  uid: string;
  context: FakeFlowContext;
  createFork: (params: Record<string, unknown>, forkKey: string) => FakeAction;
};

function createContext(flowSettingsEnabled = false): FakeFlowContext {
  return {
    flowSettingsEnabled,
    defineProperty(name, descriptor) {
      Object.defineProperty(this, name, descriptor);
    },
    defineMethod(name, value) {
      this[name] = value;
    },
  };
}

function createAction(ActionClass: new (uid: string) => FakeAction, uid: string) {
  return new ActionClass(uid);
}

class DeleteRecordCommentActionModel implements FakeAction {
  context = createContext();

  constructor(public uid: string) {}

  createFork(_params: Record<string, unknown>, forkKey: string) {
    return createAction(DeleteRecordCommentActionModel, forkKey);
  }
}

class EditRecordCommentActionModel implements FakeAction {
  context = createContext();

  constructor(public uid: string) {}

  createFork(_params: Record<string, unknown>, forkKey: string) {
    return createAction(EditRecordCommentActionModel, forkKey);
  }
}

class QuoteReplyRecordCommentActionModel implements FakeAction {
  context = createContext();

  constructor(public uid: string) {}

  createFork(_params: Record<string, unknown>, forkKey: string) {
    return createAction(QuoteReplyRecordCommentActionModel, forkKey);
  }
}

function createItemModel(actions: FakeAction[], flowSettingsEnabled = false) {
  return {
    uid: flowSettingsEnabled ? 'fork-item' : 'item',
    context: createContext(flowSettingsEnabled),
    translate: (value: string) => value,
    mapSubModels(_key: string, renderItem: (action: FakeAction, index: number) => React.ReactNode) {
      return actions.map(renderItem);
    },
  } as unknown as FlowModel;
}

const blockModel = {
  collection: {
    filterTargetKey: 'id',
  },
  resource: {},
} as unknown as RecordCommentsBlockModel;

describe('RecordCommentActions', () => {
  it('renders only one built-in action for duplicated historical action models', () => {
    const itemModel = createItemModel([
      createAction(QuoteReplyRecordCommentActionModel, 'quote-1'),
      createAction(DeleteRecordCommentActionModel, 'delete-1'),
      createAction(DeleteRecordCommentActionModel, 'delete-2'),
      createAction(EditRecordCommentActionModel, 'edit-1'),
      createAction(EditRecordCommentActionModel, 'edit-2'),
    ]);

    render(
      <RecordCommentActions
        blockModel={blockModel}
        record={{ id: 1 }}
        itemModel={itemModel}
        forkKeyPrefix="comment_item_1"
        setEditing={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('button', { name: 'QuoteReplyRecordCommentActionModel' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'DeleteRecordCommentActionModel' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'EditRecordCommentActionModel' })).toHaveLength(1);
  });

  it('uses the template item model for action settings instead of the per-record fork', () => {
    const itemModel = createItemModel([], true);
    const actionSettingsModel = {
      ...createItemModel([], true),
      uid: 'template-item',
    } as FlowModel;

    render(
      <RecordCommentActions
        blockModel={blockModel}
        record={{ id: 1 }}
        itemModel={itemModel}
        actionSettingsModel={actionSettingsModel}
        forkKeyPrefix="comment_item_1"
        setEditing={vi.fn()}
      />,
    );

    expect(screen.getByTestId('settings-target')).toHaveTextContent('template-item');
  });
});
