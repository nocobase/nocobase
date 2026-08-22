/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UploadActionModel, validate } from '../models/UploadActionModel';

const actionModelMocks = vi.hoisted(() => ({
  define: vi.fn(),
  registerFlow: vi.fn(),
}));

vi.mock('@nocobase/client-v2', () => ({
  ActionModel: class ActionModel {
    props: Record<string, unknown> = {};
    static define = actionModelMocks.define;
    static registerFlow = actionModelMocks.registerFlow;
    dispatchEvent = vi.fn();
    setProps(nextProps: Record<string, unknown>) {
      this.props = { ...this.props, ...nextProps };
    }
    onInit() {}
  },
  ActionSceneEnum: {
    collection: 'collection',
  },
  Icon: ({ type }: { type: string }) => <span data-testid="icon">{type}</span>,
}));

vi.mock('@nocobase/flow-engine', () => ({
  escapeT: (value: string) => value,
  useFlowContext: () => ({
    api: { axios: { post: vi.fn() } },
    t: (value: string) => value,
    view: {
      Header: ({ title }: { title: string }) => <h1>{title}</h1>,
      close: vi.fn(),
    },
  }),
}));

describe('UploadActionModel', () => {
  afterEach(() => {
    cleanup();
  });

  it('validates upload rules for size and mimetype', () => {
    const imageFile = { size: 100, type: 'image/png' };

    expect(validate(imageFile, undefined)).toBeNull();
    expect(validate(imageFile, {})).toBeNull();
    expect(validate(imageFile, { size: 0 })).toBeNull();
    expect(validate(imageFile, { size: 50 })).toBe('File size exceeds the limit');
    expect(validate(imageFile, { mimetype: 'image/*, application/pdf' })).toBeNull();
    expect(validate(imageFile, { mimetype: 'application/pdf' })).toBe('File type is not allowed');
  });

  it('renders upload button with icon and dispatches openView on click', () => {
    const model = new UploadActionModel();
    model.props = {
      title: 'Upload file',
      icon: 'UploadOutlined',
      onUploadClick: vi.fn(),
    };

    render(model.render());

    expect(screen.getByTestId('icon')).toHaveTextContent('UploadOutlined');
    fireEvent.click(screen.getByRole('button', { name: /Upload file/ }));

    expect(model.props.onUploadClick).toHaveBeenCalled();
  });

  it('binds click handlers during initialization and exposes ACL action', () => {
    const model = new UploadActionModel();
    model.onInit({});

    expect(model.getAclActionName()).toBe('create');
    expect(model.props.onUploadClick).toEqual(expect.any(Function));

    model.props.onUploadClick('event');
    expect(model.dispatchEvent).toHaveBeenCalledWith('openView', { event: 'event' });
  });

  it('registers collection visibility and open-view flow behavior', () => {
    const definition = actionModelMocks.define.mock.calls[0][0];
    expect(definition.hide({ collection: { template: 'file' } })).toBe(false);
    expect(definition.hide({ collection: { template: 'users' } })).toBe(true);

    const flow = actionModelMocks.registerFlow.mock.calls[0][0];
    const open = vi.fn();
    const contentElement = document.createElement('div');

    flow.steps.openView.handler(
      {
        inputArgs: { mode: 'dialog', size: 'large' },
        layoutContentElement: contentElement,
        model: {
          flowEngine: {
            context: {
              themeToken: {
                colorBgLayout: '#f7f7f7',
              },
            },
          },
        },
        resource: {
          getSourceId: () => 9,
        },
        viewer: { open },
      },
      { mode: 'drawer', size: 'small' },
    );

    expect(open).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dialog',
        width: '80%',
        target: contentElement,
        inputArgs: { sourceId: 9 },
        content: expect.any(Function),
      }),
    );
  });
});
