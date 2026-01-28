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
  previewType: 'microsoft' | 'kkfileview';
  kkFileViewUrl?: string;
  kkFileViewExtensions?: string;
}

export const useFilePreviewerConfig = () => {
  const { data, loading } = useRequest<{ data: Array<FilePreviewerConfig> }>(
    {
      resource: 'filePreviewer',
      action: 'list',
    },
    {
      cacheTime: 60000, // 缓存 1 分钟
    },
  );

  const config: FilePreviewerConfig = data?.data?.[0] || {
    previewType: 'microsoft',
    kkFileViewUrl: 'http://localhost:8012',
  };

  return { config, loading };
};
