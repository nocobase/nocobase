import { Plugin, SchemaComponent } from '@nocobase/client';
import React from 'react';
import { ComponentType } from './constants';
import {
  stepsFormInitializerItemCreater,
  blockSettings,
  getStepsFormSchema,
  configureActionsInitializer,
  configureFieldsInitializer,
  stepsFormNextActionSettings,
  stepsFormPreviousActionSettings,
  stepsFormSubmitActionSettings,
  useStepsFormNextActionProps,
  useStepsFormPreviousActionProps,
  useStepsFormSubmitActionProps,
  useStepsFormCustomActionProps,
  StepForm,
  StepsForm,
  stepsFormStepTitleSettings,
  StepsStepTitleToolbar,
} from './StepsForm';

export class PluginBlockStepsFormClient extends Plugin {
  async load() {
    this.app.addComponents({ StepForm, StepsForm, StepsStepTitleToolbar });
    this.app.addScopes({
      // useStepFormProps,
      // useStepsFormStepProps,
      useStepsFormNextActionProps,
      useStepsFormPreviousActionProps,
      useStepsFormSubmitActionProps,
      useStepsFormCustomActionProps,
    });

    this.app.schemaInitializerManager.addItem(
      'page:addBlock',
      `dataBlocks.${ComponentType}`,
      stepsFormInitializerItemCreater('page', 'create'),
    );
    this.app.schemaInitializerManager.addItem(
      'popup:common:addBlock',
      `dataBlocks.${ComponentType}-update`,
      stepsFormInitializerItemCreater('popup', 'update'),
    );
    this.app.schemaInitializerManager.addItem(
      'popup:common:addBlock',
      `dataBlocks.${ComponentType}-create`,
      stepsFormInitializerItemCreater('popup', 'create'),
    );
    this.app.schemaInitializerManager.addItem(
      'popup:addNew:addBlock',
      `dataBlocks.${ComponentType}-addnew`,
      stepsFormInitializerItemCreater('addNew', 'create'),
    );

    this.app.schemaInitializerManager.add(configureFieldsInitializer, configureActionsInitializer);

    this.app.schemaSettingsManager.add(
      blockSettings,
      stepsFormNextActionSettings,
      stepsFormPreviousActionSettings,
      stepsFormSubmitActionSettings,
      stepsFormStepTitleSettings,
    );

    this.app.router.add('admin.block-form-schema', {
      path: '/admin/block-form-schema',
      Component: () => {
        const s = getStepsFormSchema({
          collection: 'users',
        });
        return (
          <>
            <div style={{ marginTop: 20, marginBottom: 20 }}>
              <SchemaComponent
                schema={{
                  properties: {
                    test: s,
                  },
                }}
              />
            </div>
          </>
        );
      },
    });
  }
}

export default PluginBlockStepsFormClient;
