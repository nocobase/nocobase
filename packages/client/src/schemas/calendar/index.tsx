import React from 'react';
import {
  Calendar as BigCalendar,
  Views,
  momentLocalizer,
} from 'react-big-calendar';
import moment from 'moment';
import * as dates from 'react-big-calendar/lib/utils/dates';
import { navigate } from 'react-big-calendar/lib/utils/constants';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Space, Button, Radio, Select } from 'antd';
import './style2.less';
import { observer, useField } from '@formily/react';
import { DesignableBar } from './DesignableBar';

const localizer = momentLocalizer(moment);

moment.locale('zh-CN');

const allViews = Object.keys(Views).map((k) => Views[k]);

interface ToolbarProps {
  localizer?: any;
  label?: any;
  view?: any;
  views?: any;
  onNavigate?: (action: string) => void;
  onView?: (view: string) => void;
}

function Toolbar(props: ToolbarProps) {
  const {
    label,
    views,
    view,
    onNavigate,
    onView,
    localizer: { messages },
  } = props;
  return (
    <div style={{ marginBottom: 8 }}>
      <Space>
        <Button
          onClick={() => {
            onNavigate(navigate.TODAY);
          }}
        >
          今天
        </Button>
        <div className="ant-btn-group">
          <Button
            icon={<LeftOutlined />}
            onClick={() => onNavigate(navigate.PREVIOUS)}
          ></Button>
          <Button
            icon={<RightOutlined />}
            onClick={() => onNavigate(navigate.NEXT)}
          ></Button>
        </div>
        <div style={{ fontSize: '1.75em', fontWeight: 300 }}>{label}</div>
      </Space>
      <Space style={{ float: 'right' }}>
        <Select value={view} onChange={onView}>
          {views.map((name) => (
            <Select.Option value={name}>{messages[name]}</Select.Option>
          ))}
        </Select>
        <Button>筛选</Button>
        <Button type={'primary'}>新增</Button>
      </Space>
    </div>
  );
}

export const Calendar: any = observer((props: any) => {
  const field = useField<Formily.Core.Models.ArrayField>();
  return (
    <div style={{ height: 700 }}>
      <BigCalendar
        popup
        selectable
        events={field.value || []}
        views={allViews}
        step={60}
        showMultiDayTimes
        messages={{
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
          work_week: '工作日',
          day: '天',
          agenda: '列表',
          date: '日期',
          time: '时间',
          event: '事件',
          noEventsInRange: '无',
          showMore: (count) => `还有 ${count} 项`,
        }}
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
        defaultDate={new Date(2015, 3, 1)}
        components={{
          toolbar: Toolbar,
        }}
        localizer={localizer}
      />
    </div>
  );
});

Calendar.DesignableBar = DesignableBar;
