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
  Modal: ({ children, open, title }: React.PropsWithChildren<{ open?: boolean; title?: React.ReactNode }>) => (
    <div hidden={!open}>
      <h1>{title}</h1>
      {children}
    </div>
  ),
  Space: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  Spin: () => null,
}));

vi.mock('react-i18next', () => ({
  Trans: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('FilePreviewRenderer', () => {
  it.each([
    { tag: 'video', extension: 'mp4', mimetype: 'video/mp4' },
    { tag: 'audio', extension: 'mp3', mimetype: 'audio/mpeg' },
  ])('reloads the $tag element when switching files', ({ tag, extension, mimetype }) => {
    const files = [
      { filename: `first.${extension}`, mimetype, url: `/files/first.${extension}` },
      { filename: `second.${extension}`, mimetype, url: `/files/second.${extension}` },
    ];
    const commonProps = {
      list: files,
      open: true,
      onDownload: () => undefined,
    };

    const { container, rerender } = render(<FilePreviewRenderer {...commonProps} file={files[0]} index={0} />);
    const firstMedia = container.querySelector(tag);

    expect(firstMedia?.querySelector('source')?.getAttribute('src')).toBe(files[0].url);

    rerender(<FilePreviewRenderer {...commonProps} file={files[1]} index={1} />);

    const secondMedia = container.querySelector(tag);
    expect(secondMedia?.querySelector('source')?.getAttribute('src')).toBe(files[1].url);
    expect(secondMedia).not.toBe(firstMedia);

    rerender(<FilePreviewRenderer {...commonProps} file={files[0]} index={0} />);

    const previousMedia = container.querySelector(tag);
    expect(previousMedia?.querySelector('source')?.getAttribute('src')).toBe(files[0].url);
    expect(previousMedia).not.toBe(secondMedia);
  });

  it('reloads the audio element when opening another file after closing the preview', () => {
    const files = [
      { filename: 'first.mp3', mimetype: 'audio/mpeg', url: '/files/first.mp3' },
      { filename: 'second.mp3', mimetype: 'audio/mpeg', url: '/files/second.mp3' },
    ];
    const commonProps = {
      list: files,
      onDownload: () => undefined,
    };

    const { container, rerender } = render(<FilePreviewRenderer {...commonProps} file={files[0]} index={0} open />);
    const firstAudio = container.querySelector('audio');
    expect(firstAudio?.querySelector('source')?.getAttribute('src')).toBe(files[0].url);

    rerender(<FilePreviewRenderer {...commonProps} file={files[0]} index={0} open={false} />);
    expect(container.querySelector('audio')).toBe(firstAudio);

    rerender(<FilePreviewRenderer {...commonProps} file={files[1]} index={1} open />);

    const secondAudio = container.querySelector('audio');
    expect(secondAudio?.querySelector('source')?.getAttribute('src')).toBe(files[1].url);
    expect(secondAudio).not.toBe(firstAudio);
  });
});
