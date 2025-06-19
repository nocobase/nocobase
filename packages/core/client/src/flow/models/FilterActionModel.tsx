/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MultiRecordResource } from '@nocobase/flow-engine';
import { Button, Input, Popover } from 'antd';
import _ from 'lodash';
import React from 'react';
import { ActionModel } from './ActionModel';

export class FilterActionModel extends ActionModel {
  title = 'Filter';

  render() {
    return (
      <Popover
        content={
          <div>
            <Input
              placeholder="Nickname, email, phone, etc."
              onChange={_.debounce((e) => {
                const resource = this.ctx.shared?.currentBlockModel?.resource as MultiRecordResource;
                if (!resource) {
                  return;
                }
                resource.addFilterGroup(this.uid, {
                  $or: [
                    { ['nickname.$includes']: e.target.value },
                    { ['email.$includes']: e.target.value },
                    { ['phone.$includes']: e.target.value },
                  ],
                });
                resource.refresh();
              }, 500)}
            />
          </div>
        }
        trigger="click"
        placement="bottom"
      >
        <Button type={this.type} {...this.props}>
          {this.props.children || this.title}
        </Button>
      </Popover>
    );
  }
}

FilterActionModel.registerFlow({
  key: 'event1',
  on: {
    eventName: 'click',
  },
  steps: {
    step1: {
      async handler(ctx, params) {
        if (!ctx.shared?.currentBlockModel?.resource) {
          ctx.globals.message.error('No resource selected for refresh.');
          return;
        }
        const currentBlockModel = ctx.shared.currentBlockModel;
        await currentBlockModel.resource.refresh();
      },
    },
  },
});
