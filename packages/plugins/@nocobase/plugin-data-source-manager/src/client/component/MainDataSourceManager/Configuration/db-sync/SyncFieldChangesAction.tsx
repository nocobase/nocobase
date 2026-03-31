/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient, useCollectionRecordData, useDataSource, useResourceActionContext } from '@nocobase/client';
import React from 'react';
import { SyncOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';
import { useDSMTranslation } from '../../../../locale';

export const SyncFieldChangesAction: React.FC = () => {
  const { t } = useDSMTranslation();
  const api = useAPIClient();
  const record = useCollectionRecordData();
  const ds = useDataSource();
  const { refresh } = useResourceActionContext();

  if (record.from === 'db2cm' || record.template === 'view' || record.template === 'sql') {
    return null;
  }
  return (
    <Button
      icon={<SyncOutlined />}
      onClick={async () => {
        await api.resource('mainDataSource').syncFields({
          values: {
            collections: [record.name],
          },
        });
        refresh();
        ds.reload();
        message.success(t('Sync successfully'));
      }}
    >
      {t('Sync from database')}
    </Button>
  );
};
