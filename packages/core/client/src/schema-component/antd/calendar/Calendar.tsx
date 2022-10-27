import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { createForm } from '@formily/core';
import { observer, RecursionField, Schema, useFieldSchema } from '@formily/react';
import get from 'lodash/get';
import moment from 'moment';
import React, { useMemo, useState } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import * as dates from 'react-big-calendar/lib/utils/dates';
import { useTranslation } from 'react-i18next';
import solarLunar from 'solarlunar-es';
import { RecordProvider } from '../../../';
import { i18n } from '../../../i18n';
import { useProps } from '../../hooks/useProps';
import { ActionContext } from '../action';
import { CalendarToolbarContext } from './context';
import './style.less';
import type { ToolbarProps } from './types';

const localizer = momentLocalizer(moment);

const DateHeader = ({ date, label, drilldownView, onDrillDown, showLunar = false }) => {
  if (!drilldownView) {
    return <span>{label}</span>;
  }

  const lunarElement = useMemo(() => {
    if (!showLunar) {
      return;
    }
    const md = moment(date);
    const result = solarLunar.solar2lunar(md.year(), md.month() + 1, md.date());
    const lunarDay = typeof result !== 'number' ? result.lunarFestival || result.term || result.dayCn : result;
    return <span className="rbc-date-lunar">{lunarDay}</span>;
  }, [date, showLunar]);

  return (
    <a onClick={onDrillDown} role="cell">
      <span className="rbc-date-solar">{label}</span>
      {lunarElement}
    </a>
  );
};

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

const useEvents = (dataSource: any, fieldNames: any) => {
  const { t } = useTranslation();
  return useMemo(
    () =>
      Array.isArray(dataSource)
        ? dataSource?.map((item) => {
            return {
              id: get(item, fieldNames.id || 'id'),
              title: get(item, fieldNames.title) || t('Untitle'),
              start: new Date(get(item, fieldNames.start)),
              end: new Date(get(item, fieldNames.end || fieldNames.start)),
            };
          })
        : [],
    [dataSource, fieldNames],
  );
};

const CalendarRecordViewer = (props) => {
  const { visible, setVisible, record } = props;
  const form = useMemo(() => createForm(), [record]);
  const fieldSchema = useFieldSchema();
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
    eventSchema && (
      <ActionContext.Provider value={{ visible, setVisible }}>
        <RecordProvider record={record}>
          <RecursionField schema={eventSchema} name={eventSchema.name} />
        </RecordProvider>
      </ActionContext.Provider>
    )
  );
};

export const Calendar: any = observer((props: any) => {
  const { dataSource, fieldNames, showLunar } = useProps(props);
  const events = useEvents(dataSource, fieldNames);
  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState<any>({});

  return (
    <div {...props} style={{ height: 700 }}>
      <CalendarRecordViewer visible={visible} setVisible={setVisible} record={record} />
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
          const record = dataSource?.find((item) => item[fieldNames.id] === event.id);
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
          dateHeader: (props) => <DateHeader {...props} showLunar={showLunar}></DateHeader>,
        }}
        localizer={localizer}
      />
    </div>
  );
});
