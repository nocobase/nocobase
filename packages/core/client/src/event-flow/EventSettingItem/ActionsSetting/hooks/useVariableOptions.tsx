/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCompile } from '@nocobase/client';
import { useMemo } from 'react';
import { useEvent } from '../../../hooks/useEvent';
import { EventParam } from '../../../types';

export const useVariableOptions = () => {
  const { definitions } = useEvent();
  const compile = useCompile();
  const opts = useMemo(() => {
    const options = [];
    const state2Variables = (state: EventParam) => {
      const children = [];
      if (state.properties) {
        Object.keys(state.properties).forEach((key) => {
          children.push(state2Variables(state.properties[key]));
        });
      }
      return {
        label: compile(state?.uiSchema?.title || state.title),
        value: state.name,
        children: children,
      };
    };
    options.push({
      label: '组件数据',
      value: '$_state',
      children: definitions
        .filter((def) => def.uid && def.states)
        .map((def) => ({
          label: `${def?.title}-${def.uid}`,
          value: `${def.uid}`,
          children: Object.keys(def.states).map((key) => state2Variables({ name: `${key}`, ...def.states[key] })),
        })),
    });
    return options;
  }, [definitions, compile]);
  return opts;
};
