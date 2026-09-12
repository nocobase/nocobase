/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

type GridModelShape = {
  context: {
    addDelegate: ReturnType<typeof vi.fn>;
    defineProperty: ReturnType<typeof vi.fn>;
  };
  parent?: {
    uid?: string;
  };
  subModels?: Record<string, unknown>;
  uid: string;
};

type TabModelShape = {
  context: {
    isMobileLayout?: boolean;
    model: TabModelShape;
    themeToken?: {
      marginBlock?: number;
    };
    view?: {
      inputArgs?: Record<string, unknown>;
    };
  };
  setSubModel?: ReturnType<typeof vi.fn>;
  subModels?: {
    grid?: GridModelShape;
  };
  uid: string;
};

const holder = vi.hoisted(() => {
  const getModelClassAsync = vi.fn();
  const loadModel = vi.fn();
  const loadOrCreateModel = vi.fn();
  return {
    flowEngine: {
      getModelClassAsync,
      loadModel,
      loadOrCreateModel,
    },
    getModelClassAsync,
    loadModel,
    loadOrCreateModel,
    registerWorkflowCcModelLoaders: vi.fn(),
    renderedModels: [] as GridModelShape[],
  };
});

vi.mock('@nocobase/client-v2', () => {
  class ChildPageModel {
    static define = vi.fn();
    static registerFlow = vi.fn();
    context = {
      dataSourceManager: {
        getCollection: vi.fn(),
      },
      defineMethod: vi.fn(),
      defineProperty: vi.fn(),
    };
    getFirstTab() {
      return null;
    }
    onInit() {}
  }

  class ChildPageTabModel {
    context: unknown;
    subModels?: Record<string, unknown>;
    uid = '';
  }

  return {
    ChildPageModel,
    ChildPageTabModel,
    SkeletonFallback: () => <div data-testid="skeleton" />,
  };
});

vi.mock('@nocobase/flow-engine', () => ({
  FlowModelRenderer: (props: { model: GridModelShape }) => {
    holder.renderedModels.push(props.model);
    return <div data-testid="flow-model">{props.model.uid}</div>;
  },
  useFlowEngine: () => holder.flowEngine,
}));

vi.mock('../registerModelLoaders', () => ({
  registerWorkflowCcModelLoaders: holder.registerWorkflowCcModelLoaders,
}));

import { CCChildPageTabModel } from '../CCChildPageModel';

function createGrid(uid: string, parentUid?: string, items: unknown[] = []): GridModelShape {
  return {
    uid,
    parent: parentUid ? { uid: parentUid } : undefined,
    subModels: {
      items,
    },
    context: {
      addDelegate: vi.fn(),
      defineProperty: vi.fn(),
    },
  };
}

function createTab(uid = 'cc_tab'): CCChildPageTabModel & TabModelShape {
  const tab = new CCChildPageTabModel() as CCChildPageTabModel & TabModelShape;
  tab.uid = uid;
  tab.context = {
    model: tab,
    themeToken: {
      marginBlock: 16,
    },
  };
  tab.setSubModel = vi.fn((subKey: string, model: GridModelShape) => {
    tab.subModels = {
      ...tab.subModels,
      [subKey]: model,
    };
    return model;
  });
  return tab;
}

afterEach(() => {
  vi.clearAllMocks();
  holder.renderedModels = [];
});

describe('CCChildPageModel', () => {
  it('renders an existing tab grid without loading or creating another grid', async () => {
    const existingGrid = createGrid('existing_grid', 'cc_tab', [{ uid: 'node_details', use: 'NodeDetailsModel' }]);
    const createdGrid = createGrid('created_grid', 'cc_tab');
    const tab = createTab();
    tab.subModels = {
      grid: existingGrid,
    };
    holder.loadOrCreateModel.mockResolvedValue(createdGrid);

    render(<>{tab.renderChildren()}</>);

    await screen.findByTestId('flow-model');
    expect(holder.renderedModels.at(-1)).toBe(existingGrid);
    expect(holder.loadModel).not.toHaveBeenCalled();
    expect(holder.loadOrCreateModel).not.toHaveBeenCalled();
    expect(tab.setSubModel).not.toHaveBeenCalled();
  });

  it('reuses a loaded grid from the server instead of creating a second grid', async () => {
    const loadedGrid = createGrid('loaded_grid');
    const createdGrid = createGrid('created_grid');
    const tab = createTab();
    holder.loadModel.mockResolvedValue(loadedGrid);
    holder.loadOrCreateModel.mockResolvedValue(createdGrid);

    render(<>{tab.renderChildren()}</>);

    await screen.findByTestId('flow-model');
    expect(holder.renderedModels.at(-1)).toBe(loadedGrid);
    expect(holder.loadModel).toHaveBeenCalledWith({
      parentId: 'cc_tab',
      refresh: true,
      subKey: 'grid',
    });
    expect(holder.loadOrCreateModel).not.toHaveBeenCalled();
    expect(tab.setSubModel).toHaveBeenCalledWith('grid', loadedGrid);
  });

  it('prefers a loaded populated grid over an existing empty tab grid', async () => {
    const emptyGrid = createGrid('empty_grid', 'cc_tab');
    const populatedGrid = createGrid('populated_grid', 'cc_tab', [{ uid: 'node_details', use: 'NodeDetailsModel' }]);
    const createdGrid = createGrid('created_grid', 'cc_tab');
    const tab = createTab();
    tab.subModels = {
      grid: emptyGrid,
    };
    holder.loadModel.mockResolvedValue(populatedGrid);
    holder.loadOrCreateModel.mockResolvedValue(createdGrid);

    render(<>{tab.renderChildren()}</>);

    await screen.findByTestId('flow-model');
    expect(holder.renderedModels.at(-1)).toBe(populatedGrid);
    expect(holder.loadModel).toHaveBeenCalledWith({
      parentId: 'cc_tab',
      refresh: true,
      subKey: 'grid',
    });
    expect(holder.loadOrCreateModel).not.toHaveBeenCalled();
    expect(tab.setSubModel).toHaveBeenCalledWith('grid', populatedGrid);
  });

  it('uses a refreshed empty grid instead of the stale local empty grid', async () => {
    const emptyGrid = createGrid('empty_grid', 'cc_tab');
    const refreshedGrid = createGrid('empty_grid', 'cc_tab');
    const tab = createTab();
    tab.subModels = {
      grid: emptyGrid,
    };
    holder.loadModel.mockResolvedValue(refreshedGrid);

    render(<>{tab.renderChildren()}</>);

    await screen.findByTestId('flow-model');
    expect(holder.renderedModels.at(-1)).toBe(refreshedGrid);
    expect(holder.loadModel).toHaveBeenCalledWith({
      parentId: 'cc_tab',
      refresh: true,
      subKey: 'grid',
    });
    expect(holder.loadOrCreateModel).not.toHaveBeenCalled();
    expect(tab.setSubModel).toHaveBeenCalledWith('grid', refreshedGrid);
  });

  it('creates an unsaved fallback grid when neither local nor remote grid exists', async () => {
    const fallbackGrid = createGrid('fallback_grid', 'cc_tab');
    const tab = createTab();
    holder.loadModel.mockResolvedValue(null);
    holder.loadOrCreateModel.mockResolvedValue(fallbackGrid);

    render(<>{tab.renderChildren()}</>);

    await screen.findByTestId('flow-model');
    expect(holder.renderedModels.at(-1)).toBe(fallbackGrid);
    expect(holder.loadModel).toHaveBeenCalledWith({
      parentId: 'cc_tab',
      refresh: true,
      subKey: 'grid',
    });
    expect(holder.loadOrCreateModel).toHaveBeenCalledWith(
      {
        async: true,
        parentId: 'cc_tab',
        subKey: 'grid',
        subType: 'object',
        use: 'CCBlockGridModel',
      },
      {
        skipSave: true,
      },
    );
    expect(tab.setSubModel).toHaveBeenCalledWith('grid', fallbackGrid);
  });

  it('enables block grid padding suppression in the CC config dialog', async () => {
    const existingGrid = createGrid('existing_grid', 'cc_tab', [{ uid: 'node_details', use: 'NodeDetailsModel' }]);
    const tab = createTab();
    tab.context.view = {
      inputArgs: {
        workflowCcConfigDialog: true,
      },
    };
    tab.subModels = {
      grid: existingGrid,
    };

    render(<>{tab.renderChildren()}</>);

    await screen.findByTestId('flow-model');
    const disablePaddingCall = existingGrid.context.defineProperty.mock.calls.find(
      ([name]) => name === 'disableBlockGridPadding',
    );
    expect(disablePaddingCall?.[1]).toEqual(
      expect.objectContaining({
        cache: false,
      }),
    );
    expect(disablePaddingCall?.[1].get()).toBe(true);
  });

  it('does not force block grid padding suppression outside the CC config dialog', async () => {
    const existingGrid = createGrid('existing_grid', 'cc_tab', [{ uid: 'node_details', use: 'NodeDetailsModel' }]);
    const tab = createTab();
    tab.subModels = {
      grid: existingGrid,
    };

    render(<>{tab.renderChildren()}</>);

    await screen.findByTestId('flow-model');
    expect(existingGrid.context.defineProperty).not.toHaveBeenCalledWith('disableBlockGridPadding', expect.anything());
  });
});
