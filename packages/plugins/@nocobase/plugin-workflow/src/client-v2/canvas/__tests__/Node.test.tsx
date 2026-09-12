/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeDefaultView } from '../Node';

const openNodeConfigDrawerMock = vi.hoisted(() => vi.fn());
const useInstructionMock = vi.hoisted(() => vi.fn());
const requestRemoveMock = vi.hoisted(() => vi.fn());

vi.mock('@nocobase/flow-engine', () => ({
  useFlowEngine: () => ({
    context: {
      api: {
        resource: () => ({
          update: vi.fn(),
        }),
      },
      t: (key: string) => key,
    },
  }),
}));

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('../style', () => ({
  default: () => ({
    cx: (...args: Array<Record<string, boolean> | string | undefined>) =>
      args
        .flatMap((item) => {
          if (!item) {
            return [];
          }
          if (typeof item === 'string') {
            return [item];
          }
          return Object.entries(item)
            .filter(([, enabled]) => enabled)
            .map(([className]) => className);
        })
        .join(' '),
    styles: {
      nodeCardClass: 'node-card',
      nodeClass: 'node',
      nodeHeaderClass: 'node-header',
      nodeMetaClass: 'node-meta',
    },
  }),
}));

vi.mock('../useWorkflowInstruction', () => ({
  useInstruction: useInstructionMock,
}));

vi.mock('../NodeClipboardContext', () => ({
  useNodeClipboardContext: () => null,
}));

vi.mock('../NodeDragContext', () => ({
  useNodeDragContext: () => null,
}));

vi.mock('../RemoveNodeContext', () => ({
  useRemoveNodeContext: () => ({
    requestRemove: requestRemoveMock,
  }),
}));

vi.mock('../NodeConfigDrawer', () => ({
  openNodeConfigDrawer: openNodeConfigDrawerMock,
}));

vi.mock('../JobButton', () => ({
  JobButton: () => null,
}));

describe('NodeDefaultView', () => {
  beforeEach(() => {
    openNodeConfigDrawerMock.mockClear();
    requestRemoveMock.mockClear();
    useInstructionMock.mockReturnValue({
      title: 'Approval',
    });
  });

  it('renders card extra content inside the node card after the title while keeping children outside', () => {
    const { container } = render(
      <NodeDefaultView
        data={{ id: 12, title: 'Approve', type: 'approval' }}
        cardExtra={<div data-testid="card-extra">Legacy warning</div>}
      >
        <div data-testid="node-children">Branch subtree</div>
      </NodeDefaultView>,
    );

    const nodeCard = container.querySelector('.node-card') as HTMLElement;
    const cardExtra = screen.getByTestId('card-extra');
    const children = screen.getByTestId('node-children');

    expect(nodeCard).toContainElement(cardExtra);
    expect(nodeCard).not.toContainElement(children);
    expect(nodeCard.lastElementChild).toBe(cardExtra);
  });

  it('renders unsupported node types as a normal card without opening the config drawer', () => {
    useInstructionMock.mockReturnValue(undefined);

    const { container } = render(<NodeDefaultView data={{ id: 13, title: 'Legacy node', type: 'legacy' }} />);

    const nodeCard = container.querySelector('.node-card') as HTMLElement;

    expect(screen.getByText('Unsupported node')).toBeInTheDocument();
    expect(container.querySelector('.workflow-node-action-button')).toBeInTheDocument();

    fireEvent.click(nodeCard);

    expect(openNodeConfigDrawerMock).not.toHaveBeenCalled();
  });
});
