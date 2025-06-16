/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Drawer, Modal } from 'antd';
import React from 'react';

import type { ButtonProps } from 'antd';

const ANIMATION_DURATION = 300; // 动画持续时间

interface ActionModelProps extends ButtonProps {
  Component?: React.ComponentType<ButtonProps>;
  /**
   * 打开方式
   * @default 'popup'
   */
  openMode?: 'drawer' | 'modal' | 'subPage';
  /**
   * 弹窗尺寸
   * @default 'md'
   */
  popupSize?: 'small' | 'medium' | 'large';
  /**
   * 是否显示视图（弹窗或子页面）
   */
  showView?: boolean;
}

const SubPage = (props: any) => {
  return <>子页面内容</>;
};

export class ActionModel extends FlowModel<{ subModels: { view?: FlowModel } }> {
  declare props: ActionModelProps;
  private hideView = true;

  public openView(ctx: FlowContext) {
    this.setProps('showView', true);
    this.hideView = false;
  }

  private dispatchCloseViewEvent(event: React.MouseEvent) {
    this.dispatchEvent('onCloseView', { event });
    this.setProps('showView', false);

    setTimeout(() => {
      this.hideView = true;
    }, ANIMATION_DURATION);
  }

  private renderView() {
    const { openMode, popupSize, showView } = this.props;

    if (this.hideView) {
      return null;
    }

    if (!this.subModels.view) {
      const model = this.setSubModel('view', {
        use: 'ActionViewModel',
        props: {
          openMode,
          popupSize,
        },
      });
      model.save();
    }

    switch (openMode) {
      case 'drawer':
        return (
          <Drawer onClose={this.dispatchCloseViewEvent} open={showView}>
            <FlowModelRenderer key={this.subModels.view.uid} model={this.subModels.view} />
          </Drawer>
        );
      case 'modal':
        return (
          <Modal onClose={this.dispatchCloseViewEvent} open={showView}>
            <FlowModelRenderer key={this.subModels.view.uid} model={this.subModels.view} />
          </Modal>
        );
      case 'subPage':
        return (
          <SubPage onClose={this.dispatchCloseViewEvent} open={showView}>
            <FlowModelRenderer key={this.subModels.view.uid} model={this.subModels.view} />
          </SubPage>
        );
      default:
        return null;
    }
  }

  render() {
    const { Component = Button, ...props } = this.getProps() as ActionModelProps;
    return (
      <>
        <Component {...props} onClick={(event) => this.dispatchEvent('onClick', { event })} />
        {this.renderView()}
      </>
    );
  }
}

ActionModel.registerFlow({
  key: 'defaultProps',
  auto: true,
  title: '基础配置',
  steps: {
    editButton: {
      title: '编辑按钮',
      uiSchema: {
        title: {
          type: 'string',
          title: '标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        icon: {
          type: 'string',
          title: '图标',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: '搜索', value: 'SearchOutlined' },
            { label: '添加', value: 'PlusOutlined' },
            { label: '删除', value: 'DeleteOutlined' },
            { label: '编辑', value: 'EditOutlined' },
            { label: '设置', value: 'SettingOutlined' },
          ],
        },
        type: {
          type: 'string',
          title: '颜色',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: '主要', value: 'primary' },
            { label: '次要', value: 'default' },
            { label: '危险', value: 'danger' },
            { label: '虚线', value: 'dashed' },
            { label: '链接', value: 'link' },
            { label: '文本', value: 'text' },
          ],
        },
      },
      handler(ctx, params) {
        ctx.model.setProps(params);
      },
    },
    // linkageRules: {
    //   title: '联动规则',
    //   uiSchema: {},
    //   handler(ctx, params) {
    //     ctx.model.setProps(params);
    //   },
    // },
    openMode: {
      title: '打开方式',
      uiSchema: {},
      handler(ctx, params) {
        ctx.model.setProps(params);
      },
    },
    popupSize: {
      title: '弹窗尺寸',
      uiSchema: {},
      handler(ctx, params) {
        ctx.model.setProps(params);
      },
    },
  },
});

ActionModel.registerFlow({
  key: 'defaultClickHandler',
  on: {
    eventName: 'onClick',
  },
  title: '点击事件',
  steps: {
    openMode: {
      title: '打开方式',
      uiSchema: {},
      handler(ctx, params) {
        ctx.model.setProps(params);
      },
    },
    popupSize: {
      title: '弹窗尺寸',
      uiSchema: {},
      handler(ctx, params) {
        ctx.model.setProps(params);
      },
    },
  },
});
