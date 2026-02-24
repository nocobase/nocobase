/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import React from 'react';
import { Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { useRecord } from '@nocobase/client';
import { NAMESPACE } from '../../locale';

export const UnSupportFields = ({dataSource}) => {
  const { t } = useTranslation();
  const columns = [
    {
      title: t('Field name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('Field database type', { ns: NAMESPACE }),
      dataIndex: 'rawType',
      key: 'rawType',
    },
  ];
  return (
    dataSource?.length > 0 && (
      <>
        <Divider plain orientation="left" orientationMargin="0">
          <h3>{t('Unknown field type', { ns: NAMESPACE })}</h3>
        </Divider>
        <div style={{ marginBottom: '15px' }}>
          {t('The following field types are not compatible and do not support output and display', { ns: NAMESPACE })}
        </div>
        <Table columns={columns} dataSource={dataSource} pagination={false} />
      </>
    )
  );
};
