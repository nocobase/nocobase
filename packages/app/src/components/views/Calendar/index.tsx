import React, { useEffect, useRef, useState } from 'react';
import { Table as AntdTable, Card, Pagination } from 'antd';
import { Actions } from '@/components/actions';
import { redirectTo } from '@/components/pages/CollectionLoader/utils';
import ViewFactory from '@/components/views';
import { useRequest } from 'umi';
import api from '@/api-client';
import { components, fields2columns } from '../SortableTable';
import {
  LoadingOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import './style.less';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import * as dates from 'react-big-calendar/lib/utils/dates';
import moment from 'moment';
const localizer = momentLocalizer(moment); // or globalizeLocalizer

export const icon = <LoadingOutlined style={{ fontSize: 36 }} spin />;

export interface CalendarProps {
  schema?: any;
  activeTab?: any;
  resourceName: string;
  associatedName?: string;
  associatedKey?: string;
  [key: string]: any;
}

// let weekRangeFormat = ({ start, end }, culture, local) =>
//   local.format(start, 'MMMM DD', culture) +
//   ' – ' +
//   local.format(end, dates.eq(start, end, 'month') ? 'DD' : 'MMMM DD', culture)

function toEvents(data, options: any = {}) {
  const { startDateField, endDateField, labelField, idField = 'id' } = options;
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map(item => ({
    id: item[idField],
    title: item[labelField],
    allDay: true,
    start: moment(
      item[startDateField || 'createdAt'] || item.created_at,
    ).toDate(),
    end: moment(
      item[endDateField || startDateField || 'createdAt'] || item.created_at,
    ).toDate(),
  }));
}

export function Calendar(props: CalendarProps) {
  console.log(props);
  const {
    activeTab = {},
    pageInfo = {},
    schema,
    resourceName,
    associatedName,
    associatedKey,
    isFieldComponent,
    onSelected,
    multiple = true,
    selectedRowKeys: srk,
  } = props;
  const {
    rowKey = 'id',
    mode,
    defaultTabName,
    labelField,
    startDateField,
    endDateField,
    name: viewName,
    actionDefaultParams = {},
    fields = [],
    rowViewName,
    actions = [],
    paginated = true,
    defaultPerPage = 10,
  } = schema;
  const { filter: defaultFilter = {} } = actionDefaultParams;
  const { sourceKey = 'id' } = activeTab.field || {};
  const drawerRef = useRef<any>();
  const [filterCount, setFilterCount] = useState(0);
  const name = associatedName
    ? `${associatedName}.${resourceName}`
    : resourceName;
  const {
    data,
    loading,
    pagination,
    mutate,
    refresh,
    params,
    run,
  } = useRequest(
    (params = {}) => {
      const { current, pageSize, sorter, filter, ...restParams } = params;
      return api
        .resource(name)
        .list({
          associatedKey,
          // page: paginated ? current : 1,
          perPage: -1,
          sorter,
          // filter,
          viewName,
          ...actionDefaultParams,
          filter: {
            and: [defaultFilter, filter].filter(
              obj => obj && Object.keys(obj).length,
            ),
          },
        })
        .then(({ data = [], meta = {} }) => {
          return {
            data: {
              list: data,
              total: meta.count || data.length,
            },
          };
        });
    },
    {
      paginated,
      defaultPageSize: defaultPerPage,
    },
  );
  console.log(schema, data);
  const [selectedRowKeys, setSelectedRowKeys] = useState(srk || []);
  const onChange = (
    selectedRowKeys: React.ReactText[],
    selectedRows: React.ReactText[],
  ) => {
    setSelectedRowKeys(selectedRowKeys);
    onSelected && onSelected(selectedRows);
  };
  const [formMode, setFormMode] = useState('update');
  const [calendarView, setCalendarView] = useState('month');
  useEffect(() => {
    setSelectedRowKeys(srk);
  }, [srk]);
  const tableProps: any = {};
  if (actions.length) {
    tableProps.rowSelection = {
      type: multiple ? 'checkbox' : 'radio',
      selectedRowKeys,
      onChange,
    };
  }

  const events = toEvents(data?.list, {
    idField: rowKey,
    labelField,
    startDateField,
    endDateField,
  });

  const messages = {
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
    today: '今天',
    month: '月',
    week: '周',
    day: '天',
    agenda: '列表',
    date: '日期',
    time: '时间',
    event: '事件',
    noEventsInRange: '无',
    showMore: count => `还有 ${count} 项`,
  };

  console.log('events', data);
  return (
    <Card bordered={false}>
      {/* <Actions
        {...props}
        style={{ marginBottom: 14 }}
        actions={actions}
        filterCount={filterCount}
        onFinish={() => {
          refresh();
        }}
        onTrigger={{
          async filter(values) {
            console.log('filter', values);
            const items = values.filter.and || values.filter.or;
            setFilterCount(Object.keys(items).length);
            // @ts-ignore
            run({...params[0], filter: values.filter});
          },
          async destroy() {
            await api.resource(name).destroy({
              associatedKey,
              filter: {
                [`${rowKey}.in`]: selectedRowKeys,
              },
            });
            await refresh();
            // @ts-ignore
            window.routesReload && window.routesReload();
            console.log('destroy.onTrigger', selectedRowKeys);
          },
        }}
      /> */}
      <ViewFactory
        {...props}
        mode={formMode}
        viewName={rowViewName}
        reference={drawerRef}
        onFinish={() => {
          refresh();
        }}
      />
      <BigCalendar
        popup
        selectable
        className={`view-${calendarView}`}
        messages={messages as any}
        formats={{
          monthHeaderFormat: 'Y年M月',
          agendaDateFormat: 'M月DD日',
          dayHeaderFormat: 'Y年M月DD日',
          dayRangeHeaderFormat: ({ start, end }, culture, local) => {
            if (dates.eq(start, end, 'month')) {
              return local.format(start, 'Y年M月', culture);
            }
            return `${local.format(start, 'Y年M月', culture)} - ${local.format(
              end,
              'Y年M月',
              culture,
            )}`;
          },
        }}
        events={events}
        onSelectSlot={slotInfo => {
          // setFormMode('create');
          // drawerRef.current.setVisible(true);
          // console.log('onSelectSlot', slotInfo)
        }}
        onView={view => {
          setCalendarView(view);
          console.log(view);
        }}
        onSelectEvent={event => {
          console.log(event);
          if (isFieldComponent) {
            return;
          }
          setFormMode('update');
          drawerRef.current.setVisible(true);
          drawerRef.current.getData(event[rowKey]);

          if (mode === 'simple') {
            drawerRef.current.setVisible(true);
            drawerRef.current.getData(event[rowKey]);
          } else {
            redirectTo({
              ...props.match.params,
              [activeTab ? 'newItem' : 'lastItem']: {
                itemId: event[rowKey] || event.id,
                tabName: defaultTabName,
              },
            });
          }
          // drawerRef.current.
        }}
        onRangeChange={range => {
          console.log({ range });
        }}
        views={['month', 'week', 'day']}
        // step={120}
        // showMultiDayTimes
        // max={dates.add(dates.endOf(new Date(2015, 17, 1), 'day'), -1, 'hours')}
        // defaultDate={new Date(2015, 3, 1)}
        components={{
          timeGutterHeader: () => <div>全天</div>,
        }}
        localizer={localizer}
      />
    </Card>
  );
}
