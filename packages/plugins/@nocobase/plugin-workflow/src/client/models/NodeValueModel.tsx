/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockModel } from '@nocobase/client';
import { parse } from '@nocobase/utils/client';
import React from 'react';

export class NodeValueModel extends BlockModel {
  get execution() {
    return this.context.view.inputArgs.flowContext.execution;
  }

  get dataSource() {
    return this.getStepParams('valueSettings', 'init').dataSource;
  }

  get defaultValue() {
    return this.getStepParams('valueSettings', 'init').defaultValue;
  }

  renderComponent(): any {
    return <Result dataSource={this.dataSource} execution={this.execution} defaultValue={this.defaultValue} />;
  }
}

NodeValueModel.define({
  hide: true,
});

function Result({ dataSource, execution, defaultValue }) {
  if (!execution) {
    return defaultValue;
  }

  const result =
    parse(dataSource)({
      $jobsMapByNodeKey: (execution.jobs ?? []).reduce(
        (map, job) => Object.assign(map, { [job.nodeKey]: job.result }),
        {},
      ),
    }) || defaultValue;

  return (
    <pre
      style={{
        margin: 0,
      }}
    >
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}
