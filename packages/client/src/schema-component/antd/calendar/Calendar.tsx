import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { VoidField } from '@formily/core';
import { observer, RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import moment from 'moment';
import React, { useState } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import * as dates from 'react-big-calendar/lib/utils/dates';
import { SchemaComponent } from '../..';
import { AsyncDataProvider, RecordProvider, useRequest } from '../../../';
import { i18n } from '../../../i18n';
import { ActionBar, ActionContext } from '../action';
import { CalendarContext, ToolbarContext } from './context';
import { Event } from './Event';
import { Nav } from './Nav';
import './style.less';
import { Title } from './Title';
import { Today } from './Today';
import type { ToolbarProps } from './types';
import { toEvents } from './utils';
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
  const { request, dataSource } = props;
  if (request) {
    return request;
  }
  return (params: any = {}) => {
    return Promise.resolve({
      data: dataSource,
    });
  };
};

const useDefDataSource = (options, props) => {
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

  const field = useField<VoidField>();
  const fieldSchema = useFieldSchema();
  const [dataSource, setDataSource] = useState(props.dataSource || []);

  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState<any>({});
  const result = useDataSource(
    {
      uid: fieldSchema['x-uid'],
      refreshDeps: [props.dataSource],
      onSuccess(data) {
        const events = toEvents(data?.data, fieldNames);
        setDataSource(events);
      },
    },
    props,
  );
  const eventSchema: Schema = fieldSchema.reduceProperties((buf, current) => {
    if (current['x-component'] === 'Calendar.Event') {
      return current;
    }
    return buf;
  }, null);
  return (
    <AsyncDataProvider value={result}>
      <CalendarContext.Provider value={{ field, props, record }}>
        <div {...props} style={{ height: 700 }}>
          {eventSchema && (
            <ActionContext.Provider value={{ visible, setVisible }}>
              <RecordProvider record={record}>
                <SchemaComponent memoized name={eventSchema.name} schema={eventSchema as any} />
              </RecordProvider>
            </ActionContext.Provider>
          )}
          <BigCalendar
            popup
            selectable
            events={dataSource}
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
              const record = result?.data?.data?.find((item) => item.id === event.id);
              if (!record) {
                return;
              }
              setRecord(record);
              setVisible(true);
              console.log('onSelectEvent', record);
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

Calendar.ActionBar = ActionBar;

Calendar.Event = Event;

Calendar.Title = Title;

Calendar.Today = Today;

Calendar.Nav = Nav;

Calendar.ViewSelect = ViewSelect;
