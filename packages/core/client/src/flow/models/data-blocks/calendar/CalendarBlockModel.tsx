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
import { tval } from '@nocobase/utils/client';
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
  title: tval('Calendar'),
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
        console.log('ctx.runtimeArgs.event', ctx.runtimeArgs.event);
        const t = ctx.model.translate;
        Modal.info({
          title: t('Event selected'),
          content: (
            <div>
              <p>
                {t('Title')}: {ctx.runtimeArgs.event.nickname}
              </p>
              <p>
                {t('Start')}: {moment(ctx.runtimeArgs.event.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </p>
              <p>
                {t('End')}: {moment(ctx.runtimeArgs.event.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </p>
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
        console.log('ctx.runtimeArgs.event', ctx.runtimeArgs.event);
        const t = ctx.model.translate;
        Modal.info({
          title: t('Double click'),
          content: (
            <div>
              <p>
                {t('Title')}: {ctx.runtimeArgs.event.nickname}
              </p>
              <p>
                {t('Start')}: {moment(ctx.runtimeArgs.event.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </p>
              <p>
                {t('End')}: {moment(ctx.runtimeArgs.event.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </p>
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
          title: tval('Data Source Key'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: tval('Enter data source key'),
          },
        },
        collectionName: {
          type: 'string',
          title: tval('Collection Name'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: tval('Enter collection name'),
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
          title: tval('Title accessor'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: tval('Enter title accessor'),
          },
        },
        startAccessor: {
          type: 'string',
          title: tval('Start accessor'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: tval('Enter start accessor'),
          },
        },
        endAccessor: {
          type: 'string',
          title: tval('End accessor'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: tval('Enter end accessor'),
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
