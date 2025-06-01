/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CreateModelOptions, FlowModel } from '@nocobase/flow-engine';
import { Plugin } from '../application/Plugin';
import { FlowPage } from './FlowPage';
import { PageModel, TabModel, GridModel, BlockModel } from './model';

export * from './data';

export class PluginFlowEngine extends Plugin {
  async load() {
    this.app.flowEngine.registerModelClass('PageModel', PageModel);
    this.app.flowEngine.registerModelClass('TabModel', TabModel);
    this.app.flowEngine.registerModelClass('GridModel', GridModel);
    this.app.flowEngine.registerModelClass('BlockModel', BlockModel); // TODO: 替换成Markdown和云组件等实际组件
    this.app.addComponents({ FlowPage });
  }
}
