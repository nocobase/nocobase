/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo, useEffect } from 'react';
import { useT } from '../../locale';
import { Row, Col, Card, Tabs, Button } from 'antd';
import { PlaySquareOutlined } from '@ant-design/icons';
import { QueryPanel } from './QueryPanel';
import { ChartOptionsPanel } from './ChartOptionsPanel';
import { ChartPreviewer } from './ChartPreviewer';
import { useFlowSettingsContext } from '@nocobase/flow-engine';
import { useForm } from '@formily/react';
import { useRequest } from '@nocobase/client';
import { configStore } from './config-store';
import { ChartBlockModel } from './ChartBlockModel';
import { ResultPanel } from './ResultPanel';
import { AxiosError } from 'axios';
import { EventsPanel } from './EventsPanel';

const RunButton: React.FC = memo(() => {
  const t = useT();
  const form = useForm();
  const ctx = useFlowSettingsContext();

  const { loading, run } = useRequest(
    () => {
      const sql = form.values.query.sql;
      if (!sql) {
        return;
      }
      return ctx.sql.run(sql);
    },
    {
      manual: true,
      onSuccess(result) {
        configStore.setResult(result);
      },
      onError(
        error: AxiosError<{
          errors: { message: string }[];
        }>,
      ) {
        const message = error?.response?.data?.errors?.map?.((error: any) => error.message).join('\n') || error.message;
        configStore.setError(message);
      },
    },
  );

  return (
    <Button type="link" loading={loading} icon={<PlaySquareOutlined />} onClick={run}>
      {t('Run query')}
    </Button>
  );
});

export const ConfigPanel: React.FC = () => {
  const t = useT();
  const ctx = useFlowSettingsContext<ChartBlockModel>();

  useEffect(() => {
    const error = ctx.model.resource.error;
    if (error && !configStore.error) {
      configStore.setError(error.message);
    } else if (!configStore.result) {
      configStore.setResult(ctx.model.resource.getData());
    }
    return () => {
      configStore.setResult(null);
    };
  }, [ctx.model.resource]);

  return (
    <Row gutter={8}>
      <Col span={6}>
        <Card
          style={{
            height: 'calc(100vh - 288px)',
            overflow: 'auto',
          }}
          styles={{
            body: {
              padding: '0 8px',
            },
          }}
        >
          <Tabs
            tabBarExtraContent={<RunButton />}
            items={[
              {
                label: t('Query'),
                key: 'query',
                children: <QueryPanel />,
              },
              {
                label: t('Result'),
                key: 'result',
                children: <ResultPanel />,
              },
            ]}
          />
        </Card>
      </Col>
      <Col span={7}>
        <Card
          style={{
            height: 'calc(100vh - 288px)',
            overflow: 'auto',
          }}
          styles={{
            body: {
              padding: '0 8px 10px',
            },
          }}
        >
          <Tabs
            items={[
              {
                label: t('Chart options'),
                key: 'chart',
                children: <ChartOptionsPanel />,
              },
              // {
              //   label: t('Transformation'),
              //   key: 'transformation',
              // },
              {
                label: t('Events'),
                key: 'events',
                children: <EventsPanel />,
              },
            ]}
          />
        </Card>
      </Col>
      <Col span={11}>
        <ChartPreviewer />
      </Col>
    </Row>
  );
};
