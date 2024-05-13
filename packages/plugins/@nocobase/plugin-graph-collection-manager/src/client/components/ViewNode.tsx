/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NodeView } from '@antv/x6';

export class SimpleNodeView extends NodeView {
  protected renderMarkup() {
    return this.renderJSONMarkup({
      tagName: 'rect',
      selector: 'body',
    });
  }

  update() {
    const attrs = this.cell.getAttrs();
    const fill = attrs.hightLight ? '#1890ff' : 'gray';
    super.update({
      body: {
        refWidth: '50px',
        refHeight: '100px',
        fill: fill,
      },
    });
  }
}
