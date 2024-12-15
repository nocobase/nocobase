/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest } from '@nocobase/client';
import { Card, Col, Divider, Row } from 'antd';
import React, { useState } from 'react';
import { EnvironmentList } from './EnvironmentList';
import { EnvironmentTabs } from './EnvironmentTabs';
import { NewEnvironmentButton } from './NewEnvironmentButton';

export function EnvironmentsPage() {
  const [environmentKey, setEnvironmentKey] = useState(null);
  const { data, loading, refresh } = useRequest(
    {
      url: 'environments',
    },
    {
      onSuccess(data) {
        if (!environmentKey) {
          setEnvironmentKey(data?.data?.[0]?.name);
        }
      },
    },
  );
  if (!environmentKey) {
    return null;
  }
  if (loading) {
    return null;
  }
  return (
    <div>
      {environmentKey}
      <Card style={{ minHeight: '80vh' }}>
        <Row gutter={24}>
          <Col flex="300px">
            <NewEnvironmentButton
              onSuccess={async (data) => {
                setEnvironmentKey(data.key);
                refresh();
              }}
            />
            <Divider style={{ margin: '0 0 12px' }} />
            <EnvironmentList
              items={data?.['data']}
              activeKey={environmentKey}
              onSelect={(info) => {
                setEnvironmentKey(info.key);
                console.log(info.key);
              }}
              onDelete={() => {
                refresh();
              }}
            />
          </Col>
          <Col flex={'auto'}>
            <EnvironmentTabs environmentKey={environmentKey} />
          </Col>
        </Row>
      </Card>
    </div>
  );
}
