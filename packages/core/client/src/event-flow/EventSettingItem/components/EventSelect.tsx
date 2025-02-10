/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { useControllableValue } from 'ahooks';
import { Card, Space, TreeSelect } from 'antd';
import { EventDefinition, EventSetting } from '../../types';

export default function EventSelect(props: {
  definitions?: EventDefinition[];
  value?: EventSetting['event'];
  onChange?: (v: EventSetting['event']) => void;
  className?: string;
}) {
  const { definitions, className } = props;
  const [state, setState] = useControllableValue<EventSetting['event']>(props, {
    defaultValue: undefined,
  });

  let treeData = definitions?.map((module) => ({
    value: module.name,
    title: module.title + ' - ' + module.blockUid,
    selectable: false,
    children:
      module?.events?.map((event) => ({
        value: `${module.pageUid || ''}.${module.blockUid || ''}.${module.name}.${event.name}`,
        title: event.title,
      })) || [],
  }));
  treeData = treeData?.filter((item) => item.children.length > 0);

  const selectedEvent = useMemo(() => {
    if (!state) return undefined;
    return `${state.pageUid || ''}.${state.blockUid || ''}.${state.definition}.${state.event}`;
  }, [state]);

  return (
    <TreeSelect
      value={selectedEvent}
      dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
      placeholder="选择事件"
      allowClear
      treeDefaultExpandAll
      onChange={(value) => {
        if (!value) {
          setState(undefined);
          return;
        }
        const [pageUid, blockUid, definition, event] = value?.split('.') || [];
        setState({
          pageUid,
          blockUid,
          definition,
          event,
        });
      }}
      treeData={treeData}
      className={className}
    />
  );
}
