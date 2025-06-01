/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { uid } from '@formily/shared';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, IFlowModelRepository } from '@nocobase/flow-engine';
import { Button, Tabs } from 'antd';
import _ from 'lodash';
import React from 'react';

export class TabFlowModel extends FlowModel {}

export class PageFlowModel extends FlowModel {
  tabs: Array<any>;

  onInit(options: any) {
    const tabs = options.tabs || [];
    this.tabs = observable.shallow([]);
    tabs.forEach((tab: any) => {
      this.addSubModel('tabs', tab);
    });
  }

  addTab(tab: any) {
    const model = this.addSubModel('tabs', tab);
    model.save();
  }

  render() {
    return (
      <div>
        <Tabs
          items={this.tabs.map((tab) => tab.getProps())}
          tabBarExtraContent={
            <Button
              onClick={() =>
                this.addTab({
                  use: 'TabFlowModel',
                  props: { key: uid(), label: `Tab - ${uid()}` },
                })
              }
            >
              Add Tab
            </Button>
          }
        />
      </div>
    );
  }
}
