import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { ArrayField } from '@formily/core';
import { observer, RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { Drawer } from 'antd';
import moment from 'moment';
import React, { useState } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import * as dates from 'react-big-calendar/lib/utils/dates';
import { useTranslation } from 'react-i18next';
import { AsyncDataProvider, useRequest } from '../../../';
import { i18n } from '../../../i18n';
import { ActionBar } from '../action';
import { ActionInitializer } from './ActionInitializer';
import { CalendarContext, RecordContext, ToolbarContext } from './context';
import { Filter } from './Filter';
import { Nav } from './Nav';
import './style.less';
import { Title } from './Title';
import { Today } from './Today';
import type { ToolbarProps } from './types';
import { ViewSelect } from './ViewSelect';

const localizer = momentLocalizer(moment);

function Toolbar(props: ToolbarProps) {
  const fieldSchema = useFieldSchema();
  const toolBarSchema: Schema = fieldSchema.reduceProperties((buf, current) => {
    if (current['x-component'] === 'Calendar.ActionBar') {
      return current;
    }
    return buf;
  }, null);

  return (
    <ToolbarContext.Provider value={props}>
      <RecursionField name={toolBarSchema.name} schema={toolBarSchema} />
    </ToolbarContext.Provider>
  );
}

const messages: any = {
  allDay: '',
  previous: (
    <div>
      <LeftOutlined />
    </div>
  ),
  next: (
    <div>
      <RightOutlined />
    </div>
  ),
  today: i18n.t('Today'),
  month: i18n.t('Month'),
  week: i18n.t('Week'),
  work_week: i18n.t('Work week'),
  day: i18n.t('Day'),
  agenda: i18n.t('Agenda'),
  date: i18n.t('Date'),
  time: i18n.t('Time'),
  event: i18n.t('Event'),
  noEventsInRange: i18n.t('None'),
  showMore: (count) => i18n.t('{{count}} more items', { count }),
};

const useRequestProps = (props) => {
  const { request, value } = props;
  debugger;
  if (request) {
    return request;
  }
  return (params: any = {}) => {
    return Promise.resolve({
      data: value,
    });
  };
};

const useDefDataSource = (props, options) => {
  return useRequest(useRequestProps(props), options);
};

export const Calendar: any = observer((props: any) => {
  const {
    useDataSource = useDefDataSource,
    fieldNames = {
      id: 'id',
      title: 'title',
      start: 'start',
      end: 'end',
    },
  } = props;
  const { t } = useTranslation();
  const field = useField<ArrayField>();
  const fieldSchema = useFieldSchema();
  const eventSchema: Schema = fieldSchema.reduceProperties((buf, current) => {
    if (current['x-component'] === 'Calendar.Event') {
      return current;
    }
    return buf;
  }, null);

  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState<any>({});
  console.log('field.value', field.value);
  const result = useDataSource(props, {
    uid: fieldSchema['x-uid'],
    onSuccess(data) {
      debugger;
      field.setValue(data?.data);
    },
  });
  return (
    <AsyncDataProvider value={result}>
      <CalendarContext.Provider value={{ field, props }}>
        <div {...props} style={{ height: 700 }}>
          <Drawer
            width={'50%'}
            visible={visible}
            onClose={() => {
              setVisible(false);
            }}
            title={t('View record')}
            bodyStyle={{
              background: '#f0f2f5',
              paddingTop: 0,
            }}
          >
            <RecordContext.Provider value={record}>
              <RecursionField name={eventSchema.name} schema={eventSchema} onlyRenderProperties />
            </RecordContext.Provider>
          </Drawer>
          <BigCalendar
            popup
            selectable
            events={Array.isArray(field.value.slice()) ? field.value.slice() : []}
            views={['month', 'week', 'day']}
            step={60}
            showMultiDayTimes
            messages={messages}
            onSelectSlot={(slotInfo) => {
              console.log('onSelectSlot', slotInfo);
            }}
            onDoubleClickEvent={(event) => {
              console.log('onDoubleClickEvent');
            }}
            onSelectEvent={(event) => {
              const record = field.value?.find((item) => item.id === event.id);
              if (!record) {
                return;
              }
              setRecord(record);
              setVisible(true);
              console.log('onSelectEvent');
            }}
            formats={{
              monthHeaderFormat: 'Y-M',
              agendaDateFormat: 'M-DD',
              dayHeaderFormat: 'Y-M-DD',
              dayRangeHeaderFormat: ({ start, end }, culture, local) => {
                if (dates.eq(start, end, 'month')) {
                  return local.format(start, 'Y-M', culture);
                }
                return `${local.format(start, 'Y-M', culture)} - ${local.format(end, 'Y-M', culture)}`;
              },
            }}
            defaultDate={new Date()}
            components={{
              toolbar: Toolbar,
            }}
            localizer={localizer}
          />
        </div>
      </CalendarContext.Provider>
    </AsyncDataProvider>
  );
});

Calendar.ActionInitializer = ActionInitializer;

Calendar.ActionBar = ActionBar;

Calendar.Title = Title;

Calendar.Today = Today;

Calendar.Nav = Nav;

Calendar.ViewSelect = ViewSelect;

Calendar.Filter = Filter;
