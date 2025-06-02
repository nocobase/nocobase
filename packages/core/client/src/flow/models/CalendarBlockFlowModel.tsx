/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card } from 'antd';
import moment from 'moment';
import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { BlockFlowModel } from './BlockFlowModel';

function generateRandomEvents(count = 20) {
  const now = new Date();
  const events = [];
  for (let i = 0; i < count; i++) {
    const start = new Date(
      now.getTime() +
        Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000 +
        Math.floor(Math.random() * 8) * 60 * 60 * 1000,
    );
    const end = new Date(start.getTime() + (1 + Math.floor(Math.random() * 3)) * 60 * 60 * 1000);
    events.push({
      id: i,
      title: `事件${i + 1}`,
      start,
      end,
    });
  }
  return events;
}

const localizer = momentLocalizer(moment);

export class CalendarBlockFlowModel extends BlockFlowModel {
  render() {
    return (
      <Card>
        <Calendar
          localizer={localizer}
          events={generateRandomEvents(20) || []}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
        />
      </Card>
    );
  }
}

CalendarBlockFlowModel.define({
  title: 'Calendar',
  group: 'Content',
  defaultOptions: {
    use: 'CalendarBlockFlowModel',
  },
});
