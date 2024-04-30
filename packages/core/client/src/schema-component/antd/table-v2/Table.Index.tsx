/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useRecordIndex } from '../../../record-provider';

export const TableIndex = (props) => {
  const recordIndex = useRecordIndex();
  return <div>{recordIndex + 1}</div>;
};
