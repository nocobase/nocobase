/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest } from '@nocobase/client';

export interface FilePreviewerConfig {
  id?: string;
  previewType: 'microsoft' | 'kkfileview' | 'basemetas';
  kkFileViewUrl?: string;
  kkFileViewExtensions?: string; // Deprecated, use customExtensions instead
  customExtensions?: string;
  basemetasUrl?: string;
}

export const useFilePreviewerConfig = () => {
  const { data, loading, refresh } = useRequest<any>(
    {
      resource: 'filePreviewer',
      action: 'list',
    },
    {
      cacheTime: 300000, // 5 minutes cache
      staleTime: 60000,
    },
  ) as any;

  const config: FilePreviewerConfig = data?.data?.[0] || {
    previewType: 'microsoft',
    kkFileViewUrl: 'http://localhost:8012',
    basemetasUrl: 'http://localhost:9000',
  };

  return { config, loading, refresh };
};
