/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import {
  AddSubModelButton,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModelRenderer,
  FlowSettingsButton,
  MemoFlowModelRenderer,
} from '@nocobase/flow-engine';
import { CreateFormModel, FormBlockContent } from '@nocobase/client-v2';
import { Button, Space, Steps } from 'antd';
import React, { useMemo, useState } from 'react';

import { tExpr } from '../locale';
import type { MultiStepFormStepModel } from './MultiStepFormStepModel';

const actionFlowSettings = { showBackground: false, showBorder: false, toolbarPosition: 'above' as const };
const actionExtraToolbarItems = [
  {
    key: 'drag-handler',
    component: DragHandler,
    sort: 1,
  },
];

const MultiStepFormContent = ({ model }: { model: MultiStepFormBlockModel }) => {
  const steps = (model.subModels.steps || []) as MultiStepFormStepModel[];
  const [activeStep, setActiveStep] = useState(0);
  const currentStep = steps[Math.min(activeStep, Math.max(steps.length - 1, 0))];
  const { colon, labelAlign, labelWidth, labelWrap, layout } = model.props;
  const { heightMode, height } = model.decoratorProps;
  const isConfigMode = !!model.context.flowSettingsEnabled;
  const stepItems = useMemo(
    () =>
      steps.map((step, index) => ({
        key: step.uid,
        title: step.props?.title || model.translate('Step {{index}}', { index: index + 1 }),
      })),
    [model, steps],
  );

  return (
    <FormBlockContent
      model={model}
      gridModel={currentStep}
      layoutProps={{ colon, labelAlign, labelWidth, labelWrap, layout }}
      heightMode={heightMode}
      height={height}
      grid={
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
            <Steps current={Math.min(activeStep, Math.max(stepItems.length - 1, 0))} items={stepItems} />
            {isConfigMode ? (
              <AddSubModelButton
                model={model}
                subModelKey="steps"
                subModelBaseClass={model.getModelClassName('MultiStepFormStepModel')}
              >
                <Button icon={<PlusOutlined />} />
              </AddSubModelButton>
            ) : null}
          </div>
          {steps.map((step, index) => (
            <div
              key={step.uid}
              style={{
                display: index === activeStep ? 'block' : 'none',
              }}
            >
              <FlowModelRenderer model={step} showFlowSettings={false} />
            </div>
          ))}
        </>
      }
      actions={
        <DndProvider>
          <Space wrap>
            {model.mapSubModels('actions', (action) => {
              if (action.hidden && !isConfigMode) {
                return null;
              }
              return (
                <Droppable model={action} key={action.uid}>
                  <MemoFlowModelRenderer
                    key={action.uid}
                    model={action}
                    showFlowSettings={isConfigMode ? actionFlowSettings : false}
                    extraToolbarItems={actionExtraToolbarItems}
                  />
                </Droppable>
              );
            })}
            {model.renderConfigureActions()}
          </Space>
        </DndProvider>
      }
      footer={
        stepItems.length > 1 ? (
          <Space style={{ marginTop: 16 }}>
            <Button disabled={activeStep <= 0} onClick={() => setActiveStep((value) => Math.max(value - 1, 0))}>
              {model.translate('Previous')}
            </Button>
            <Button
              disabled={activeStep >= stepItems.length - 1}
              type="primary"
              onClick={() => setActiveStep((value) => Math.min(value + 1, stepItems.length - 1))}
            >
              {model.translate('Next')}
            </Button>
          </Space>
        ) : null
      }
    />
  );
};

export class MultiStepFormBlockModel extends CreateFormModel {
  _defaultCustomModelClasses = {
    ...this._defaultCustomModelClasses,
    MultiStepFormStepModel: 'MultiStepFormStepModel',
  };

  public async onDispatchEventStart(eventName: string, options?: any, inputArgs?: Record<string, any>): Promise<void> {
    if (eventName === 'beforeRender') {
      for (const step of this.subModels.steps || []) {
        await step.dispatchEvent('beforeRender', inputArgs, { useCache: options?.useCache });
      }
    }
    await super.onDispatchEventStart?.(eventName, options, inputArgs);
  }

  renderComponent() {
    return <MultiStepFormContent model={this} />;
  }
}

MultiStepFormBlockModel.define({
  label: tExpr('Form (Multi-step)'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: {
    use: 'MultiStepFormBlockModel',
    subModels: {
      steps: [
        {
          use: 'MultiStepFormStepModel',
          props: {
            title: tExpr('Step 1'),
          },
        },
      ],
    },
  },
  sort: 360,
});
