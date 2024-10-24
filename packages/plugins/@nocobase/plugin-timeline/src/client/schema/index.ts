/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useDataBlockProps, useDataBlockRequest, useCollectionManager, useApp } from '@nocobase/client';
import { TimelineProps } from '../component';
import { BlockName, BlockNameLowercase } from '../constants';
import { timelineSettings } from '../settings';
import { configureActionsInitializer } from '../initializer';
import dayjs from 'dayjs';

interface GetTimelineSchemaOptions {
  dataSource?: string;
  collection: string;
  titleField: string;
  timeField: string;
  colorField: string;
}

export function getTimelineSchema(options: GetTimelineSchemaOptions) {
  const { dataSource = 'main', collection, timeField, titleField, colorField } = options;
  return {
    type: 'void',
    'x-toolbar': 'BlockSchemaToolbar',
    'x-decorator': 'DataBlockProvider',
    'x-decorator-props': {
      dataSource,
      collection,
      action: 'list',
      params: {
        sort: `-${timeField}`,
      },
      [BlockNameLowercase]: {
        titleField,
        timeField,
        colorField,
        mode: 'left',
        sort: false,
      },
    },
    'x-settings': timelineSettings.name,
    'x-component': 'CardItem',
    properties: {
      [BlockNameLowercase]: {
        type: 'void',
        'x-component': BlockName,
        'x-use-component-props': 'useTimelineProps',
        properties: {
          actions: {
            type: 'void',
            'x-component': 'ActionBar',
            'x-component-props': {},
            'x-initializer': configureActionsInitializer.name,
          },
        },
      },
    },
  };
}

export function useTimelineProps(): TimelineProps {
  const dataProps = useDataBlockProps();
  const app = useApp();
  const { dataSource, collection } = dataProps;
  const props = dataProps[BlockNameLowercase];
  const { mode, sort } = props;
  const { loading, data } = useDataBlockRequest<any[]>();
  const fields = app.getCollectionManager(dataSource).getCollection(collection).getFields();
  const status = fields.find((item) => item.name == props.colorField);

  return {
    loading,
    mode: mode,
    sort: sort,
    data: data?.data?.map((item) => ({
      label: item[props.timeField]
        ? dayjs(+new Date(item[props.timeField])).format('YYYY-MM-DD HH:mm:ss')
        : 'unset time',
      children: item[props.titleField],
      color: status?.['uiSchema']?.['enum']?.find((statu) => statu.value == item[props.colorField])?.color || 'blue',
    })),
  };
}
