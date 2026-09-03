/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import '@nocobase/client';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { TableBlockModel } from '../TableBlockModel';

function createTableModel(options: { isMobileLayout?: boolean; flowSettingsEnabled?: boolean } = {}) {
  const engine = new FlowEngine();
  engine.registerModels({ TableBlockModel });
  engine.context.defineProperty('isMobileLayout', { value: !!options.isMobileLayout });
  engine.context.defineProperty('flowSettingsEnabled', { value: !!options.flowSettingsEnabled });

  const ds = engine.dataSourceManager.getDataSource('main');
  ds.addCollection({
    name: 'posts',
    filterTargetKey: 'id',
    fields: [
      { name: 'id', type: 'integer', interface: 'number' },
      { name: 'title', type: 'string', interface: 'input' },
    ],
  });

  return engine.createModel<TableBlockModel>({
    uid: `posts-table-${options.isMobileLayout ? 'mobile' : 'desktop'}`,
    use: 'TableBlockModel',
    stepParams: {
      resourceSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: 'posts',
        },
      },
    },
  });
}

function getSettingsButton(element: React.ReactElement) {
  return element.props.children as React.ReactElement;
}

describe('TableBlockModel mobile settings buttons', () => {
  it('renders table actions and fields settings as icon-only buttons in mobile layouts', () => {
    const model = createTableModel({ isMobileLayout: true, flowSettingsEnabled: true });
    const actionButton = getSettingsButton(model.renderConfigureActions() as React.ReactElement);
    const addColumn = model.getColumns().find((column) => column.key === 'addColumn');
    const fieldsButton = getSettingsButton(
      (addColumn?.title as React.ReactElement).type({ model }) as React.ReactElement,
    );

    expect(actionButton.props.children).toBeNull();
    expect(actionButton.props['aria-label']).toBe('Actions');
    expect(fieldsButton.props.children).toBeNull();
    expect(fieldsButton.props['aria-label']).toBe('Fields');
    expect(addColumn?.width).toBeUndefined();
  });

  it('keeps table actions and fields settings labels outside mobile layouts', () => {
    const model = createTableModel({ flowSettingsEnabled: true });
    const actionButton = getSettingsButton(model.renderConfigureActions() as React.ReactElement);
    const addColumn = model.getColumns().find((column) => column.key === 'addColumn');
    const fieldsButton = getSettingsButton(
      (addColumn?.title as React.ReactElement).type({ model }) as React.ReactElement,
    );

    expect(actionButton.props.children).toBe('Actions');
    expect(fieldsButton.props.children).toBe('Fields');
    expect(addColumn?.width).toBe(100);
  });
});
