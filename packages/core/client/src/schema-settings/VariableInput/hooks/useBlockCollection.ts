/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useDataBlockProps } from '../../../data-source/data-block/DataBlockProvider';

export const useBlockCollection = () => {
  const blockProps = useDataBlockProps();
  const name: string = blockProps?.collection || blockProps?.resource;

  return { name };
};
