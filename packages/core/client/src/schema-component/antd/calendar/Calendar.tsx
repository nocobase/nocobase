import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { createForm } from '@formily/core';
import { observer, RecursionField, Schema, useFieldSchema } from '@formily/react';
import get from 'lodash/get';
import moment from 'moment';
import React, { useMemo, useState } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import * as dates from 'react-big-calendar/lib/utils/dates';
import { useTranslation } from 'react-i18next';
import { parseExpression } from 'cron-parser';
import { RecordProvider } from '../../../';
import { i18n } from '../../../i18n';
import { useProps } from '../../hooks/useProps';
import { ActionContext } from '../action';
import Header from './components/Header';
import { CalendarToolbarContext } from './context';
import './style.less';
import type { ToolbarProps } from './types';

const Weeks = ['month', 'week', 'day'] as const;

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

const useEvents = (dataSource: any, fieldNames: any, date: Date, view: typeof Weeks[number]) => {
  const { t } = useTranslation();
  return useMemo(() => {
    if (!Array.isArray(dataSource)) return [];
    const events = [];

    dataSource.forEach((item) => {
      const { cron, exclude = [] } = item;
      const start = moment(get(item, fieldNames.start) || moment());
      const end = moment(get(item, fieldNames.end) || start);
      const intervalTime = end.diff(start, 'millisecond', true);

      const dateM = moment(date);
      const startDate = dateM.clone().startOf('month');
      const endDate = startDate.clone().endOf('month');
      if (view === 'month') {
        startDate.startOf('week');
        endDate.endOf('week');
      }
      const push = (eventStart: moment.Moment = start.clone()) => {
        // 必须在这个月的开始时间和结束时间，且在日程的开始时间之后
        if (eventStart.isBefore(start) || !eventStart.isBetween(startDate, endDate)) {
          return;
        }

        let out = false;
        const res = exclude?.some((d) => {
          if (d.endsWith('_after')) {
            d = d.replace(/_after$/, '');
            out = true;
            return eventStart.isSameOrAfter(d);
          } else {
            return eventStart.isSame(d);
          }
        });

        if (res) return out;

        const event = {
          id: get(item, fieldNames.id || 'id'),
          title: get(item, fieldNames.title) || t('Untitle'),
          start: eventStart.toDate(),
          end: eventStart.add(intervalTime, 'millisecond').toDate(),
        };

        events.push(event);
      };

      if (cron === 'every_week') {
        let nextStart = start
          .clone()
          .year(startDate.year())
          .month(startDate.month())
          .date(startDate.date())
          .day(start.day());
        while (nextStart.isBefore(endDate)) {
          if (push(nextStart.clone())) {
            break;
          }
          nextStart.add(1, 'week');
        }
      } else if (cron === 'every_month') {
        push(start.clone().year(dateM.year()).month(dateM.month()));
      } else if (cron === 'every_year') {
        push(start.clone().year(dateM.year()));
      } else {
        push();
        if (!cron) return;
        try {
          const interval = parseExpression(cron, {
            startDate: startDate.toDate(),
            endDate: endDate.toDate(),
            iterator: true,
            currentDate: start.toDate(),
            utc: true,
          });
          while (interval.hasNext()) {
            const { value } = interval.next();
            if (push(moment(value.toDate()))) break;
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
    return events;
  }, [dataSource, fieldNames, date, view]);
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
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<typeof Weeks[number]>('month');
  const events = useEvents(dataSource, fieldNames, date, view);
  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState<any>({});

  return (
    <div style={{ height: 700 }}>
      <CalendarRecordViewer visible={visible} setVisible={setVisible} record={record} />
      <BigCalendar
        popup
        selectable
        events={events}
        view={view}
        views={Weeks}
        date={date}
        step={60}
        showMultiDayTimes
        messages={messages}
        onNavigate={setDate}
        onView={setView}
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
          record.__event = event;
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
        components={{
          toolbar: (props) => <Toolbar {...props} showLunar={showLunar}></Toolbar>,
          week: {
            header: (props) => <Header {...props} type="week" showLunar={showLunar}></Header>,
          },
          month: {
            dateHeader: (props) => <Header {...props} showLunar={showLunar}></Header>,
          },
        }}
        localizer={localizer}
      />
    </div>
  );
});
