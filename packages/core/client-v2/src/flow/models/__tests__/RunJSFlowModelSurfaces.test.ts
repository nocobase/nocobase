/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';
import { describe, expect, it } from 'vitest';

import { RunJSEditorField, type RunJSSurfaceStyle } from '../../components/runjs-studio';
import { JSActionModel } from '../actions/JSActionModel';
import { JSCollectionActionModel } from '../actions/JSCollectionActionModel';
import { JSItemActionModel } from '../actions/JSItemActionModel';
import { JSRecordActionModel } from '../actions/JSRecordActionModel';
import { FilterFormJSActionModel } from '../blocks/filter-form/FilterFormJSActionModel';
import { JSFormActionModel } from '../blocks/form/JSFormActionModel';
import { JSBlockModel } from '../blocks/js-block/JSBlock';
import { JSColumnModel } from '../blocks/table/JSColumnModel';
import { JSEditableFieldModel } from '../fields/JSEditableFieldModel';
import { JSFieldModel } from '../fields/JSFieldModel';
import { JSItemModel } from '../fields/JSItemModel';

type SurfaceSpec = {
  name: string;
  modelClass: typeof FlowModel;
  flowKey: string;
  surfaceStyle: RunJSSurfaceStyle;
  scene: string;
};

type CodeSchema = {
  'x-component'?: unknown;
  'x-component-props'?: Record<string, unknown>;
};

const surfaces: SurfaceSpec[] = [
  { name: 'JSBlockModel', modelClass: JSBlockModel, flowKey: 'jsSettings', surfaceStyle: 'render', scene: 'block' },
  { name: 'JSFieldModel', modelClass: JSFieldModel, flowKey: 'jsSettings', surfaceStyle: 'render', scene: 'block' },
  {
    name: 'JSEditableFieldModel',
    modelClass: JSEditableFieldModel,
    flowKey: 'jsSettings',
    surfaceStyle: 'render',
    scene: 'formValue',
  },
  { name: 'JSItemModel', modelClass: JSItemModel, flowKey: 'jsSettings', surfaceStyle: 'render', scene: 'block' },
  { name: 'JSColumnModel', modelClass: JSColumnModel, flowKey: 'jsSettings', surfaceStyle: 'render', scene: 'block' },
  {
    name: 'JSItemActionModel',
    modelClass: JSItemActionModel,
    flowKey: 'jsSettings',
    surfaceStyle: 'render',
    scene: 'block',
  },
  {
    name: 'JSActionModel',
    modelClass: JSActionModel,
    flowKey: 'clickSettings',
    surfaceStyle: 'action',
    scene: 'eventFlow',
  },
  {
    name: 'JSRecordActionModel',
    modelClass: JSRecordActionModel,
    flowKey: 'clickSettings',
    surfaceStyle: 'action',
    scene: 'eventFlow',
  },
  {
    name: 'JSCollectionActionModel',
    modelClass: JSCollectionActionModel,
    flowKey: 'clickSettings',
    surfaceStyle: 'action',
    scene: 'eventFlow',
  },
  {
    name: 'JSFormActionModel',
    modelClass: JSFormActionModel,
    flowKey: 'clickSettings',
    surfaceStyle: 'action',
    scene: 'eventFlow',
  },
  {
    name: 'FilterFormJSActionModel',
    modelClass: FilterFormJSActionModel,
    flowKey: 'clickSettings',
    surfaceStyle: 'action',
    scene: 'eventFlow',
  },
];

function getRunJsCodeSchema(spec: SurfaceSpec): CodeSchema {
  const flow = spec.modelClass.globalFlowRegistry.getFlow(spec.flowKey);
  const step = flow?.getStep('runJs');
  const uiSchema = step?.uiSchema;
  const codeSchema = uiSchema ? (uiSchema as Record<string, CodeSchema>).code : undefined;

  expect(flow, `${spec.name} ${spec.flowKey} flow`).toBeTruthy();
  expect(step, `${spec.name} runJs step`).toBeTruthy();
  expect(codeSchema, `${spec.name} code schema`).toBeTruthy();

  return codeSchema as CodeSchema;
}

describe('RunJS FlowModel surfaces', () => {
  it.each(surfaces)('$name uses RunJSEditorField with flowModel.step locator metadata', (spec) => {
    const codeSchema = getRunJsCodeSchema(spec);

    expect(codeSchema['x-component']).toBe(RunJSEditorField);
    expect(codeSchema['x-component-props']).toMatchObject({
      locatorFactory: 'flowModel.step',
      surfaceStyle: spec.surfaceStyle,
      scene: spec.scene,
    });
  });
});
