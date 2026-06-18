/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FlowModel } from '@nocobase/flow-engine';
import { AIEmployeeShortcut } from '../../ai-employees/AIEmployeeShortcut';
import type { AIEmployee, ContextItem, Task } from '../../ai-employees/types';

type ShortcutStyle = {
  size?: number;
  mask?: boolean;
};

export type AIEmployeeShortcutModelProps = {
  aiEmployee: Pick<AIEmployee, 'username'> & Partial<AIEmployee>;
  tasks?: Task[];
  showNotice?: boolean;
  builtIn?: boolean;
  style?: ShortcutStyle;
  context?: {
    workContext?: ContextItem[];
  };
  auto?: boolean;
};

export class AIEmployeeShortcutModel extends FlowModel {
  declare props: AIEmployeeShortcutModelProps;

  render() {
    const { style, ...props } = this.props;
    return <AIEmployeeShortcut {...props} size={style?.size} mask={style?.mask} />;
  }
}

export class AIEmployeeButtonModel extends AIEmployeeShortcutModel {
  render() {
    const { style, ...props } = this.props;
    return <AIEmployeeShortcut {...props} size={style?.size ?? 40} mask={style?.mask ?? false} />;
  }
}
