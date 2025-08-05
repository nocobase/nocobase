import { FlowModel, MultiRecordResource } from '@nocobase/flow-engine';
import React from 'react';
import { CrudComponent } from './CrudComponent';

export class CrudModel extends FlowModel {
  declare resource: MultiRecordResource;

  onInit(options) {
    super.onInit(options);
    // 自定义 t 方法，用于国际化
    // 这里的 ns 是 crud-models，表示这个 t 方法是针对 CrudModel
    this.context.defineMethod('t', (key, options) => {
      return this.context.i18n.t(key, {
        ...options,
        ns: '@nocobase/plugin-crud',
      });
    });
  }

  render() {
    return <CrudComponent />;
  }
}

CrudModel.registerFlow({
  key: 'resourceSettings',
  steps: {
    initResource: {
      handler: async (ctx) => {
        ctx.useResource('MultiRecordResource');
        const resource = ctx.resource as MultiRecordResource;
        resource.setDataSourceKey('main');
        resource.setResourceName('users');
        resource.setPageSize(10);
        await resource.refresh();
      },
    },
  },
});
