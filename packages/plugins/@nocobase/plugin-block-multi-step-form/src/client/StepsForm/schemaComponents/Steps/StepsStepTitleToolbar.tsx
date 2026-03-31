import { SchemaToolbar } from '@nocobase/client';
import React from 'react';
import { stepsFormStepTitleSettings } from './settings';

export function StepsStepTitleToolbar() {
  return <SchemaToolbar draggable initializer={false} settings={stepsFormStepTitleSettings.name} />;
}
