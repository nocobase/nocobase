/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DisplayVditorFieldModel } from '../models/DisplayVditorFieldModel';
import { VditorFieldModel } from '../models/VditorFieldModel';

vi.mock('@nocobase/client-v2', () => {
  class FieldModel {
    static define = vi.fn();
    static registerFlow = vi.fn();
  }
  class DisplayTitleFieldModel extends FieldModel {}
  return {
    FieldModel,
    DisplayTitleFieldModel,
  };
});

vi.mock('@nocobase/flow-engine', () => {
  const identityDecorator = () => (target: unknown) => target;
  return {
    largeField: identityDecorator,
    EditableItemModel: {
      bindModelToInterface: vi.fn(),
    },
    DisplayItemModel: {
      bindModelToInterface: vi.fn(),
    },
  };
});

vi.mock('../locale', () => ({
  tExpr: (value: string) => value,
}));

describe('VditorFieldModel', () => {
  it('renders with the markdown vditor runtime and keeps context selection disabled', () => {
    const edit = vi.fn(() => <span>editor</span>);
    const model = Object.create(VditorFieldModel.prototype) as VditorFieldModel & {
      props: Record<string, unknown>;
      context: Record<string, unknown>;
    };
    model.props = {
      value: 'draft',
      editMode: 'wysiwyg',
      mode: 'sv',
    };
    model.context = {
      markdownVditor: {
        edit,
      },
    };

    render(model.render());

    expect(screen.getByText('editor')).toBeInTheDocument();
    expect(edit).toHaveBeenCalledWith({
      value: 'draft',
      editMode: 'wysiwyg',
      mode: 'wysiwyg',
      enableContextSelect: false,
    });
  });

  it('falls back to the generic markdown runtime and configures edit mode flow', () => {
    const edit = vi.fn(() => <span>fallback editor</span>);
    const model = Object.create(VditorFieldModel.prototype) as VditorFieldModel & {
      props: Record<string, unknown>;
      context: Record<string, unknown>;
    };
    model.props = {
      value: 'draft',
      mode: 'sv',
    };
    model.context = {
      markdown: {
        edit,
      },
    };

    render(model.render());

    expect(edit).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'sv',
        enableContextSelect: false,
      }),
    );

    const flow = (VditorFieldModel as unknown as { registerFlow: ReturnType<typeof vi.fn> }).registerFlow.mock.calls
      .map(([config]) => config)
      .find((config) => config.key === 'markdownVditorEditSettings');
    const setProps = vi.fn();
    expect(flow.steps.editMode.defaultParams({ model: { props: {} } })).toEqual({ editMode: 'ir' });
    expect(flow.steps.editMode.defaultParams({ model: { props: { mode: 'wysiwyg' } } })).toEqual({
      editMode: 'wysiwyg',
    });

    flow.steps.editMode.handler({ model: { setProps } }, { editMode: 'sv' });
    expect(setProps).toHaveBeenCalledWith({
      editMode: 'sv',
      mode: 'sv',
    });
  });
});

describe('DisplayVditorFieldModel', () => {
  it('renders nothing for empty values', () => {
    const model = Object.create(DisplayVditorFieldModel.prototype) as DisplayVditorFieldModel;

    expect(model.renderComponent('')).toBeNull();
  });

  it('renders translated markdown through the display runtime', async () => {
    const markdownRender = vi.fn((value: string, props: Record<string, unknown>) => (
      <span data-testid="rendered" data-text-only={props.textOnly ? 'yes' : 'no'}>
        {value}
      </span>
    ));
    const model = Object.create(DisplayVditorFieldModel.prototype) as DisplayVditorFieldModel & {
      props: Record<string, unknown>;
      context: Record<string, unknown>;
    };
    model.props = {
      textOnly: true,
      overflowMode: 'ellipsis',
    };
    model.context = {
      markdownVditor: {
        render: markdownRender,
      },
      liquid: {},
      t: (value: string) => `translated:${value}`,
    };

    render(model.renderComponent('**hello**'));

    await waitFor(() => expect(screen.getByTestId('rendered')).toHaveTextContent('translated:**hello**'));
    expect(screen.getByTestId('rendered')).toHaveAttribute('data-text-only', 'yes');
    expect(markdownRender).toHaveBeenCalledWith('translated:**hello**', {
      ellipsis: true,
      textOnly: true,
    });
  });

  it('falls back to markdown runtime and shows render errors', async () => {
    const model = Object.create(DisplayVditorFieldModel.prototype) as DisplayVditorFieldModel & {
      props: Record<string, unknown>;
      context: Record<string, unknown>;
    };
    model.props = {};
    model.context = {
      markdown: {
        render: vi.fn(() => {
          throw new Error('broken markdown');
        }),
      },
      liquid: {},
      t: (value: string) => value,
    };

    render(model.renderComponent('broken'));

    await waitFor(() => expect(screen.getByText(/渲染错误: broken markdown/)).toBeInTheDocument());
  });
});
