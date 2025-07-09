/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { AIEmployeeShortcutModel } from './AIEmployeeShortcutModel';

type AIEmployeeShortcutListModelStructure = {
  subModels: {
    shortcuts: AIEmployeeShortcutModel[];
  };
};

export class AIEmployeeShortcutListModel extends FlowModel<AIEmployeeShortcutListModelStructure> {
  onInit() {
    this.addSubModel('shortcuts', {
      uid: 'data-modeling',
      use: 'AIEmployeeShortcutModel',
      props: {
        avatar: 'notion-3-male',
      },
    });
  }

  render() {
    return (
      <div>
        {this.mapSubModels('shortcuts', (shortcut) => {
          console.log(shortcut.props);
          return <FlowModelRenderer key={shortcut.uid} model={shortcut} />;
        })}
      </div>
    );
  }
}
