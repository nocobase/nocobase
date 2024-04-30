/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/react';
import { Select } from 'antd';
import React, { useContext } from 'react';
import { CalendarToolbarContext } from './context';
import { useDesignable } from '@nocobase/client';

export const ViewSelect = observer(
  (props) => {
    const { DesignableBar } = useDesignable();
    const {
      views,
      view,
      onView,
      localizer: { messages },
    } = useContext(CalendarToolbarContext);
    return (
      <div className="ant-btn-group">
        <Select popupMatchSelectWidth={false} value={view} onChange={onView}>
          {views.map((name) => (
            <Select.Option key={name} value={name}>
              {messages[name]}
            </Select.Option>
          ))}
        </Select>
        <DesignableBar />
      </div>
    );
  },
  { displayName: 'ViewSelect' },
);
