/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Alert } from 'antd';
import type { FilePreviewerProps } from '@nocobase/plugin-file-manager/client-v2';
import { getPreviewState, getCachedConfig, type OfficePreviewFile } from './utils';
import { useT } from './locale';

export const OfficeInlinePreviewer: React.FC<FilePreviewerProps> = ({ file }) => {
  const t = useT();
  const config = getCachedConfig();

  const { url, warnings, iframeError } = React.useMemo(
    () => getPreviewState(file as OfficePreviewFile, config),
    [file, config],
  );

  if (!url) {
    if (warnings.length > 0 || iframeError) {
      return (
        <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
          {warnings.map((w, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <Alert
                message={t(w.messageKey)}
                description={w.descriptionKey ? t(w.descriptionKey) : undefined}
                type={w.type}
                showIcon
              />
            </div>
          ))}
          {iframeError && <Alert message={t('Preview failed')} type="error" showIcon />}
        </div>
      );
    }
    return null;
  }

  return <iframe src={url} width="100%" height="100%" style={{ border: 'none' }} />;
};

export default OfficeInlinePreviewer;
