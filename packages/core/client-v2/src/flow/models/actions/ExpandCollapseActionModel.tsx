/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT, MultiRecordResource } from '@nocobase/flow-engine';
import { ActionModel, ActionSceneEnum } from '../base';
import { ButtonProps } from 'antd';

export class ExpandCollapseActionModel extends ActionModel {
  expandFlag: boolean;

  defaultProps: ButtonProps = {
    type: 'default',
    icon: 'DownOutlined',
  };

  static scene = ActionSceneEnum.collection;

  setTitle(title) {
    this.setProps({ title });
  }

  setExpandFlag(flag) {
    this.expandFlag = flag;
  }

  getTitle() {
    return this.expandFlag ? this.context.t('Collapse all') : this.context.t('Expand all');
  }
  getIcon() {
    return this.expandFlag ? 'NodeCollapseOutlined' : 'NodeExpandOutlined';
  }
}

function getIdsWithChildren(data, { idKey = 'id', childrenKey = 'children' } = {}) {
  const ids = [];

  function traverse(nodes) {
    if (!Array.isArray(nodes)) return;

    for (const node of nodes) {
      const children = node[childrenKey];
      ids.push(node[idKey]); // 当前节点有子节点，记录它
      if (Array.isArray(children) && children.length > 0) {
        traverse(children); // 递归处理子节点
      }
    }
  }

  traverse(data);
  return ids;
}

const allIncludesChildren = (data) => {
  const keys = getIdsWithChildren(data);
  return keys;
};
ExpandCollapseActionModel.registerFlow({
  key: 'expandCollapseSettingsInit',
  sort: 200,
  steps: {
    init: {
      handler(ctx, params) {
        if (ctx.blockModel.props.defaultExpandAllRows) {
          ctx.model.setExpandFlag(true);
        } else {
          ctx.model.setExpandFlag(false);
        }
      },
    },
  },
});
ExpandCollapseActionModel.registerFlow({
  key: 'expandCollapseSettings',
  on: 'click',
  steps: {
    expandCollapse: {
      async handler(ctx, params) {
        if (!ctx.blockModel?.resource) {
          return;
        }
        const resource = ctx.blockModel.resource as MultiRecordResource;
        const { treeTable } = ctx.blockModel.props;
        if (treeTable) {
          if (!ctx.model.expandFlag) {
            const ids = allIncludesChildren(resource.getData());
            ctx.blockModel.setProps({
              expandedRowKeys: ids,
            });
            ctx.model.setExpandFlag(true);
          } else {
            ctx.blockModel.setProps({
              expandedRowKeys: [],
            });
            ctx.model.setExpandFlag(false);
          }
        }
      },
    },
  },
});

ExpandCollapseActionModel.define({
  label: escapeT('Expand/Collapse'),
  hide(ctx) {
    return ctx.collection?.template !== 'tree' || ctx.model.props.treeTable === false;
  },
});
