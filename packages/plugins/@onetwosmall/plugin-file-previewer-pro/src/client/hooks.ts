/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest } from '@nocobase/client';
import { type FilePreviewerConfig, getCachedConfig, setCachedConfig } from '../client-v2/utils';

export type { FilePreviewerConfig };
export { getCachedConfig, setCachedConfig };

const DEFAULT_CONFIG: FilePreviewerConfig = {
  previewType: 'microsoft',
  kkFileViewUrl: 'http://localhost:8012',
  basemetasUrl: 'http://localhost:9000',
};

interface FilePreviewerApiResponse {
  data: Array<FilePreviewerConfig>;
}

export const useFilePreviewerConfig = () => {
  const { data, loading, refresh } = useRequest<FilePreviewerApiResponse>(
    {
      resource: 'filePreviewer',
      action: 'list',
      skipNotify: true,
    },
    {
      cacheTime: 300000,
      staleTime: 60000,
    },
  );

  const config: FilePreviewerConfig = data?.data?.[0] || DEFAULT_CONFIG;

  if (data?.data?.[0]) {
    setCachedConfig(data.data[0]);
  }

  return { config, loading, refresh };
};
