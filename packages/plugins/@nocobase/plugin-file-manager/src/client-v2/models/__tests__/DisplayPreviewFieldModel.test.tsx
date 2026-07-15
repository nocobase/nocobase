/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { FilePreview, getFileCollectionReference } from '../DisplayPreviewFieldModel';

describe('FilePreview', () => {
  it('keeps the current data source for Attachment URL file collections', () => {
    expect(
      getFileCollectionReference(
        { interface: 'attachmentURL', target: 'remoteFiles' },
        { dataSourceKey: 'external', name: 'posts' },
      ),
    ).toEqual({
      dataSourceKey: 'external',
      collectionName: 'remoteFiles',
    });
  });

  it('keeps a failed image as a native broken image instead of replacing it with a file icon', () => {
    const { container } = render(
      <FilePreview
        file={{
          filename: 'missing.png',
          mimetype: 'image/png',
          preview: '/nocobase/files/main/main/attachments/1.png?preview=1',
          url: '/nocobase/files/main/main/attachments/1',
        }}
        size={100}
        showFileName={false}
      />,
    );

    const image = container.querySelector('img');
    expect(image).not.toBeNull();
    expect(container.querySelector('.ant-image')).toBeNull();
    expect(image?.getAttribute('src')).toBe('/nocobase/files/main/main/attachments/1.png?preview=1');

    fireEvent.error(image as HTMLImageElement);

    expect(image?.getAttribute('src')).toBe('/nocobase/files/main/main/attachments/1.png?preview=1');
  });

  it('continues to use the file type icon for non-image files', () => {
    const { container } = render(
      <FilePreview
        file={{
          filename: 'report.pdf',
          mimetype: 'application/pdf',
          url: '/nocobase/files/main/main/attachments/2',
        }}
        size={100}
        showFileName={false}
      />,
    );

    expect(container.querySelector('.ant-image')).not.toBeNull();
    expect(container.querySelector('img')?.getAttribute('src')).toContain('/file-placeholder/pdf-200-200.png');
  });
});
