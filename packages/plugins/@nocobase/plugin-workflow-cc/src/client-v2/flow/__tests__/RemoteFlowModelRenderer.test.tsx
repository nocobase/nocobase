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

type RenderableModel = {
  context: {
    addDelegate: ReturnType<typeof vi.fn>;
    defineProperty: ReturnType<typeof vi.fn>;
  };
  uid: string;
};

const holder = vi.hoisted(() => {
  const loadModel = vi.fn();
  return {
    flowEngine: {
      loadModel,
    },
    flowModelRendererProps: [] as Array<{
      hideRemoveInSettings?: unknown;
      model: RenderableModel | null;
      showFlowSettings?: unknown;
    }>,
    loadModel,
    viewContext: {
      name: 'task-center-view',
    },
  };
});

vi.mock('@nocobase/client-v2', () => ({
  SkeletonFallback: () => <div data-testid="remote-flow-model-loading" />,
}));

vi.mock('@nocobase/flow-engine', () => ({
  FlowModelRenderer: (props: {
    hideRemoveInSettings?: boolean;
    model: RenderableModel | null;
    showFlowSettings?: boolean;
  }) => {
    holder.flowModelRendererProps.push(props);
    if (!props.model) {
      return <div>deleted placeholder</div>;
    }
    return <div data-testid="remote-flow-model">{props.model.uid}</div>;
  },
  useFlowEngine: () => holder.flowEngine,
  useFlowViewContext: () => holder.viewContext,
}));

import { RemoteFlowModelRenderer } from '../RemoteFlowModelRenderer';

function createModel(uid: string): RenderableModel {
  return {
    uid,
    context: {
      addDelegate: vi.fn(),
      defineProperty: vi.fn(),
    },
  };
}

afterEach(() => {
  vi.clearAllMocks();
  holder.flowModelRendererProps = [];
});

describe('RemoteFlowModelRenderer', () => {
  it('renders the loaded task-card FlowModel instead of a deleted placeholder', async () => {
    const sourceModel = createModel('task_card_source');
    const clonedModel = createModel('task_card_clone');
    const onModelLoaded = vi.fn();
    holder.loadModel.mockResolvedValue(sourceModel);

    render(
      <RemoteFlowModelRenderer
        uid="task_card_uid"
        mapModel={() => clonedModel}
        onModelLoaded={onModelLoaded}
        reloadKey="node-updated-at"
      />,
    );

    expect(await screen.findByTestId('remote-flow-model')).toHaveTextContent('task_card_clone');
    expect(screen.queryByText('deleted placeholder')).not.toBeInTheDocument();
    expect(holder.loadModel).toHaveBeenCalledWith({ uid: 'task_card_uid' });
    expect(clonedModel.context.addDelegate).toHaveBeenCalledWith(holder.viewContext);
    expect(clonedModel.context.defineProperty).toHaveBeenCalledWith('flowSettingsEnabled', { value: false });
    expect(onModelLoaded).toHaveBeenCalledWith(clonedModel);
    expect(holder.flowModelRendererProps.at(-1)).toEqual(
      expect.objectContaining({
        hideRemoveInSettings: true,
        model: clonedModel,
        showFlowSettings: false,
      }),
    );
  });

  it('updates flow settings state on the loaded remote model without reloading it', async () => {
    const model = createModel('task_card_model');
    holder.loadModel.mockResolvedValue(model);

    const { rerender } = render(<RemoteFlowModelRenderer uid="task_card_uid" enableUIConfiguration={false} />);

    await screen.findByTestId('remote-flow-model');
    rerender(<RemoteFlowModelRenderer uid="task_card_uid" enableUIConfiguration />);

    expect(holder.loadModel).toHaveBeenCalledTimes(1);
    expect(model.context.defineProperty).toHaveBeenLastCalledWith('flowSettingsEnabled', { value: true });
  });
});
