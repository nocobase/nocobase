/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection } from '../../data-source/collection/Collection';

export interface DeclareVariableProps {
  /* 变量名称 */
  name: string;
  /** 变量值 */
  value: any;
  /** 显示给用户的名字 */
  title?: string;
  /** 变量对应的数据表信息 */
  collection?: Collection;
}
