/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ApartmentOutlined } from '@ant-design/icons';
import { Instruction } from '@nocobase/plugin-workflow/client-v2';
import { tExpr } from '../locale';

export const PARALLEL_INSTRUCTION_TYPE = 'parallel';

export default class ParallelInstruction extends Instruction {
  type = PARALLEL_INSTRUCTION_TYPE;
  title = tExpr('Parallel branch');
  group = 'control';
  description = tExpr('Run multiple branch processes in parallel.');
  icon = (<ApartmentOutlined />);
  branching = true;

  createDefaultConfig() {
    return {
      mode: 'all',
    };
  }

  FieldsetLoader = () => import('./components/parallel').then((module) => ({ default: module.ParallelFieldset }));
  ComponentLoader = () =>
    import('./components/parallel').then((module) => ({ default: module.ParallelCanvasComponent }));
}
