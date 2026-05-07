/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { ActionModel, CollectionActionGroupModel, Icon } from '@nocobase/client';
import { observer, tExpr, useFlowModel, type FlowModelContext } from '@nocobase/flow-engine';
import { Button, Segmented, Typography } from 'antd';
import React, { useMemo } from 'react';
import { useTranslation } from '../../../locale';
import { getLunarDay } from '../../calendar/utils';
import { useCalendarViewContext } from '../components/CalendarViewContext';
import dayjs from 'dayjs';

const FILTERED_ACTION_MODEL_NAMES = new Set([
  'DeleteActionModel',
  'BulkDeleteActionModel',
  'BulkEditActionModel',
  'BulkUpdateActionModel',
  'ImportActionModel',
  'ExportActionModel',
  'PrintActionModel',
]);

const CALENDAR_ACTION_ORDER = [
  'CalendarTodayActionModel',
  'CalendarNavActionModel',
  'CalendarTitleActionModel',
  'CalendarViewSelectActionModel',
];

const CALENDAR_ACTION_ORDER_MAP = new Map(CALENDAR_ACTION_ORDER.map((name, index) => [name, index]));

const shouldFilterActionItem = (item: any) => {
  if (FILTERED_ACTION_MODEL_NAMES.has(item.useModel)) {
    return true;
  }

  const identity = [item.key, item.useModel, typeof item.label === 'string' ? item.label : '']
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return identity.includes('print');
};

const CalendarTodayAction = observer(() => {
  const model = useFlowModel<CalendarTodayActionModel>();
  const calendarView = useCalendarViewContext();

  if (!calendarView) {
    return null;
  }

  const icon = model.getIcon() ? <Icon type={model.getIcon() as any} /> : undefined;

  return (
    <Button {...model.props} icon={icon} onClick={() => calendarView.navigate('TODAY')}>
      {model.props.children || model.getTitle()}
    </Button>
  );
});

const CalendarNavAction = observer(() => {
  const calendarView = useCalendarViewContext();

  if (!calendarView) {
    return null;
  }

  return (
    <Button.Group>
      <Button icon={<LeftOutlined />} onClick={() => calendarView.navigate('PREV')} />
      <Button icon={<RightOutlined />} onClick={() => calendarView.navigate('NEXT')} />
    </Button.Group>
  );
});

const CalendarTitleAction = observer(() => {
  const calendarView = useCalendarViewContext();

  const lunarLabel = useMemo(() => {
    if (!calendarView?.showLunar || calendarView.view !== 'day') {
      return null;
    }

    return getLunarDay(dayjs(calendarView.date));
  }, [calendarView]);

  if (!calendarView) {
    return null;
  }

  return (
    <Typography.Text strong style={{ fontSize: 16, lineHeight: 2 }}>
      {calendarView.label}
      {lunarLabel ? <span style={{ marginLeft: 8, fontWeight: 400 }}>{lunarLabel}</span> : null}
    </Typography.Text>
  );
});

const CalendarViewSelectAction = observer(() => {
  const calendarView = useCalendarViewContext();
  const { t } = useTranslation();

  if (!calendarView) {
    return null;
  }

  return (
    <Segmented
      value={calendarView.view}
      onChange={(value) => calendarView.setView(value as any)}
      options={calendarView.views.map((name) => ({
        label: t(name === 'month' ? 'Month' : name === 'week' ? 'Week' : 'Day'),
        value: name,
      }))}
    />
  );
});

export class CalendarCollectionActionGroupModel extends CollectionActionGroupModel {}

CalendarCollectionActionGroupModel.defineChildren = async function defineChildren(ctx: FlowModelContext) {
  const items = await CollectionActionGroupModel.defineChildren.call(this, ctx);
  return items
    .filter((item) => !shouldFilterActionItem(item))
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const leftOrder = CALENDAR_ACTION_ORDER_MAP.get(left.item.useModel);
      const rightOrder = CALENDAR_ACTION_ORDER_MAP.get(right.item.useModel);
      const leftIsCalendar = leftOrder !== undefined;
      const rightIsCalendar = rightOrder !== undefined;

      if (leftIsCalendar && rightIsCalendar) {
        return leftOrder - rightOrder;
      }

      if (leftIsCalendar) {
        return -1;
      }

      if (rightIsCalendar) {
        return 1;
      }

      return left.index - right.index;
    })
    .map(({ item }) => item);
};

export class CalendarTodayActionModel extends ActionModel {
  // static scene = 'collection' as const;

  defaultProps = {
    type: 'default' as const,
    title: tExpr('Today', { ns: 'calendar' }),
  };

  render() {
    return <CalendarTodayAction />;
  }
}

CalendarTodayActionModel.define({
  label: tExpr('Today', { ns: 'calendar' }),
  toggleable: true,
  sort: 10,
});

export class CalendarNavActionModel extends ActionModel {
  // static scene = 'collection' as const;

  enableEditTooltip = false;
  enableEditTitle = false;
  enableEditIcon = false;
  enableEditType = false;
  enableEditDanger = false;

  render() {
    return <CalendarNavAction />;
  }
}

CalendarNavActionModel.define({
  label: tExpr('Turn pages', { ns: 'calendar' }),
  toggleable: true,
  sort: 20,
});

export class CalendarTitleActionModel extends ActionModel {
  // static scene = 'collection' as const;

  enableEditTooltip = false;
  enableEditTitle = false;
  enableEditIcon = false;
  enableEditType = false;
  enableEditDanger = false;

  render() {
    return <CalendarTitleAction />;
  }
}

CalendarTitleActionModel.define({
  label: tExpr('Title', { ns: 'calendar' }),
  toggleable: true,
  sort: 30,
});

export class CalendarViewSelectActionModel extends ActionModel {
  // static scene = 'collection' as const;

  enableEditTooltip = false;
  enableEditTitle = false;
  enableEditIcon = false;
  enableEditType = false;
  enableEditDanger = false;

  render() {
    return <CalendarViewSelectAction />;
  }
}

CalendarViewSelectActionModel.define({
  label: tExpr('Select view', { ns: 'calendar' }),
  toggleable: true,
  sort: 40,
});

CalendarCollectionActionGroupModel.registerActionModels({
  CalendarTodayActionModel,
  CalendarNavActionModel,
  CalendarTitleActionModel,
  CalendarViewSelectActionModel,
});
