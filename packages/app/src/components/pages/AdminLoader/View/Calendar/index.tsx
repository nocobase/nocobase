import React, { useEffect, useRef, useState } from 'react';
import { Table as AntdTable, Card, Pagination } from 'antd';
import { useRequest, useHistory } from 'umi';
import api from '@/api-client';
import { LoadingOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import './style.less';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar'
import * as dates from 'react-big-calendar/lib/utils/dates';
import moment from 'moment';
const localizer = momentLocalizer(moment) // or globalizeLocalizer
import Drawer from '@/components/pages/AdminLoader/Drawer';
import { Details, DetailsPage } from '../Table';
import { Actions } from '../../Actions';

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
    start: moment(item[startDateField||'createdAt'] || item.created_at).toDate(),
    end: moment(item[endDateField || startDateField || 'createdAt'] || item.created_at).toDate(),
  }));
}

export function Calendar(props: CalendarProps) {
  const {
    schema = {},
    associatedKey,
    defaultFilter,
  } = props;

  const paginated = false;

  const { rowKey = 'id',
    filter: schemaFilter,
    sort,
    appends, 
    resourceName, 
    labelField,
    startDateField,
    endDateField,
    detailsOpenMode,
    details = [],
    actions = [],
  } = schema;

  console.log({schema})

  const [calendarView, setCalendarView] = useState('month');

  const history = useHistory();

  const { data, loading, mutate, refresh, run, params } = useRequest((params = {}, ...args) => {
    const { current, pageSize, sorter, filter, ...restParams } = params;
    console.log('paramsparamsparamsparamsparams', params, args);
    return api.resource(resourceName).list({
      associatedKey,
      page: paginated ? current : 1,
      perPage: paginated ? pageSize : -1,
      sorter,
      sort,
      'fields[appends]': appends,
      // filter,
      // ...actionDefaultParams,
      filter: {
        and: [
          defaultFilter,
          schemaFilter,
          filter,
          // __parent ? {
          //   collection_name: __parent,
          // } : null,
        ].filter(obj => obj && Object.keys(obj).length)
      }
      // ...args2,
    })
    .then(({data = [], meta = {}}) => {
      return {
        data: {
          list: data,
          total: meta.count||data.length,
        },
      };
    });
  }, {
    paginated,
  });

  const events = toEvents(data?.list, {
    idField: rowKey,
    labelField,
    startDateField,
    endDateField,
  });

  const messages = {
    allDay: '',
    previous: <div><LeftOutlined /></div>,
    next: <div><RightOutlined/></div>,
    today: '今天',
    month: '月',
    week: '周',
    day: '天',
    agenda: '列表',
    date: '日期',
    time: '时间',
    event: '事件',
    noEventsInRange: '无',
    showMore: (count) => `还有 ${count} 项`
  }


  console.log('events', data)
  return (
    <Card bordered={false}>
      <Actions associatedKey={associatedKey} onTrigger={{
          async create(values) {
            await refresh();
          },
          async filter(values) {
            const items = values.filter.and || values.filter.or;
            // @ts-ignore
            run({...params[0], filter: values.filter});
            // refresh();
          },
        }} actions={actions} style={{ 
          position: 'absolute',
          left: '157px',
          right: '168px',
          marginBottom: 14 
        }}/>
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
            return `${local.format(start, 'Y年M月', culture)} - ${local.format(end, 'Y年M月', culture)}`;
          }
        }}
        events={events}
        onSelectSlot={(slotInfo) => {
          // setFormMode('create');
          // drawerRef.current.setVisible(true);
          // console.log('onSelectSlot', slotInfo)
        }}
        onView={(view) => {
          setCalendarView(view);
          console.log(view)
        }}
        onSelectEvent={(data) => {
          console.log({data});
          if (!detailsOpenMode || !details.length) {
            return;
          }
          if (detailsOpenMode === 'window') {
            const paths = history.location.pathname.split('/');
            history.push(`/admin/${paths[2]}/${data[rowKey]}/0`);
          } else {
            Drawer.open({
              headerStyle: details.length > 1 ? {
                paddingBottom: 0,
                borderBottom: 0,
                // paddingTop: 16,
                // marginBottom: -4,
              } : {},
              // title: details.length > 1 ? undefined : data[labelField],
              title: data.title,
              bodyStyle: {
                // padding: 0,
              },
              content: ({resolve, closeWithConfirm}) => (
                <div>
                  <Details 
                    associatedKey={associatedKey} 
                    resourceName={resourceName} 
                    onFinish={async () => {
                      await refresh();
                      resolve();
                    }}
                    onValueChange={() => {
                      closeWithConfirm && closeWithConfirm(true);
                    }}
                    onDraft={async () => {
                      await refresh();
                      resolve();
                    }}
                    onReset={resolve}
                    onDataChange={async () => {
                      await refresh();
                    }}
                    data={data}
                    resolve={resolve}
                    items={details}
                  />
                </div>
              ),
            });
          }
        }}
        onRangeChange={(range) => {
          console.log({range})
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
