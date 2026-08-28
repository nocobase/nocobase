/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Add-node preset field: "Move all downstream nodes to" (`downstreamBranchIndex`).
 * v2 mirror of v1's `DownstreamBranchIndex` (`client/AddNodeContext.tsx`). Shown
 * when a **branching** node is inserted **above an existing downstream node** —
 * the user chooses whether that downstream node stays after the branches
 * (`false`) or moves inside one of the new branches (a `branchIndex`).
 *
 * Returns null (renders nothing) when the node isn't branching or there's no
 * downstream node to move.
 */

import { Form } from 'antd';
import React from 'react';
import { useT } from '../locale';
import { RadioWithTooltip, type RadioWithTooltipOption } from '../components/RadioWithTooltip';
import type { Instruction } from './Instruction';

const DEFAULT_BRANCHING_OPTIONS = [{ value: 0 }];

export function getDownstreamBranchOptions({
  instruction,
  config,
  hasDownstream,
  t,
}: {
  instruction?: Instruction;
  config: Record<string, any>;
  hasDownstream: boolean;
  t: (key: string, options?: Record<string, any>) => string;
}): RadioWithTooltipOption[] {
  if (!instruction || !hasDownstream) {
    return [];
  }
  const branching =
    typeof instruction.branching === 'function' ? instruction.branching(config ?? {}) : instruction.branching;
  if (!branching) {
    return [];
  }
  const br = branching === true ? DEFAULT_BRANCHING_OPTIONS : branching;
  return [
    { label: t('After end of branches'), value: false },
    ...br.map((item: any) => ({
      ...item,
      label: item.label ? t('Inside of "{{branchName}}" branch', { branchName: t(item.label) }) : t('Inside of branch'),
    })),
  ];
}

export default function DownstreamBranchIndex({ options }: { options: RadioWithTooltipOption[] }) {
  const t = useT();
  if (!options.length) {
    return null;
  }
  return (
    <Form.Item
      name="downstreamBranchIndex"
      label={t('Move all downstream nodes to')}
      rules={[{ required: true }]}
      initialValue={false}
    >
      <RadioWithTooltip options={options} direction="vertical" />
    </Form.Item>
  );
}
