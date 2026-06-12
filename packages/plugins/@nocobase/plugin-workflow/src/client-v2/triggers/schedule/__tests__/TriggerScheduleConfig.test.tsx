/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Form } from 'antd';
import TriggerScheduleConfig from '../TriggerScheduleConfig';
import { SCHEDULE_MODE } from '../constants';

const remoteSelectState = vi.hoisted(() => ({
  props: null as null | {
    request: () => Promise<any[]>;
    mapOptions: (item: any, index: number) => { label: React.ReactNode; value: any };
  },
}));

vi.mock('@nocobase/client-v2', () => ({
  RemoteSelect: (props: any) => {
    remoteSelectState.props = props;
    return <div data-testid="remote-select" />;
  },
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    dataSourceManager: {
      getDataSource: () => ({
        collectionManager: {
          getCollection: () => ({
            filterTargetKey: 'name',
            titleCollectionField: { name: 'title' },
          }),
        },
      }),
    },
    api: {
      resource: () => ({
        list: async () => ({
          data: {
            data: [
              { name: 'admin', title: '{{t("Admin")}}' },
              { name: 'root', title: '{{t("Root")}}' },
            ],
          },
        }),
      }),
    },
  }),
}));

vi.mock('../../../canvas/contexts', () => ({
  useCurrentWorkflowContext: () => ({
    config: { mode: SCHEDULE_MODE.DATE_FIELD, collection: 'roles' },
  }),
}));

vi.mock('../../../locale', () => ({
  NAMESPACE: 'workflow',
  useT: () => (key: string) => {
    const matched = key.match(/^{{t\("(.+)"(?:,\s*\{.*\})?\)}}$/);
    return matched?.[1] ?? key;
  },
}));

describe('TriggerScheduleConfig', () => {
  it('compiles server-returned title templates for trigger record options in date-field mode', async () => {
    render(
      <Form>
        <TriggerScheduleConfig />
      </Form>,
    );

    expect(screen.getByTestId('remote-select')).toBeInTheDocument();

    const items = await remoteSelectState.props?.request();
    const options = items?.map((item, index) => remoteSelectState.props?.mapOptions(item, index));

    expect(options).toEqual([
      { label: 'Admin', value: 'admin' },
      { label: 'Root', value: 'root' },
    ]);
  });
});
