/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { RecursionField, Schema, observer, useFieldSchema } from '@formily/react';
import {
  PopupContextProvider,
  RecordProvider,
  getLabelFormatValue,
  useCollection,
  useCollectionParentRecordData,
  usePopupUtils,
  useProps,
  withDynamicSchemaProps,
} from '@nocobase/client';
import { parseExpression } from 'cron-parser';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import get from 'lodash/get';
import React, { useMemo, useState } from 'react';
import { Calendar as BigCalendar, View, dayjsLocalizer } from 'react-big-calendar';
import * as dates from 'react-big-calendar/lib/utils/dates';
import { i18nt, useTranslation } from '../../locale';
import { CalendarRecordViewer, findEventSchema } from './CalendarRecordViewer';
import Header from './components/Header';
import { CalendarToolbarContext } from './context';
import GlobalStyle from './global.style';
import { useCalenderHeight } from './hook';
import useStyle from './style';
import type { ToolbarProps } from './types';
import { formatDate } from './utils';

const Weeks = ['month', 'week', 'day'] as View[];
const localizer = dayjsLocalizer(dayjs);

export const DeleteEventContext = React.createContext({
  close: () => {},
});

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

const useEvents = (dataSource: any, fieldNames: any, date: Date, view: (typeof Weeks)[number]) => {
  const { t } = useTranslation();
  const { fields } = useCollection();
  const labelUiSchema = fields.find((v) => v.name === fieldNames?.title)?.uiSchema;
  return useMemo(() => {
    if (!Array.isArray(dataSource)) return [];
    const events = [];

    dataSource.forEach((item) => {
      const { cron, exclude = [] } = item;
      const start = dayjs(get(item, fieldNames.start) || dayjs());
      const end = dayjs(get(item, fieldNames.end) || start);
      const intervalTime = end.diff(start, 'millisecond', true);

      const dateM = dayjs(date);
      let startDate = dateM.clone().startOf('month');
      let endDate = startDate.clone().endOf('month');

      /**
       * view === month 时，会显示当月日程
       * 但这个日历一般情况下需要展示 6w * 7d 的日程，总共 42 天
       * 假设 10.1 号是星期六，我们需要将日程的开始时间调整为这一周的星期一，也就是 9.25 号
       * 而结束时间需要调整为 10.31 号这一周的星期日，也就是 10.5 号
       */
      if (view === 'month') {
        startDate = startDate.startOf('week');
        endDate = endDate.endOf('week');
      }

      const push = (eventStart: Dayjs = start.clone()) => {
        // 必须在这个月的开始时间和结束时间，且在日程的开始时间之后
        if (eventStart.isBefore(start)) {
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
        console.log(99);
        if (res) return out;
        const title = getLabelFormatValue(labelUiSchema, get(item, fieldNames.title), true);
        const event = {
          id: get(item, fieldNames.id || 'id'),
          title: title || t('Untitle'),
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
          nextStart = nextStart.add(1, 'week');
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
            if (push(dayjs(value.toDate()))) break;
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
    return events;
  }, [dataSource, fieldNames.start, fieldNames.end, fieldNames.id, fieldNames.title, date, view, t]);
};

export const Calendar: any = withDynamicSchemaProps(
  observer(
    (props: any) => {
      const [visible, setVisible] = useState(false);
      const { openPopup } = usePopupUtils({
        setVisible,
      });

      // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
      const { dataSource, fieldNames, showLunar } = useProps(props);
      const height = useCalenderHeight();
      const [date, setDate] = useState<Date>(new Date());
      const [view, setView] = useState<View>('month');
      const events = useEvents(dataSource, fieldNames, date, view);
      const [record, setRecord] = useState<any>({});
      const { wrapSSR, hashId, componentCls: containerClassName } = useStyle();
      const parentRecordData = useCollectionParentRecordData();
      const fieldSchema = useFieldSchema();

      const components = useMemo(() => {
        return {
          toolbar: (props) => <Toolbar {...props} showLunar={showLunar}></Toolbar>,
          // week: {
          //   header: (props) => <Header {...props} type="week" showLunar={showLunar}></Header>,
          // },
          month: {
            dateHeader: (props) => <Header {...props} showLunar={showLunar}></Header>,
          },
        };
      }, [showLunar]);

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
        today: i18nt('Today'),
        month: i18nt('Month'),
        week: i18nt('Week'),
        work_week: i18nt('Work week'),
        day: i18nt('Day'),
        agenda: i18nt('Agenda'),
        date: i18nt('Date'),
        time: i18nt('Time'),
        event: i18nt('Event'),
        noEventsInRange: i18nt('None'),
        showMore: (count) => i18nt('{{count}} more items', { count }),
      };
      console.log(events, dataSource, fieldNames, date, view);
      return wrapSSR(
        <div className={`${hashId} ${containerClassName}`} style={{ height: height || 700 }}>
          <PopupContextProvider visible={visible} setVisible={setVisible}>
            <GlobalStyle />
            <RecordProvider record={record} parent={parentRecordData}>
              <CalendarRecordViewer />
            </RecordProvider>
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
              onDoubleClickEvent={() => {
                console.log('onDoubleClickEvent');
              }}
              onSelectEvent={(event) => {
                const record = dataSource?.find((item) => item[fieldNames.id] === event.id);
                if (!record) {
                  return;
                }
                record.__event = { ...event, start: formatDate(dayjs(event.start)), end: formatDate(dayjs(event.end)) };

                setRecord(record);
                openPopup({
                  recordData: record,
                  customActionSchema: findEventSchema(fieldSchema),
                });
              }}
              formats={{
                monthHeaderFormat: 'YYYY-M',
                agendaDateFormat: 'M-DD',
                dayHeaderFormat: 'YYYY-M-DD',
                dayRangeHeaderFormat: ({ start, end }, culture, local) => {
                  if (dates.eq(start, end, 'month')) {
                    return local.format(start, 'YYYY-M', culture);
                  }
                  return `${local.format(start, 'YYYY-M', culture)} - ${local.format(end, 'YYYY-M', culture)}`;
                },
              }}
              components={components}
              localizer={localizer}
            />
          </PopupContextProvider>
        </div>,
      );
    },
    { displayName: 'Calendar' },
  ),
);
