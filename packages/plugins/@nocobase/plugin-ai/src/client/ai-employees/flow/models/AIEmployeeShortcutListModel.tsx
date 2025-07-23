/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { DndProvider, DragHandler, Droppable, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { AIEmployeeShortcutModel } from './AIEmployeeShortcutModel';

type AIEmployeeShortcutListModelStructure = {
  subModels: {
    shortcuts: AIEmployeeShortcutModel[];
  };
};

export class AIEmployeeShortcutListModel extends FlowModel<AIEmployeeShortcutListModelStructure> {
  isNewModel = false;

  render() {
    return (
      <div
        style={{
          display: 'flex',
          gap: '8px',
        }}
      >
        <DndProvider>
          {this.mapSubModels('shortcuts', (shortcut) => {
            return (
              <Droppable model={shortcut} key={shortcut.uid}>
                <FlowModelRenderer
                  key={shortcut.uid}
                  model={shortcut}
                  showFlowSettings={!shortcut.props?.builtIn}
                  extraToolbarItems={[
                    {
                      key: 'drag-handler',
                      component: DragHandler,
                      sort: 1,
                    },
                  ]}
                />
              </Droppable>
            );
          })}
        </DndProvider>
      </div>
    );
  }
}
