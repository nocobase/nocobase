/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { castArray } from 'lodash';

export const normalizeFieldIndexChain = (fieldIndex: unknown): string[] => {
  return castArray(fieldIndex)
    .filter((value) => value !== null && value !== undefined && value !== '')
    .map((value) => String(value));
};

export const buildDisplaySubListForkKey = ({
  parentFieldIndex,
  index,
  blockPage,
}: {
  parentFieldIndex: string[];
  index: number;
  blockPage: number;
}): string => {
  const parentKey = parentFieldIndex.length > 0 ? parentFieldIndex.join('|') : 'root';
  return `row_${parentKey}_${index}_${blockPage}`;
};
