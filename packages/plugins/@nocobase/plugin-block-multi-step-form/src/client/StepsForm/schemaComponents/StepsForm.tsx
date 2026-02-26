import { RecursionField, useFieldSchema } from '@formily/react';
import { withDynamicSchemaProps, DndContext, FormV2 } from '@nocobase/client';
import React from 'react';
import { Steps } from './Steps';
import { AddStepButton } from './AddStepButton';
import { StepsFormContext, useStepsContext } from './context';

export const StepsForm = withDynamicSchemaProps(
  (props) => {
    const schema = useFieldSchema();
    const ctx = useStepsContext(props);
    return (
      <StepsFormContext.Provider value={ctx}>
        <div style={{ display: 'flex', overflow: 'auto' }}>
          <DndContext
            onDragEnd={(event) => {
              const { items } = ctx;
              const activeIndex = items.findIndex((x) => (event.active?.id as string)?.includes(x.name));
              const overIndex = items.findIndex((x) => (event.over?.id as string)?.includes(x.name));
              ctx.stepDragEnd(activeIndex, overIndex);
            }}
          >
            <Steps current={ctx.currentStep} items={ctx.items} />
          </DndContext>
          <AddStepButton onClick={ctx.addStep} />
        </div>
        <div>
          {ctx.items.map((_, index) => (
            <div
              key={index}
              style={{
                visibility: index !== ctx.currentStep ? 'hidden' : 'visible',
                height: index !== ctx.currentStep ? 0 : 'auto',
                overflow: 'hidden',
              }}
            >
              <RecursionField name={`${index}.content`} schema={ctx.items[index]?.contentSchema} onlyRenderProperties />
            </div>
          ))}
          {/* <RecursionField
            name={`${ctx.currentStep}.content`}
            schema={ctx.items[ctx.currentStep]?.contentSchema}
            onlyRenderProperties
          /> */}
          {/* 将表单实例传递给按钮 */}
          <FormV2 form={ctx.form}>
            <RecursionField
              schema={schema}
              onlyRenderProperties
              filterProperties={(s) => {
                return s['x-component'] !== 'StepsForm.Step';
              }}
            />
          </FormV2>
        </div>
      </StepsFormContext.Provider>
    );
  },
  { displayName: 'StepsForm' },
);

StepsForm['Step'] = () => null;
