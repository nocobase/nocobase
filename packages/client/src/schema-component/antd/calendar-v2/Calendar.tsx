import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { ArrayField } from '@formily/core';
import { observer, RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import moment from 'moment';
import React, { useMemo, useState } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import * as dates from 'react-big-calendar/lib/utils/dates';
import { RecordProvider } from '../../../';
import { i18n } from '../../../i18n';
import { ActionContext } from '../action';
import { CalendarToolbarContext } from './context';
import './style.less';
import type { ToolbarProps } from './types';
import { toEvents } from './utils';

const localizer = momentLocalizer(moment);

function Toolbar(props: ToolbarProps) {
  const fieldSchema = useFieldSchema();
  const toolBarSchema: Schema = useMemo(
    () =>
      fieldSchema.reduceProperties((buf, current) => {
        if (current['x-component'].endsWith('.ActionBar')) {
          return current;
        }
        return buf;
      }, null),
    [],
  );
  return (
    <CalendarToolbarContext.Provider value={props}>
      <RecursionField name={toolBarSchema.name} schema={toolBarSchema} />
    </CalendarToolbarContext.Provider>
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

const useEvents = (fieldNames: any) => {
  const field = useField<ArrayField>();
  return useMemo(() => {
    return toEvents(field.value, fieldNames);
  }, [fieldNames]);
};

export const Calendar: any = observer((props: any) => {
  const { useProps } = props;
  const field = useField<ArrayField>();
  const fieldSchema = useFieldSchema();
  const { fieldNames: fNames } = useProps?.() || {};
  const fieldNames = { id: 'id', title: 'title', start: 'start', end: 'end', ...props.fieldNames, ...fNames };
  const events = useEvents(fieldNames);
  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState<any>({});
  const eventSchema: Schema = useMemo(
    () =>
      fieldSchema.reduceProperties((buf, current) => {
        if (current['x-component'].endsWith('.Event')) {
          return current;
        }
        return buf;
      }, null),
    [],
  );
  return (
    <div {...props} style={{ height: 700 }}>
      {eventSchema && (
        <ActionContext.Provider value={{ visible, setVisible }}>
          <RecordProvider record={record}>
            <RecursionField name={eventSchema.name} schema={eventSchema} />
          </RecordProvider>
        </ActionContext.Provider>
      )}
      <BigCalendar
        popup
        selectable
        events={events}
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
          const record = field.value?.find((item) => item[fieldNames.id] === event.id);
          if (!record) {
            return;
          }
          setRecord(record);
          setVisible(true);
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
  );
});
