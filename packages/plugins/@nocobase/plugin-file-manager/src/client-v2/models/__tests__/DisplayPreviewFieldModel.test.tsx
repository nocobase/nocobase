/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Preview } from '../DisplayPreviewFieldModel';

vi.mock('@emotion/css', () => ({ css: () => '' }));

vi.mock('@nocobase/client-v2', () => {
  class FieldModel {
    static registerFlow() {}
    static define() {}
  }

  return {
    DetailsItemModel: class {},
    FieldModel,
    TableColumnModel: class {},
  };
});

vi.mock('@nocobase/flow-engine', () => ({
  DisplayItemModel: { bindModelToInterface: vi.fn() },
  tExpr: (value: string) => value,
}));

vi.mock('antd', () => ({
  Image: () => <img alt="file thumbnail" />,
  Space: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  Tooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
  message: { error: vi.fn() },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../previewer/filePreviewTypes', () => ({
  FilePreviewRenderer: ({
    file,
    onDownload,
  }: {
    file: { url: string };
    onDownload: (file: { url: string }) => void;
  }) => <button onClick={() => onDownload(file)}>Download</button>,
  getDownloadFileName: () => 'image.jpg',
  getFallbackIcon: () => 'fallback.png',
  getFileName: () => 'image.jpg',
  getPreviewFileUrl: (file: { url?: string }) => file.url || '',
  getPreviewThumbnailUrl: () => 'thumbnail.png',
  normalizePreviewFile: (file: { url: string }) => file,
}));

describe('DisplayPreviewFieldModel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('reloads the file when downloading to avoid reusing a non-CORS image cache entry', async () => {
    const blob = new Blob(['image'], { type: 'image/jpeg' });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(blob),
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn().mockReturnValue('blob:image'),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    const url = 'https://oss.example.com/image.jpg?signature=test';
    render(<Preview value={[{ url }]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(url, { cache: 'reload' });
    });
  });
});
