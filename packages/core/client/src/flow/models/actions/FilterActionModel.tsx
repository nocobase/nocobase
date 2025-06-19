/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MultiRecordResource } from '@nocobase/flow-engine';
import { Button, ButtonProps, Input, Popover } from 'antd';
import _ from 'lodash';
import React from 'react';
import { GlobalActionModel } from '../base/ActionModel';

export class FilterActionModel extends GlobalActionModel {
  defaultProps: ButtonProps = {
    type: 'default',
    children: 'Filter',
  };

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
        <Button {...this.defaultProps} {...this.props} />
      </Popover>
    );
  }
}
