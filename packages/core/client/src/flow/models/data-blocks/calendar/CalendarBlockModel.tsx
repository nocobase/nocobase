/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, MultiRecordResource } from '@nocobase/flow-engine';
import { Card, Modal } from 'antd';
import moment from 'moment';
import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { DataBlockModel } from '../../base/BlockModel';

const localizer = momentLocalizer(moment);

export class CalendarBlockModel extends DataBlockModel {
  declare resource: MultiRecordResource;

  render() {
    const data = this.resource.getData();
    return (
      <Card>
        <Calendar
          localizer={localizer}
          style={{ height: 500 }}
          {...this.props}
          onSelectEvent={(event) => {
            this.dispatchEvent('onSelectEvent', { event });
          }}
          onDoubleClickEvent={(event) => {
            this.dispatchEvent('onDoubleClickEvent', { event });
          }}
          events={data.map((item) => {
            return {
              ...item,
              createdAt: item.createdAt ? moment(item.createdAt).toDate() : undefined,
            };
          })}
        />
      </Card>
    );
  }
}

CalendarBlockModel.define({
  title: 'Calendar',
  group: 'Content',
  hide: true,
  defaultOptions: {
    use: 'CalendarBlockModel',
  },
});

CalendarBlockModel.registerFlow({
  key: 'key2',
  on: {
    eventName: 'onSelectEvent',
  },
  steps: {
    step1: {
      handler(ctx, params) {
        console.log('ctx.extra.event', ctx.extra.event);
        Modal.info({
          title: 'Event Selected',
          content: (
            <div>
              <p>Title: {ctx.extra.event.nickname}</p>
              <p>Start: {moment(ctx.extra.event.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
              <p>End: {moment(ctx.extra.event.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
            </div>
          ),
        });
      },
    },
  },
});

CalendarBlockModel.registerFlow({
  key: 'key3',
  on: {
    eventName: 'onDoubleClickEvent',
  },
  steps: {
    step1: {
      handler(ctx, params) {
        console.log('ctx.extra.event', ctx.extra.event);
        Modal.info({
          title: 'Double Click',
          content: (
            <div>
              <p>Title: {ctx.extra.event.nickname}</p>
              <p>Start: {moment(ctx.extra.event.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
              <p>End: {moment(ctx.extra.event.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
            </div>
          ),
        });
      },
    },
  },
});

CalendarBlockModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      paramsRequired: true,
      hideInSettings: true,
      uiSchema: {
        dataSourceKey: {
          type: 'string',
          title: 'Data Source Key',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: 'Enter data source key',
          },
        },
        collectionName: {
          type: 'string',
          title: 'Collection Name',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: 'Enter collection name',
          },
        },
      },
      defaultParams: {
        dataSourceKey: 'main',
      },
      handler: async (ctx, params) => {
        const collection = ctx.globals.dataSourceManager.getCollection(params.dataSourceKey, params.collectionName);
        ctx.model.collection = collection;
        const resource = new MultiRecordResource();
        resource.setDataSourceKey(params.dataSourceKey);
        resource.setResourceName(params.collectionName);
        resource.setAPIClient(ctx.globals.api);
        ctx.model.resource = resource;
        await resource.refresh();
      },
    },
    step2: {
      paramsRequired: true,
      uiSchema: {
        titleAccessor: {
          type: 'string',
          title: 'Title accessor',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: 'Enter title accessor',
          },
        },
        startAccessor: {
          type: 'string',
          title: 'Start accessor',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: 'Enter start accessor',
          },
        },
        endAccessor: {
          type: 'string',
          title: 'End accessor',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: 'Enter end accessor',
          },
        },
      },
      handler: async (ctx, params) => {
        console.log('CalendarBlockModel step2 params:', params);
        ctx.model.setProps('titleAccessor', params.titleAccessor);
        ctx.model.setProps('startAccessor', params.startAccessor);
        ctx.model.setProps('endAccessor', params.endAccessor);
      },
    },
  },
});
