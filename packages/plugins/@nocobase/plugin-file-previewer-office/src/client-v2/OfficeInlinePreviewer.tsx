/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import type { FilePreviewerProps } from '@nocobase/plugin-file-manager/client-v2';
import { getOfficePreviewUrl } from './utils';

export const OfficeInlinePreviewer: React.FC<FilePreviewerProps> = ({ file }) => {
  const fileUrl: string | undefined = typeof file === 'string' ? file : file?.url;
  const url = useMemo(() => getOfficePreviewUrl(fileUrl), [fileUrl]);
  if (!url) {
    return null;
  }
  return <iframe src={url} width="100%" height="100%" style={{ border: 'none' }} />;
};

export default OfficeInlinePreviewer;
