/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ExclamationCircleFilled } from '@ant-design/icons';
import { Plugin } from '@nocobase/client';
import { Modal } from 'antd';
import React from 'react';

export class PluginEventflowExamplesClient extends Plugin {
  async load() {
    this.setEventFlowEventAndActions();
    this.addEventListeners();
  }

  addEventListeners() {
    window.addEventListener('beforeunload', async (event) => {
      await this.app.eventFlowManager.dispatchEvent('window.beforeUnload', { window, app: this.app, event });
    });
    window.document.addEventListener('click', async (event) => {
      await this.app.eventFlowManager.dispatchEvent('window.onClick', { app: this.app, event });
    });
  }

  setEventFlowEventAndActions() {
    this.app.eventFlowManager.addEventGroup({
      name: 'windowEvents',
      title: 'Window events',
      sort: 0,
    });
    this.app.eventFlowManager.addEvent({
      name: 'window.beforeUnload',
      title: 'window.beforeUnload',
      sort: 2,
      description: 'window before unload description',
      group: 'windowEvents',
      async handler(params, { event }) {
        event.preventDefault();
        event.returnValue = '';
      },
      uiSchema: {
        condition: {
          type: 'string',
          title: 'Condition',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    });

    this.app.eventFlowManager.addEvent({
      name: 'window.onClick',
      title: 'window.onClick',
      sort: 1,
      description: 'window onclick description',
      group: 'windowEvents',
      uiSchema: {
        condition: {
          type: 'string',
          title: 'Condition',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    });

    this.app.eventFlowManager.addActionGroup({
      name: 'uiFeedback',
      title: 'UI feedback',
      sort: 0,
    });

    this.app.eventFlowManager.addAction({
      name: 'dialog',
      title: 'Dialog',
      sort: 0,
      group: 'uiFeedback',
      uiSchema: {
        condition: {
          type: 'string',
          title: 'Condition',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        'params.title': {
          type: 'string',
          title: 'Dialog title',
          required: true,
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        'params.content': {
          type: 'string',
          title: 'Dialog content',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      async handler(params, context) {
        if (!params.title) {
          return;
        }
        Modal.confirm({
          title: params.title,
          icon: <ExclamationCircleFilled />,
          content: params.content,
        });
      },
    });

    this.app.eventFlowManager.addFlow({
      title: '刷新页面',
      on: {
        title: '页面刷新事件',
        event: 'window.beforeUnload',
        condition: '{{ctx.window.location.pathname === "/admin/vljjhr8cmf5"}}',
      },
    });

    this.app.eventFlowManager.addFlow({
      title: '点击页面空白处',
      on: {
        title: '点击事件',
        event: 'window.onClick',
        condition: "{{ ctx.event.target['className'] === 'nb-grid-warp' }}",
      },
      steps: [
        {
          title: '对话框',
          action: 'dialog',
          condition: "{{ ctx.event.target['className'] === 'nb-grid-warp' }}",
          params: {
            title: '对话框标题',
            content: '对话框内容',
          },
        },
      ],
    });
  }
}
