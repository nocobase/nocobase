/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel, ActionSceneEnum, CollectionActionGroupModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd';
import { tExpr } from '../../locale';

export class GanttCollectionActionGroupModel extends CollectionActionGroupModel {}

GanttCollectionActionGroupModel.define({
  label: tExpr('Gantt action'),
});

export class GanttExpandCollapseActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    title: tExpr('Expand/Collapse'),
    icon: 'NodeExpandOutlined',
  };

  getTitle() {
    return this.context.blockModel?.props?.hideChildren ? this.context.t('Expand all') : this.context.t('Collapse all');
  }

  getIcon() {
    return this.context.blockModel?.props?.hideChildren ? 'NodeExpandOutlined' : 'NodeCollapseOutlined';
  }
}

GanttExpandCollapseActionModel.define({
  label: tExpr('Expand/Collapse'),
  toggleable: true,
  sort: 50,
});

GanttExpandCollapseActionModel.registerFlow({
  key: 'expandCollapse',
  title: tExpr('Expand/Collapse'),
  on: 'click',
  steps: {
    toggle: {
      async handler(ctx) {
        const blockModel = ctx.blockModel as any;
        if (!blockModel) {
          return;
        }
        blockModel.setProps('hideChildren', !blockModel.props?.hideChildren);
        const resource = blockModel.resource as MultiRecordResource;
        if (resource) {
          resource.setSelectedRows([]);
        }
      },
    },
  },
});
