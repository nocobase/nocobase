/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DisplayPreviewFieldModel } from '../models/DisplayPreviewFieldModel';

const previewModelMocks = vi.hoisted(() => ({
  bindModelToInterface: vi.fn(),
  define: vi.fn(),
  DetailsItemModel: class DetailsItemModel {},
  registerFlow: vi.fn(),
  TableColumnModel: class TableColumnModel {},
}));

vi.mock('@nocobase/client-v2', () => ({
  DetailsItemModel: previewModelMocks.DetailsItemModel,
  FieldModel: class FieldModel {
    props: Record<string, unknown> = {};
    static define = previewModelMocks.define;
    static registerFlow = previewModelMocks.registerFlow;
  },
  TableColumnModel: previewModelMocks.TableColumnModel,
}));

vi.mock('@nocobase/flow-engine', () => ({
  DisplayItemModel: {
    bindModelToInterface: previewModelMocks.bindModelToInterface,
  },
  tExpr: (value: string) => value,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (value: string) => value,
  }),
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    Image: ({ src, width, height }: { src: string; width: number; height: number }) => (
      <img alt="preview" src={src} width={width} height={height} />
    ),
    message: {
      error: vi.fn(),
    },
  };
});

vi.mock('../previewer/filePreviewTypes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../previewer/filePreviewTypes')>();
  return {
    ...actual,
    FilePreviewRenderer: ({
      file,
      onDownload,
      open,
    }: {
      file: { filename?: string; url?: string };
      onDownload?: (file?: { filename?: string; url?: string }) => void;
      open?: boolean;
    }) =>
      open ? (
        <div role="dialog">
          {file.filename || file.url}
          <button type="button" onClick={() => onDownload?.(file)}>
            download file
          </button>
        </div>
      ) : null,
  };
});

function createModel(props: Record<string, unknown>) {
  const model = new DisplayPreviewFieldModel();
  model.props = props;
  return model;
}

describe('DisplayPreviewFieldModel', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders file previews and opens the preview renderer from thumbnails', async () => {
    const model = createModel({
      value: [{ filename: 'avatar.png', mimetype: 'image/png', url: '/avatar.png' }],
      size: 40,
      showFileName: true,
    });

    render(model.render());

    expect(screen.getByText('avatar.png')).toBeInTheDocument();
    fireEvent.click(screen.getByText('avatar.png'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveTextContent('avatar.png');
    });
  });

  it('downloads preview files and reports failed downloads', async () => {
    const click = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:download'),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = document.createElementNS('http://www.w3.org/1999/xhtml', tagName) as HTMLElement & {
        click?: () => void;
        download?: string;
        href?: string;
      };
      if (tagName === 'a') {
        element.click = click;
      }
      return element;
    });
    const fetchMock = vi.fn().mockResolvedValue({
      blob: async () => new Blob(['content']),
      ok: true,
    });
    vi.stubGlobal('fetch', fetchMock);
    const model = createModel({
      value: [{ filename: 'avatar.png', mimetype: 'image/png', url: '/avatar.png' }],
      showFileName: true,
    });

    render(model.render());
    fireEvent.click(screen.getByText('avatar.png'));
    fireEvent.click(await screen.findByText('download file'));

    await waitFor(() => {
      expect(click).toHaveBeenCalled();
    });
    expect(fetchMock).toHaveBeenCalledWith('/avatar.png');
  });

  it('renders nested titleField previews with separators and N/A placeholders', () => {
    const model = createModel({
      titleField: 'files',
      template: 'users',
      target: 'users',
      value: [{ files: [{ filename: 'first.png', mimetype: 'image/png', url: '/first.png' }] }, { files: null }],
    });

    render(<>{model.render()}</>);

    expect(screen.getByAltText('preview')).toHaveAttribute('src', '/first.png');
    expect(screen.getByText('N/A')).toBeInTheDocument();
    expect(document.body).toHaveTextContent(', ');
  });

  it('registers preview setting handlers and model bindings', () => {
    const flow = previewModelMocks.registerFlow.mock.calls[0][0];
    const setProps = vi.fn();
    const tableColumnParent = new previewModelMocks.TableColumnModel();
    const detailsParent = new previewModelMocks.DetailsItemModel();

    expect(flow.steps.size.hideInSettings({ model: { parent: tableColumnParent } })).toBe(true);
    expect(flow.steps.size.defaultParams({ model: { parent: detailsParent } })).toEqual({ size: 100 });
    flow.steps.size.handler({ model: { setProps } }, { size: 300 });
    expect(setProps).toHaveBeenCalledWith('size', 300);

    flow.steps.showFileName.handler({ model: { setProps } }, { showFileName: true });
    expect(setProps).toHaveBeenCalledWith('showFileName', true);
    expect(previewModelMocks.define).toHaveBeenCalledWith({ label: 'Preview' });
    expect(previewModelMocks.bindModelToInterface).toHaveBeenCalledWith(
      'DisplayPreviewFieldModel',
      expect.arrayContaining(['url', 'attachment', 'm2m']),
      expect.objectContaining({
        isDefault: true,
        when: expect.any(Function),
      }),
    );
  });
});
