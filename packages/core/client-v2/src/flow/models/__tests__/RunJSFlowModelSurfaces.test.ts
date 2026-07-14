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
  lightExtensionKind: 'js-block' | 'js-action' | 'js-field' | 'js-item';
  surfaceStyle: RunJSSurfaceStyle;
  scene: string;
};

type CodeSchema = {
  'x-component'?: unknown;
  'x-component-props'?: Record<string, unknown>;
};

type RunJSUiMode = {
  props?: Record<string, unknown>;
};

type RunJSUiModeContext = {
  model: {
    context: {
      t: (key: string) => string;
    };
    getStepParams: () => Record<string, unknown>;
  };
};

type SerializedRunJSStep = {
  uiMode?: RunJSUiMode | ((ctx: RunJSUiModeContext) => RunJSUiMode | Promise<RunJSUiMode>);
};

const surfaces: SurfaceSpec[] = [
  {
    name: 'JSBlockModel',
    modelClass: JSBlockModel,
    flowKey: 'jsSettings',
    lightExtensionKind: 'js-block',
    surfaceStyle: 'render',
    scene: 'block',
  },
  {
    name: 'JSFieldModel',
    modelClass: JSFieldModel,
    flowKey: 'jsSettings',
    lightExtensionKind: 'js-field',
    surfaceStyle: 'render',
    scene: 'block',
  },
  {
    name: 'JSEditableFieldModel',
    modelClass: JSEditableFieldModel,
    flowKey: 'jsSettings',
    lightExtensionKind: 'js-field',
    surfaceStyle: 'render',
    scene: 'formValue',
  },
  {
    name: 'JSItemModel',
    modelClass: JSItemModel,
    flowKey: 'jsSettings',
    lightExtensionKind: 'js-item',
    surfaceStyle: 'render',
    scene: 'block',
  },
  {
    name: 'JSColumnModel',
    modelClass: JSColumnModel,
    flowKey: 'jsSettings',
    lightExtensionKind: 'js-field',
    surfaceStyle: 'render',
    scene: 'block',
  },
  {
    name: 'JSItemActionModel',
    modelClass: JSItemActionModel,
    flowKey: 'jsSettings',
    lightExtensionKind: 'js-item',
    surfaceStyle: 'render',
    scene: 'block',
  },
  {
    name: 'JSActionModel',
    modelClass: JSActionModel,
    flowKey: 'clickSettings',
    lightExtensionKind: 'js-action',
    surfaceStyle: 'action',
    scene: 'eventFlow',
  },
  {
    name: 'JSRecordActionModel',
    modelClass: JSRecordActionModel,
    flowKey: 'clickSettings',
    lightExtensionKind: 'js-action',
    surfaceStyle: 'action',
    scene: 'eventFlow',
  },
  {
    name: 'JSCollectionActionModel',
    modelClass: JSCollectionActionModel,
    flowKey: 'clickSettings',
    lightExtensionKind: 'js-action',
    surfaceStyle: 'action',
    scene: 'eventFlow',
  },
  {
    name: 'JSFormActionModel',
    modelClass: JSFormActionModel,
    flowKey: 'clickSettings',
    lightExtensionKind: 'js-action',
    surfaceStyle: 'action',
    scene: 'eventFlow',
  },
  {
    name: 'FilterFormJSActionModel',
    modelClass: FilterFormJSActionModel,
    flowKey: 'clickSettings',
    lightExtensionKind: 'js-action',
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
      sourceMetadata: {
        lightExtensionKind: spec.lightExtensionKind,
      },
      surfaceStyle: spec.surfaceStyle,
      scene: spec.scene,
    });
  });

  it.each(surfaces)('$name uses the RunJS studio embed size while the provider owns the footer', async (spec) => {
    const flow = spec.modelClass.globalFlowRegistry.getFlow(spec.flowKey);
    const step = flow?.getStep('runJs');
    const codeSchema = getRunJsCodeSchema(spec);

    if (spec.name === 'JSBlockModel') {
      expect(codeSchema['x-component-props']?.minHeight).toBe('calc(100vh - 42px)');
    } else {
      expect(codeSchema['x-component-props']?.height).toBe('100%');
    }
    expect(codeSchema['x-component-props']?.wrapperStyle).toBeUndefined();
    expect(codeSchema['x-component-props']?.containerStyle).toMatchObject({
      height: '100%',
      minHeight: 0,
      minWidth: 0,
    });
    const uiMode = (step?.serialize() as SerializedRunJSStep | undefined)?.uiMode;
    expect(uiMode).toBeTypeOf('function');
    const resolvedUiMode =
      typeof uiMode === 'function'
        ? await uiMode({
            model: {
              context: {
                t: (key) => key,
              },
              getStepParams: () => ({ sourceMode: 'inline' }),
            },
          })
        : uiMode;
    const props = resolvedUiMode?.props;
    expect(props).toMatchObject({
      footer: null,
      maxWidth: '960px',
      minWidth: '720px',
      styles: {
        body: {
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          transform: 'translateX(0)',
        },
      },
      width: '45%',
    });
  });
});
