import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { createForm, VoidField } from '@formily/core';
import { observer, RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import moment from 'moment';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import * as dates from 'react-big-calendar/lib/utils/dates';
import { useTranslation } from 'react-i18next';
import { SchemaComponent } from '../..';
import { AsyncDataProvider, useRequest } from '../../../';
import { i18n } from '../../../i18n';
import { ActionBar, ActionContext, useActionContext } from '../action';
import { ActionInitializer } from './ActionInitializer';
import { CalendarContext, ToolbarContext } from './context';
import { Filter } from './Filter';
import { FooterActionInitializer } from './FooterActionInitializer';
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
  const form = useMemo(() => createForm(), []);

  const field = useField<VoidField>();
  const fieldSchema = useFieldSchema();

  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState<any>({});
  const result = useDataSource(props, {
    uid: fieldSchema['x-uid'],
    refreshDeps: [props.dataSource],
    onSuccess(data) {
      return toEvents(data?.data, fieldNames);
    },
  });
  const eventSchema: Schema = fieldSchema.reduceProperties((buf, current) => {
    if (current['x-component'] === 'Calendar.Event') {
      return current;
    }
    return buf;
  }, null);

  const useValues = (options) => {
    const { visible } = useActionContext();
    const { record } = useContext(CalendarContext);
    const result = useRequest(
      () =>
        Promise.resolve({
          data: {
            ...record,
          },
        }),
      { ...options, manual: true },
    );
    useEffect(() => {
      if (visible) {
        result.run();
      }
    }, [visible]);
    return result;
  };

  return (
    <AsyncDataProvider value={result}>
      <CalendarContext.Provider value={{ field, props, record }}>
        <div {...props} style={{ height: 700 }}>
          <ActionContext.Provider value={{ visible, setVisible }}>
            <SchemaComponent memoized name={eventSchema.name} scope={{ useValues }} schema={eventSchema as any} />
          </ActionContext.Provider>
          <BigCalendar
            popup
            selectable
            events={Array.isArray(result?.data?.data) ? result?.data?.data : []}
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

Calendar.FooterActionInitializer = FooterActionInitializer;

Calendar.ActionBar = ActionBar;

Calendar.Event = observer((props) => {
  return <>{props.children}</>;
});

Calendar.Title = Title;

Calendar.Today = Today;

Calendar.Nav = Nav;

Calendar.ViewSelect = ViewSelect;

Calendar.Filter = Filter;
