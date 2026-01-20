/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';

export class LoadingAwareModel extends FlowModel {
  async onDispatchEventStart(eventName: string) {
    if (eventName === 'beforeRender') {
      this.setState({
        profile: await this.context.asyncProfile,
      });
    }
  }
}

export async function awaitAsyncProperty<T>(ctx: FlowModel['context'], property: Promise<T> | T) {
  return await property;
}
