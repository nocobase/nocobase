/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient, useApp, useLazy } from '@nocobase/client';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { get, omit } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-big-calendar';
import { dateFnsLocalizer } from 'react-big-calendar';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import ru from 'date-fns/locale/ru';
import zhCN from 'date-fns/locale/zh-CN';
import { observer } from '@nocobase/flow-engine';
import { getLabelFormatValue } from '@nocobase/client';
import { i18nt, useTranslation } from '../../../locale';
import GlobalStyle from '../../calendar/global.style';
import { useCalenderHeight } from '../../calendar/hook';
import useBaseStyle from '../../calendar/style';
import { theme } from 'antd';
import {
  CALENDAR_RANGE_FILTER_GROUP,
  createCalendarRangeFilter,
  formatDate,
  getCalendarVisibleRange,
  normalizeCalendarFieldPath,
} from '../utils';
import { CalendarHeader } from './CalendarHeader';
import { CalendarViewProvider, type CalendarNavigationAction } from './CalendarViewContext';
import useStyle from './style';

type CalendarCulture = keyof typeof LOCALES;

type LocalizerFormatContext = {
  format: (value: Date, formatStr: string, culture?: string) => string;
};

interface Event {
  id: string;
  colorFieldValue: string;
  title: string;
  rawTitle?: string;
  start: Date;
  end: Date;
}

const WEEKS = ['month', 'week', 'day'] as View[];
const LOCALES = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ru-RU': ru,
};

const useCalendarEvents = (
  dataSource: any,
  fieldNames: {
    colorFieldName: string;
    start: string;
    end: string;
    id: string;
    title: string;
  },
  date: Date,
  view: (typeof WEEKS)[number] | string,
  collection: any,
  weekStart?: number,
) => {
  const parseExpression = useLazy<typeof import('cron-parser').parseExpression>(
    () => import('cron-parser'),
    'parseExpression',
  );
  const { t } = useTranslation();
  const app = useApp();
  const plugin = app.pm.get('calendar') as any;
  const activeCollection = collection;
  const getCollectionField = useCallback(
    (fieldName?: string) => {
      const normalizedFieldName = normalizeCalendarFieldPath(fieldName);
      if (!normalizedFieldName) {
        return undefined;
      }

      return activeCollection?.getField?.(normalizedFieldName);
    },
    [activeCollection],
  );
  const titleCollectionField = getCollectionField(fieldNames?.title);
  const labelUiSchema = titleCollectionField?.uiSchema;
  const visibleRange = useMemo(() => getCalendarVisibleRange(date, view, weekStart), [date, view, weekStart]);
  const rangeStart = visibleRange.start;
  const rangeEnd = visibleRange.end;

  return useMemo(() => {
    if (!Array.isArray(dataSource)) {
      return { events: [] as Event[] };
    }

    const events: Event[] = [];
    const startDate = dayjs(rangeStart);
    const endDate = dayjs(rangeEnd);

    dataSource.forEach((item) => {
      const { cron, exclude = [] } = item;
      const start = dayjs(get(item, fieldNames.start) || dayjs());
      const end = dayjs(get(item, fieldNames.end) || start);
      const intervalTime = end.diff(start, 'millisecond', true);

      const push = (eventStart: Dayjs = start.clone()) => {
        if (
          eventStart.isBefore(start) ||
          (!eventStart.isBetween(startDate, endDate, null, '[]') && !end.isBetween(startDate, endDate, null, '[]'))
        ) {
          return;
        }

        let out = false;
        const res = exclude?.some((value: string) => {
          let dateValue = value;
          if (dateValue.endsWith('_after')) {
            dateValue = dateValue.replace(/_after$/, '');
            out = true;
            return eventStart.isSameOrAfter(dateValue);
          }
          return eventStart.isSame(dateValue);
        });

        if (res) {
          return out;
        }

        const targetTitleCollectionField = getCollectionField(fieldNames.title);
        const targetTitle = targetTitleCollectionField?.interface
          ? plugin.getTitleFieldInterface(targetTitleCollectionField.interface)
          : null;
        const title = getLabelFormatValue(
          labelUiSchema,
          get(item, fieldNames.title),
          true,
          targetTitleCollectionField,
          targetTitle?.TitleRenderer,
        );

        events.push({
          id: get(item, fieldNames.id || 'id'),
          colorFieldValue: get(item, fieldNames.colorFieldName),
          title: title || t('Untitle'),
          start: eventStart.toDate(),
          end: eventStart.add(intervalTime, 'millisecond').toDate(),
          rawTitle: get(item, fieldNames.title),
        });
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
        push(start.clone().year(startDate.year()).month(startDate.month()));
      } else if (cron === 'every_year') {
        push(start.clone().year(startDate.year()));
      } else {
        push();
        if (!cron) {
          return;
        }
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
            if (push(dayjs(value.toDate()))) {
              break;
            }
          }
        } catch (error) {
          console.error(error);
        }
      }
    });

    return { events };
  }, [
    dataSource,
    fieldNames.colorFieldName,
    fieldNames.end,
    fieldNames.id,
    fieldNames.start,
    fieldNames.title,
    getCollectionField,
    labelUiSchema,
    parseExpression,
    plugin,
    rangeEnd,
    rangeStart,
    t,
  ]);
};

type CalendarBlockProps = {
  actionBar?: React.ReactNode;
  collection: any;
  dataSource: any[];
  defaultView?: View;
  fieldNames: {
    colorFieldName: string;
    start: string;
    end: string;
    id: string;
    title: string;
  };
  getBackgroundColor?: (value: string) => string | null;
  getFontColor?: (value: string) => string | null;
  onSelectEvent?: (payload: { event: Event; record: any }) => void;
  onSelectSlot?: (payload: any) => void;
  rangeLoadEnabled?: boolean;
  resource?: any;
  showLunar?: boolean;
  weekStart?: number;
};

export const CalendarBlock = observer((props: CalendarBlockProps) => {
  const reactBigCalendar = useLazy(
    () => import('react-big-calendar'),
    (module) => ({
      BigCalendar: module.Calendar,
    }),
  );
  const height = useCalenderHeight();
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<View>(props.defaultView || 'month');
  const rangeRefreshKeyRef = useRef<string>();
  const { events } = useCalendarEvents(
    props.dataSource,
    props.fieldNames,
    date,
    view,
    props.collection,
    props.weekStart,
  );
  const baseStyle = useBaseStyle();
  const overrideStyle = useStyle();
  const apiClient = useAPIClient();
  const locale = (
    LOCALES[apiClient.auth.locale as CalendarCulture] ? (apiClient.auth.locale as CalendarCulture) : 'en-US'
  ) as CalendarCulture;

  const formats = useMemo(() => {
    return {
      monthHeaderFormat: (value: Date, culture: string, local: LocalizerFormatContext) =>
        local.format(
          value,
          culture === 'zh-CN' ? 'yyyy年M月' : culture === 'ru-RU' ? 'LLLL yyyy' : 'MMM yyyy',
          culture,
        ),
      agendaDateFormat: (value: Date, culture: string, local: LocalizerFormatContext) => {
        return local.format(
          value,
          culture === 'zh-CN' ? 'yyyy年M月' : culture === 'ru-RU' ? 'LLLL yyyy' : 'MMM yyyy',
          culture,
        );
      },
      dayHeaderFormat: (value: Date, culture: string, local: LocalizerFormatContext) => {
        return local.format(
          value,
          culture === 'zh-CN' ? 'eee, M/d' : culture === 'ru-RU' ? 'EEE, d MMM' : 'EEE, MMM d',
          culture,
        );
      },
      dayRangeHeaderFormat: (
        { start, end }: { start: Date; end: Date },
        culture: string,
        local: LocalizerFormatContext,
      ) => {
        if (start.getMonth() === end.getMonth()) {
          return local.format(
            start,
            culture === 'zh-CN' ? 'yyyy年M月' : culture === 'ru-RU' ? 'LLLL yyyy' : 'MMM yyyy',
            culture,
          );
        }
        return `${local.format(
          start,
          culture === 'zh-CN' ? 'yyyy年M月' : culture === 'ru-RU' ? 'LLLL yyyy' : 'MMM yyyy',
          culture,
        )} - ${local.format(
          end,
          culture === 'zh-CN' ? 'yyyy年M月' : culture === 'ru-RU' ? 'LLLL yyyy' : 'MMM yyyy',
          culture,
        )}`;
      },
      weekdayFormat: (value: Date, culture: string, local: LocalizerFormatContext) => {
        return local.format(value, 'EEE', culture);
      },
    };
  }, []);

  const localizer = useMemo(() => {
    return dateFnsLocalizer({
      format,
      parse,
      startOfWeek: (value: Date) =>
        startOfWeek(value, {
          locale: LOCALES[locale],
          weekStartsOn: (props.weekStart ?? 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        }),
      getDay,
      locales: LOCALES,
    });
  }, [locale, props.weekStart]);

  useEffect(() => {
    setView(props.defaultView || 'month');
  }, [props.defaultView]);

  const visibleRange = useMemo(() => {
    return getCalendarVisibleRange(date, view, props.weekStart);
  }, [date, props.weekStart, view]);

  const label = useMemo(() => {
    if (view === 'day') {
      return formats.dayHeaderFormat(date, locale, localizer);
    }

    if (view === 'week') {
      return formats.dayRangeHeaderFormat(
        {
          start: visibleRange.start,
          end: visibleRange.end,
        },
        locale,
        localizer,
      );
    }

    return formats.monthHeaderFormat(date, locale, localizer);
  }, [date, formats, locale, localizer, view, visibleRange.end, visibleRange.start]);

  const navigate = useCallback(
    (action: CalendarNavigationAction) => {
      if (action === 'TODAY') {
        setDate(new Date());
        return;
      }

      const unit = view === 'month' ? 'month' : view === 'week' ? 'week' : 'day';
      const nextDate = dayjs(date)[action === 'PREV' ? 'subtract' : 'add'](1, unit).toDate();
      setDate(nextDate);
    },
    [date, view],
  );

  const viewContextValue = useMemo(() => {
    return {
      date,
      label,
      navigate,
      showLunar: props.showLunar,
      view,
      views: WEEKS,
      setView,
    };
  }, [date, label, navigate, props.showLunar, view]);

  useEffect(() => {
    if (!props.rangeLoadEnabled || !props.resource) {
      return;
    }

    const rangeFilter = createCalendarRangeFilter(props.fieldNames, visibleRange);
    const nextKey = JSON.stringify({
      fieldNames: props.fieldNames,
      view,
      start: visibleRange.start.toISOString(),
      end: visibleRange.end.toISOString(),
      rangeFilter,
    });

    if (rangeRefreshKeyRef.current === nextKey) {
      return;
    }

    rangeRefreshKeyRef.current = nextKey;

    if (rangeFilter) {
      props.resource.addFilterGroup(CALENDAR_RANGE_FILTER_GROUP, rangeFilter);
    } else {
      props.resource.removeFilterGroup(CALENDAR_RANGE_FILTER_GROUP);
    }

    props.resource.setPage?.(1);
    void props.resource.refresh();
  }, [props.fieldNames, props.rangeLoadEnabled, props.resource, view, visibleRange]);

  useEffect(() => {
    return () => {
      props.resource?.removeFilterGroup?.(CALENDAR_RANGE_FILTER_GROUP);
    };
  }, [props.resource]);

  const { token } = theme.useToken();

  const components = useMemo(() => {
    return {
      week: {
        header: (headerProps: any) => (
          <CalendarHeader
            {...headerProps}
            type="week"
            showLunar={props.showLunar}
            localizer={localizer}
            locale={locale}
          />
        ),
      },
      month: {
        dateHeader: (headerProps: any) => <CalendarHeader {...headerProps} showLunar={props.showLunar} />,
      },
    };
  }, [locale, localizer, props.showLunar]);

  const messages: any = {
    allDay: '',
    previous: i18nt('Previous'),
    next: i18nt('Next'),
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
    showMore: (count: number) => i18nt('{{count}} more items', { count }),
  };

  const eventPropGetter = (event: Event) => {
    if (!event.colorFieldValue) {
      return undefined;
    }

    const fontColor = props.getFontColor?.(event.colorFieldValue);
    const backgroundColor = props.getBackgroundColor?.(event.colorFieldValue);
    const style = {} as Record<string, string>;

    if (fontColor) {
      style.color = fontColor;
    }
    if (backgroundColor) {
      style.backgroundColor = backgroundColor;
    }

    return { style };
  };

  const BigCalendar = reactBigCalendar?.BigCalendar;
  if (!BigCalendar) {
    return null;
  }

  return baseStyle.wrapSSR(
    overrideStyle.wrapSSR(
      <CalendarViewProvider value={viewContextValue}>
        <div
          className={`${baseStyle.hashId} ${baseStyle.componentCls} ${overrideStyle.hashId} ${overrideStyle.componentCls}`}
          style={{
            height: height || 700,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            marginBottom: token.marginSM,
          }}
        >
          <GlobalStyle />
          {props.actionBar ? props.actionBar : null}
          <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
            <BigCalendar
              popup
              selectable
              toolbar={false}
              events={events}
              eventPropGetter={eventPropGetter}
              view={view}
              views={WEEKS}
              date={date}
              step={60}
              showMultiDayTimes
              messages={messages}
              onNavigate={setDate}
              onView={setView}
              onSelectSlot={(slotInfo: any) => {
                props.onSelectSlot?.(slotInfo);
              }}
              onSelectEvent={(event: Event & { resource?: unknown }) => {
                const record = props.dataSource?.find((item) => get(item, props.fieldNames.id || 'id') === event.id);
                if (!record) {
                  return;
                }
                props.onSelectEvent?.({
                  event: {
                    ...omit(event, 'resource'),
                    start: formatDate(dayjs(event.start)),
                    end: formatDate(dayjs(event.end)),
                  } as any,
                  record,
                });
              }}
              formats={formats}
              components={components}
              culture={locale}
              localizer={localizer}
              tooltipAccessor={(value: Event) => {
                return value.rawTitle ? value.rawTitle : '';
              }}
            />
          </div>
        </div>
      </CalendarViewProvider>,
    ),
  );
});
