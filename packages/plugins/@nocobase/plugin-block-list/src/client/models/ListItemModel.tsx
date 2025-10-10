/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  DisplayItemModel,
  FlowModelContext,
  ModelRenderMode,
  FormItem,
  FieldModelRenderer,
  DndProvider,
  Droppable,
  FlowModelRenderer,
  DragHandler,
  AddSubModelButton,
  FlowSettingsButton,
  FlowModel,
} from '@nocobase/flow-engine';
import React from 'react';
import { SettingOutlined } from '@ant-design/icons';
import type { CollectionField, PropertyMetaFactory, Collection } from '@nocobase/flow-engine';
import { FieldModel, DetailsGridModel, FormComponent, ActionModel } from '@nocobase/client';
import { Space, List } from 'antd';

type ListItemModelStructure = {
  subModels: {
    grid: DetailsGridModel;
    actions: ActionModel[];
  };
};

export class ListItemModel extends FlowModel<ListItemModelStructure> {
  onInit(options: any): void {
    super.onInit(options);
  }
  renderConfiguireActions() {
    return (
      <AddSubModelButton
        key="table-row-actions-add"
        model={this}
        subModelBaseClass={this.context.getModelClassName('RecordActionGroupModel')}
        subModelKey="actions"
        afterSubModelInit={async (actionModel) => {
          actionModel.setStepParams('buttonSettings', 'general', { type: 'link' });
        }}
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Actions')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }

  render() {
    const model = this.subModels.grid.createFork({}, `${this.context.index}`);
    model.context.defineProperty('record', {
      get: () => this.context.record,
      cache: false,
      resolveOnServer: true,
    });
    return (
      <div key={this.context.index} style={{ width: '100%' }}>
        <FormComponent model={this}>
          <FlowModelRenderer model={model as any} showFlowSettings={false} />
        </FormComponent>
        <div>
          <DndProvider>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Space>
                {this.mapSubModels('actions', (action) => {
                  // @ts-ignore
                  if (action.props.position !== 'left') {
                    return (
                      <Droppable model={action} key={action.uid}>
                        <FlowModelRenderer
                          model={action}
                          showFlowSettings={{ showBackground: false, showBorder: false, toolbarPosition: 'above' }}
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
                  }

                  return null;
                })}
                {this.renderConfiguireActions()}
              </Space>
            </div>
          </DndProvider>
        </div>
      </div>
    );
  }
}

ListItemModel.define({
  createModelOptions: {
    use: 'ListItemModel',
    subModels: {
      grid: {
        use: 'DetailsGridModel',
      },
    },
  },
  sort: 350,
});
