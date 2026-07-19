/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { act, cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AttachmentURLFieldModel } from '../AttachmentURLFieldModel';

type UploadFileLike = {
  name?: string;
  status?: string;
  url?: string;
  response?: {
    url?: string;
  };
};

type UploadProps = {
  children?: React.ReactNode;
  fileList?: UploadFileLike[];
  itemRender?: (originNode: React.ReactNode, file: UploadFileLike) => React.ReactNode;
  listType?: string;
  onChange?: (fileList: UploadFileLike[]) => void;
};

const formilyMocks = vi.hoisted(() => ({
  outerField: {
    value: 'outer-value',
  },
  uploadProps: [] as UploadProps[],
}));

vi.mock('@formily/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@formily/react')>();
  return {
    ...actual,
    useField: () => formilyMocks.outerField,
  };
});

vi.mock('@formily/antd-v5', async () => {
  const ReactModule = await import('react');
  return {
    Upload: (props: UploadProps) => {
      formilyMocks.uploadProps.push(props);
      return ReactModule.createElement(
        'div',
        { 'data-testid': 'attachment-url-upload', 'data-list-type': props.listType },
        props.fileList?.map((file, index) =>
          ReactModule.createElement(
            'div',
            { key: `${file.url || file.name || index}`, 'data-testid': `upload-item-${index}` },
            props.itemRender?.(ReactModule.createElement('span', null, 'origin'), file),
          ),
        ),
        props.children,
      );
    },
  };
});

function createModel(props: Record<string, unknown> = {}) {
  const engine = new FlowEngine();
  engine.registerModels({ AttachmentURLFieldModel });
  return engine.createModel<AttachmentURLFieldModel>({
    use: 'AttachmentURLFieldModel',
    uid: 'attachment-url-field',
    props,
  });
}

function latestUploadProps() {
  const props = formilyMocks.uploadProps.at(-1);
  expect(props).toBeDefined();
  return props as UploadProps;
}

describe('AttachmentURLFieldModel', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    formilyMocks.uploadProps = [];
  });

  it('renders attachment URLs as upload files and shows decoded file names', () => {
    const model = createModel({
      showFileName: true,
      value: ['https://example.com/files/report%202026.pdf'],
    });

    render(model.render());

    expect(screen.getByTestId('attachment-url-upload')).toHaveAttribute('data-list-type', 'picture-card');
    expect(latestUploadProps().fileList).toEqual([{ url: 'https://example.com/files/report%202026.pdf' }]);
    expect(screen.getByText('report 2026.pdf')).toBeTruthy();
  });

  it('syncs file list when the field value changes', () => {
    const model = createModel({
      value: 'https://example.com/old.png',
    });
    const { rerender } = render(model.render());

    expect(latestUploadProps().fileList).toEqual([{ url: 'https://example.com/old.png' }]);

    act(() => {
      model.setProps('value', 'https://example.com/new.png');
      rerender(model.render());
    });

    expect(latestUploadProps().fileList).toEqual([{ url: 'https://example.com/new.png' }]);
  });

  it('emits uploaded and cleared attachment URLs', () => {
    const onChange = vi.fn();
    const model = createModel({
      onChange,
      value: [],
    });
    render(model.render());

    act(() => {
      latestUploadProps().onChange?.([
        {
          status: 'done',
          response: {
            url: 'https://example.com/uploaded.png',
          },
        },
      ]);
    });
    expect(onChange).toHaveBeenLastCalledWith('https://example.com/uploaded.png');

    act(() => {
      latestUploadProps().onChange?.([
        {
          status: 'done',
          url: 'https://example.com/existing.png',
        },
      ]);
    });
    expect(onChange).toHaveBeenLastCalledWith('https://example.com/existing.png');

    act(() => {
      latestUploadProps().onChange?.([{ status: 'removed', url: 'https://example.com/existing.png' }]);
    });
    expect(onChange).toHaveBeenLastCalledWith(undefined);

    act(() => {
      latestUploadProps().onChange?.([]);
    });
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });
});
