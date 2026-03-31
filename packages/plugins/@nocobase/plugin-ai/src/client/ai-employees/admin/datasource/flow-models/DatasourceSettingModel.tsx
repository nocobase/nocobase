/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FlowModel, MultiRecordResource } from '@nocobase/flow-engine';
import { DEFAULT_DATA_SOURCE_KEY } from '@nocobase/client';
import { DatasourceSettingGrid } from '../components/DatasourceSettingGrid';
import { namespace } from '../../../../locale';

export class DatasourceSettingModel extends FlowModel {
  declare resource: MultiRecordResource;

  onInit(options) {
    super.onInit(options);
    this.context.defineMethod('t', (key, options) => {
      return this.context.i18n.t(key, {
        ...options,
        ns: namespace,
      });
    });
  }

  render() {
    return <DatasourceSettingGrid />;
  }
}

DatasourceSettingModel.registerFlow({
  key: 'resourceSettings',
  steps: {
    initResource: {
      handler: async (ctx) => {
        ctx.useResource('MultiRecordResource');
        const resource = ctx.resource as MultiRecordResource;
        resource.setDataSourceKey(DEFAULT_DATA_SOURCE_KEY);
        resource.setResourceName('aiContextDatasources');
        resource.setRequestParameters({
          sort: ['-createdAt'],
        });
        resource.setPageSize(16);
        await resource.refresh();
      },
    },
  },
});
