/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useLocalTranslation } from '../../../locale';
import { DotLoading, Button } from 'antd-mobile';
export default function ({
  hasMore,
  loadMoreStatus,
  retry,
}: {
  hasMore: boolean;
  loadMoreStatus: 'loading' | 'success' | 'failure';
  retry: () => any;
}) {
  const { t } = useLocalTranslation();
  if (loadMoreStatus === 'loading')
    return (
      <>
        <span>{t('Loading')}</span>
        <DotLoading />
      </>
    );
  else if (!hasMore) return <span>{t('No more')}</span>;
  else if (loadMoreStatus === 'failure')
    return (
      <>
        <span>{t('Loading failed,')}</span>
        <span style={{ marginLeft: '5px', color: 'var(--adm-color-primary)', cursor: 'pointer' }} onClick={retry}>
          {t('please reload')}
        </span>
      </>
    );
  else return null;
}
