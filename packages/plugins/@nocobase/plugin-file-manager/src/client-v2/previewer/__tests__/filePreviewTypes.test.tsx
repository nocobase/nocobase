/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FilePreviewRenderer } from '../filePreviewTypes';

vi.mock('@emotion/css', () => ({ css: () => '' }));

vi.mock('antd', () => ({
  Alert: ({ description }: { description?: React.ReactNode }) => <div>{description}</div>,
  Image: () => null,
  Modal: ({ children, open, title }: React.PropsWithChildren<{ open?: boolean; title?: React.ReactNode }>) =>
    open ? (
      <div>
        <h1>{title}</h1>
        {children}
      </div>
    ) : null,
  Space: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  Spin: () => null,
}));

vi.mock('react-i18next', () => ({
  Trans: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('FilePreviewRenderer', () => {
  it('reloads the video element when switching files', () => {
    const files = [
      { filename: 'first.mp4', mimetype: 'video/mp4', url: '/files/first.mp4' },
      { filename: 'second.mp4', mimetype: 'video/mp4', url: '/files/second.mp4' },
    ];
    const commonProps = {
      list: files,
      open: true,
      onDownload: () => undefined,
    };

    const { container, rerender } = render(<FilePreviewRenderer {...commonProps} file={files[0]} index={0} />);
    const firstVideo = container.querySelector('video');

    expect(firstVideo?.querySelector('source')?.getAttribute('src')).toBe('/files/first.mp4');

    rerender(<FilePreviewRenderer {...commonProps} file={files[1]} index={1} />);

    const secondVideo = container.querySelector('video');
    expect(secondVideo?.querySelector('source')?.getAttribute('src')).toBe('/files/second.mp4');
    expect(secondVideo).not.toBe(firstVideo);
  });
});
