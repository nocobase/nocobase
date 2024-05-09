/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Chart } from '../chart';

export class AntdChart extends Chart {
  getReference() {
    return {
      title: this.title,
      link: `https://ant.design/components/${this.name}`,
    };
  }
}
