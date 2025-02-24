/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/react';
import { Cascader } from 'antd';
import React, { useMemo } from 'react';
import { EventActionSetting } from '../../types';
import { useEvent } from '../../hooks/useEvent';
import { useControllableValue } from 'ahooks';

export const ActionSelect = observer((props: any) => {
  const { definitions } = useEvent();
  const [state, setState] = useControllableValue<EventActionSetting['action']>(props, {
    defaultValue: undefined,
  });

  let treeData = definitions?.map((definition) => ({
    value: `${definition.name}.${definition.blockUid}`,
    label: definition.title + '-' + definition.blockUid,
    children:
      definition?.actions?.map((action) => ({
        value: `${definition.pageUid || ''}.${definition.blockUid || ''}.${definition.name}.${action.name}`,
        label: action.title,
      })) || [],
  }));
  treeData = treeData?.filter((item) => item.children.length > 0);

  const { onChange, value, ...rest } = props;

  const selectedAction = useMemo(() => {
    if (!state) return undefined;
    return [
      `${state.definition}.${state.blockUid}`,
      `${state.pageUid || ''}.${state.blockUid || ''}.${state.definition}.${state.action}`,
    ];
  }, [state]);

  return (
    <Cascader
      placeholder="请选择动作"
      options={treeData}
      onChange={(value: any, selectedOptions: any) => {
        const v = value[1];
        if (v) {
          const [pageUid, blockUid, definition, action] = v.split('.');
          setState({ pageUid, blockUid, definition, action });
        } else {
          setState(undefined);
        }
      }}
      value={selectedAction}
      style={{ minWidth: 300 }}
      {...rest}
    />
  );
});
