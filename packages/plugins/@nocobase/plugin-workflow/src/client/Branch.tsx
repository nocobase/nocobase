/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useGetAriaLabelOfAddButton } from './hooks/useGetAriaLabelOfAddButton';
import { Node } from './nodes';
import { Branch as SharedBranch } from '../client-v2/canvas/Branch';

export { useBranchContext, useBranchIndex } from './BranchContext';

export function Branch({
  from = null,
  entry = null,
  branchIndex = null,
  controller = null,
  className,
  end = null,
  addable = true,
  syncOnly = false,
  start = false,
  startTitle,
  dashed = false,
}: {
  from?: any;
  entry?: any;
  branchIndex?: number | null;
  controller?: React.ReactNode;
  className?: string;
  end?: true | React.ReactNode | null;
  addable?: boolean;
  syncOnly?: boolean;
  start?: boolean;
  startTitle?: React.ReactNode;
  dashed?: boolean;
}) {
  const { getAriaLabel } = useGetAriaLabelOfAddButton(from, branchIndex);

  return (
    <SharedBranch
      from={from}
      entry={entry}
      branchIndex={branchIndex}
      controller={controller}
      className={className}
      end={end}
      addable={addable}
      syncOnly={syncOnly}
      start={start}
      startTitle={startTitle}
      dashed={dashed}
      NodeComponent={Node}
      addButtonAriaLabel={getAriaLabel()}
    />
  );
}
