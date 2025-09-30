/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { Timeline } from 'antd';
import React from 'react';
import { tExpr } from '../locale';

export class TimelineBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.many;

  createResource() {
    return this.context.createResource(MultiRecordResource);
  }

  renderComponent() {
    return (
      <Timeline
        items={[
          {
            children: 'Create a services site 2015-09-01',
          },
          {
            children: 'Solve initial network problems 2015-09-01',
          },
          {
            children: 'Technical testing 2015-09-01',
          },
          {
            children: 'Network problems being solved 2015-09-01',
          },
        ]}
      />
    );
  }
}

TimelineBlockModel.define({
  label: tExpr('Timeline'),
});

TimelineBlockModel.registerFlow({
  key: 'timelineSettings',
  steps: {
    setProps: {
      title: tExpr('Settings'),
      handler: async (ctx) => {},
    },
  },
});
