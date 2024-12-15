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
        console.log('result', environmentKey, data);
        if (environmentKey) {
          const result = data?.data?.find((item) => item.name === environmentKey);
          console.log('result', result);
          if (!result) {
            setEnvironmentKey(data?.data?.[0]?.name);
          }
        } else {
          setEnvironmentKey(data?.data?.[0]?.name);
        }
      },
    },
  );
  // if (!data?.['data'].length) {
  //   return (
  //     <Card>
  //       <NewEnvironmentButton
  //         onSuccess={async (data) => {
  //           setEnvironmentKey(data.key);
  //           refresh();
  //         }}
  //       />
  //     </Card>
  //   );
  // }
  if (!environmentKey && data?.['data'].length) {
    return null;
  }
  if (loading) {
    return null;
  }
  return (
    <div>
      <Card style={{ minHeight: '80vh' }}>
        <Row gutter={24}>
          <Col flex="300px">
            <NewEnvironmentButton
              onSuccess={async (data) => {
                setEnvironmentKey(data.name);
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
              onDelete={(item) => {
                refresh();
              }}
            />
          </Col>
          <Col flex={'auto'}>
            <EnvironmentTabs items={data?.['data']} environmentKey={environmentKey} />
          </Col>
        </Row>
      </Card>
    </div>
  );
}
