/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Schema, useField, useFieldSchema } from '@formily/react';
import {
  ActionContextProvider,
  CollectionProvider,
  NocoBaseRecursionField,
  PopupContextProvider,
  RecordProvider,
  SchemaComponentOptions,
  getLabelFormatValue,
  handleDateChangeOnForm,
  useACLRoleContext,
  useActionContext,
  useApp,
  useCollection,
  useCollectionParentRecordData,
  useDesignable,
  useFormBlockContext,
  useLazy,
  usePopupUtils,
  useProps,
  withDynamicSchemaProps,
  withSkeletonComponent,
} from '@nocobase/client';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { cloneDeep, get, omit } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-big-calendar';
import { i18nt, useTranslation } from '../../locale';
import { CalendarRecordViewer, findEventSchema } from './CalendarRecordViewer';
import Header from './components/Header';
import { CalendarToolbarContext } from './context';
import GlobalStyle from './global.style';
import { useCalenderHeight } from './hook';
import { addNew } from './schema';
import useStyle from './style';
import type { ToolbarProps } from './types';
import { formatDate } from './utils';
import updateLocale from 'dayjs/plugin/updateLocale';
import { dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';

interface Event {
  id: string;
  colorFieldValue: string;
  title: string;
  start: Date;
  end: Date;
}

const Weeks = ['month', 'week', 'day'] as View[];

export const DeleteEventContext = React.createContext({
  close: () => {},
  allowDeleteEvent: false,
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
      <NocoBaseRecursionField name={toolBarSchema.name} schema={toolBarSchema} />
    </CalendarToolbarContext.Provider>
  );
}

const useEvents = (
  dataSource: any,
  fieldNames: {
    colorFieldName: string;
    start: string;
    end: string;
    id: string;
    title: string;
  },
  date: Date,
  view: (typeof Weeks)[number] | any = 'month',
) => {
  const parseExpression = useLazy<typeof import('cron-parser').parseExpression>(
    () => import('cron-parser'),
    'parseExpression',
  );
  const { t } = useTranslation();
  const { fields } = useCollection();
  const app = useApp();
  const plugin = app.pm.get('calendar') as any;
  const labelUiSchema = fields.find((v) => v.name === fieldNames?.title)?.uiSchema;
  const enumUiSchema = fields.find((v) => v.name === fieldNames?.colorFieldName);
  return useMemo(() => {
    if (!Array.isArray(dataSource)) return { events: [], enumList: [] };
    const enumList = enumUiSchema?.uiSchema?.enum || [];
    const events: Event[] = [];

    dataSource.forEach((item) => {
      const { cron, exclude = [] } = item;
      const start = dayjs(get(item, fieldNames.start) || dayjs());
      const end = dayjs(get(item, fieldNames.end) || start);
      const intervalTime = end.diff(start, 'millisecond', true);

      const dateM = dayjs(date);
      const startDate = dateM.clone().startOf(view);
      const endDate = startDate.clone().endOf(view);

      /**
       * view === month 时，会显示当月日程
       * 但这个日历一般情况下需要展示 6w * 7d 的日程，总共 42 天
       * 假设 10.1 号是星期六，我们需要将日程的开始时间调整为这一周的星期一，也就是 9.25 号
       * 而结束时间需要调整为 10.31 号这一周的星期日，也就是 10.5 号
       */
      // if (view === 'month') {
      //   startDate = startDate.startOf('week');
      //   endDate = endDate.endOf('week');
      // }

      const push = (eventStart: Dayjs = start.clone()) => {
        // 必须在这个月的开始时间和结束时间，且在日程的开始时间之后
        if (
          eventStart.isBefore(start) || // 开始时间早于 start
          (!eventStart.isBetween(startDate, endDate, null, '[]') && !end.isBetween(startDate, endDate)) // 开始时间和结束时间不在月份范围内
        ) {
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
        const targetTitleCollectionField = fields.find((v) => v.name === fieldNames.title);
        const targetTitle = plugin.getTitleFieldInterface(targetTitleCollectionField.interface);
        const title = getLabelFormatValue(
          labelUiSchema,
          get(item, fieldNames.title),
          true,
          targetTitleCollectionField,
          targetTitle?.TitleRenderer,
        );

        const event: Event = {
          id: get(item, fieldNames.id || 'id'),
          colorFieldValue: item[fieldNames.colorFieldName],
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
    return { events, enumList };
  }, [
    labelUiSchema,
    dataSource,
    fieldNames.colorFieldName,
    fieldNames.start,
    fieldNames.end,
    fieldNames.id,
    fieldNames.title,
    date,
    view,
    t,
    enumUiSchema?.uiSchema?.enum,
    parseExpression,
  ]);
};

const useInsertSchema = (component) => {
  const fieldSchema = useFieldSchema();
  const { insertAfterBegin } = useDesignable();
  const insert = useCallback(
    (ss) => {
      const schema = fieldSchema.reduceProperties((buf, s) => {
        if (s['x-component'] === 'AssociationField.' + component) {
          return s;
        }
        return buf;
      }, null);
      if (!schema) {
        insertAfterBegin(cloneDeep(ss));
      }
    },
    [component, fieldSchema, insertAfterBegin],
  );
  return insert;
};

export const Calendar: any = withDynamicSchemaProps(
  withSkeletonComponent(
    (props: any) => {
      const [visible, setVisible] = useState(false);
      const { openPopup } = usePopupUtils({
        setVisible,
      });
      const reactBigCalendar = useLazy(
        () => import('react-big-calendar'),
        (module) => ({
          BigCalendar: module.Calendar,
          dayjsLocalizer: module.dayjsLocalizer,
        }),
      );

      const eq = useLazy<typeof import('react-big-calendar/lib/utils/dates').eq>(
        () => import('react-big-calendar/lib/utils/dates'),
        'eq',
      );

      const localizer = useMemo(() => {
        return dateFnsLocalizer({
          format,
          parse,
          startOfWeek: (date) => {
            return startOfWeek(date, { locale: { options: { weekStartsOn: props.weekStart } } });
          },
          getDay,
          locales: { 'en-US': enUS },
        });
      }, [props.weekStart]);
      // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
      const { dataSource, fieldNames, showLunar, getFontColor, getBackgroundColor, enableQuickCreateEvent } =
        useProps(props);
      const height = useCalenderHeight();
      const [date, setDate] = useState<Date>(new Date());
      const [view, setView] = useState<View>(props.defaultView || 'month');
      const { events, enumList } = useEvents(dataSource, fieldNames, date, view);
      const [record, setRecord] = useState<any>({});
      const { wrapSSR, hashId, componentCls: containerClassName } = useStyle();
      const parentRecordData = useCollectionParentRecordData();
      const fieldSchema = useFieldSchema();
      const field = useField();
      //nint deal with slot select to show create popup
      const { parseAction } = useACLRoleContext();
      const collection = useCollection();
      const canCreate = parseAction(`${collection.name}:create`);
      const startFieldName = fieldNames?.start?.[0];
      const endFieldName = fieldNames?.end?.[0];
      const insertAddNewer = useInsertSchema('AddNewer');
      const ctx = useActionContext();
      const [visibleAddNewer, setVisibleAddNewer] = useState(false);
      const [currentSelectDate, setCurrentSelectDate] = useState(undefined);
      const colorCollectionField = collection.getField(fieldNames.colorFieldName);

      useEffect(() => {
        setView(props.defaultView);
      }, [props.defaultView]);

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

      const eventPropGetter = (event: Event) => {
        if (event.colorFieldValue) {
          const fontColor = getFontColor?.(event.colorFieldValue);
          const backgroundColor = getBackgroundColor?.(event.colorFieldValue);
          const style = {};
          if (fontColor) {
            style['color'] = fontColor;
          }
          if (backgroundColor) {
            style['backgroundColor'] = backgroundColor;
          }
          return {
            style,
          };
        }
      };
      // 快速创建行程
      const useCreateFormBlockProps = () => {
        const ctx = useFormBlockContext();
        let startDateValue = currentSelectDate.start;
        let endDataValue = currentSelectDate.end;
        const startCollectionField = collection.getField(startFieldName);
        const endCollectionField = collection.getField(endFieldName);

        useEffect(() => {
          const form = ctx.form;
          if (!form || ctx.service?.loading) {
            return;
          }
          if (currentSelectDate) {
            const startFieldProps = {
              ...startCollectionField?.uiSchema?.['x-component-props'],
              ...ctx.form?.query(startFieldName).take()?.componentProps,
            };
            const endFieldProps = {
              ...endCollectionField?.uiSchema?.['x-component-props'],
              ...ctx.form?.query(endFieldName).take()?.componentProps,
            };

            startDateValue = handleDateChangeOnForm(
              currentSelectDate.start,
              startFieldProps.dateOnly,
              startFieldProps.utc,
              startFieldProps.picker,
              startFieldProps.showTime,
              startFieldProps.gtm,
            );
            endDataValue = handleDateChangeOnForm(
              currentSelectDate.end,
              endFieldProps.dateOnly,
              endFieldProps.utc,
              endFieldProps.picker,
              endFieldProps.showTime,
              endFieldProps.gtm,
            );
            if (!form.initialValues[startFieldName]) {
              form.setInitialValuesIn([startFieldName], startDateValue);
            }
            if (!form.initialValues[endFieldName]) {
              form.setInitialValuesIn([endFieldName], endDataValue);
            }
          }
        }, [ctx.form, ctx.service?.data?.data, ctx.service?.loading]);
        return {
          form: ctx.form,
        };
      };
      const BigCalendar = reactBigCalendar?.BigCalendar;
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
              eventPropGetter={eventPropGetter}
              view={view}
              views={Weeks}
              date={date}
              step={60}
              showMultiDayTimes
              messages={messages}
              onNavigate={setDate}
              onView={setView}
              onSelectSlot={(slotInfo) => {
                setCurrentSelectDate(slotInfo);
                if (canCreate && enableQuickCreateEvent) {
                  insertAddNewer(addNew);
                  setVisibleAddNewer(true);
                }
              }}
              onDoubleClickEvent={() => {
                console.log('onDoubleClickEvent');
              }}
              onSelectEvent={(event) => {
                const record = dataSource?.find((item) => item[fieldNames.id] === event.id);
                if (!record) {
                  return;
                }
                record.__event = {
                  ...omit(event, 'title'),
                  start: formatDate(dayjs(event.start)),
                  end: formatDate(dayjs(event.end)),
                };

                setRecord(record);
                openPopup({
                  recordData: record,
                  customActionSchema: findEventSchema(fieldSchema),
                });
              }}
              formats={{
                monthHeaderFormat: 'yyyy-M',
                agendaDateFormat: 'M-dd',
                dayHeaderFormat: 'yyyy-M-dd',
                dayRangeHeaderFormat: ({ start, end }, culture, local) => {
                  if (eq(start, end, 'month')) {
                    return local.format(start, 'yyyy-M', culture);
                  }
                  return `${local.format(start, 'yyyy-M', culture)} - ${local.format(end, 'yyyy-M', culture)}`;
                },
              }}
              components={components}
              localizer={localizer}
            />
          </PopupContextProvider>
          <ActionContextProvider
            value={{
              ...ctx,
              visible: visibleAddNewer,
              setVisible: setVisibleAddNewer,
              openMode: findEventSchema(fieldSchema)?.['x-component-props']?.['openMode'],
            }}
          >
            <CollectionProvider name={collection.name}>
              <SchemaComponentOptions scope={{ useCreateFormBlockProps }}>
                <NocoBaseRecursionField
                  onlyRenderProperties
                  basePath={field?.address}
                  schema={fieldSchema}
                  filterProperties={(s) => {
                    return s['x-component'] === 'AssociationField.AddNewer';
                  }}
                />
              </SchemaComponentOptions>
            </CollectionProvider>
          </ActionContextProvider>
        </div>,
      );
    },
    { displayName: 'Calendar' },
  ),
);
