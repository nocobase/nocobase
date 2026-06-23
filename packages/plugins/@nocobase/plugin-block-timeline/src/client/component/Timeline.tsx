/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { Timeline as AntdTimeline, TimelineProps as AntdTimelineProps, Spin } from 'antd';
import { withDynamicSchemaProps, css } from '@nocobase/client';
import { BlockName } from '../constants';
import { useTimelineHeight } from '../hooks';

export interface TimelineProps {
  data?: AntdTimelineProps['items'];
  loading?: boolean;
  mode?: any;
  sort?: boolean;
}

export const Timeline: FC<TimelineProps> = withDynamicSchemaProps(
  (props) => {
    const { data, loading, mode, sort } = props;
    const height = useTimelineHeight();
    if (loading)
      return (
        <div style={{ height: 100, textAlign: 'center' }}>
          <Spin />
        </div>
      );
    return (
      <div>
        {props.children}
        <div style={{ height: height || 'unset', overflowY: 'auto', overflowX: 'hidden' }}>
          <AntdTimeline style={{ marginTop: '20px' }} reverse={sort} mode={mode} items={data}></AntdTimeline>
        </div>
      </div>
    );
  },
  { displayName: BlockName },
);
