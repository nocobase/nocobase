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
import { EventDefinition, EventSetting } from '../types';

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
    title: module.title + ' - ' + module.uid,
    selectable: false,
    children:
      module?.events?.map((event) => ({
        value: `${module.name}.${event.name}${module.uid ? `.${module.uid}` : ''}`,
        title: event.title,
      })) || [],
  }));
  treeData = treeData?.filter((item) => item.children.length > 0);

  const selectedEvent = useMemo(() => {
    if (!state) return undefined;
    return `${state.definition}.${state.event}${state.uid ? `.${state.uid}` : ''}`;
  }, [state]);

  return (
    <TreeSelect
      value={selectedEvent}
      dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
      placeholder="Please select"
      allowClear
      treeDefaultExpandAll
      onChange={(value) => {
        console.log('value', value);
        const [definition, event, uid] = (value as any).split('.');
        setState({
          definition,
          event,
          uid,
        });
      }}
      treeData={treeData}
      className={className}
    />
  );
}
