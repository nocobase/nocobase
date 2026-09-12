/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FormulaExpression } from '../components';
import { FormulaExpressionConfigureField } from '../components/FormulaExpressionConfigureField';
import { FormulaFieldInterface, formulaDateOperators } from '../interfaces/formula';
import { FormulaFieldModel } from '../models/FormulaFieldModel';
import PluginFieldFormulaClient from '../plugin';

vi.mock('@nocobase/evaluators/client', () => ({
  evaluators: {
    getEntities: () => [
      ['formula.js', { label: 'Formula.js' }],
      ['math.js', { label: 'Math.js' }],
    ],
  },
}));

vi.mock('../locale', () => ({
  tExpr: (value: string) => value,
}));

describe('FormulaFieldInterface', () => {
  it('registers formula components, interfaces, context helpers and model loader', async () => {
    const addComponents = vi.fn();
    const registerFieldFilterOperatorGroup = vi.fn();
    const addFieldInterfaces = vi.fn();
    const defineProperty = vi.fn();
    const registerModelLoaders = vi.fn();
    const plugin = Object.create(PluginFieldFormulaClient.prototype) as PluginFieldFormulaClient & {
      app: {
        addComponents: typeof addComponents;
        addFieldInterfaces: typeof addFieldInterfaces;
        registerFieldFilterOperatorGroup: typeof registerFieldFilterOperatorGroup;
        flowEngine: {
          context: {
            defineProperty: typeof defineProperty;
          };
          registerModelLoaders: typeof registerModelLoaders;
        };
      };
    };
    plugin.app = {
      addComponents,
      addFieldInterfaces,
      registerFieldFilterOperatorGroup,
      flowEngine: {
        context: {
          defineProperty,
        },
        registerModelLoaders,
      },
    };
    plugin.expressionFields = ['input'];

    plugin.registerExpressionFieldInterface(['customA', 'customB']);
    plugin.registerExpressionFieldInterface('customC');
    await plugin.load();

    expect(addComponents).toHaveBeenCalledWith({
      FormulaExpression,
    });
    expect(registerFieldFilterOperatorGroup).toHaveBeenCalledWith('formulaDate', formulaDateOperators);
    expect(addFieldInterfaces).toHaveBeenCalledWith([FormulaFieldInterface]);
    expect(defineProperty).toHaveBeenCalledWith('fieldFormula', {
      get: expect.any(Function),
    });

    const contextValue = defineProperty.mock.calls[0][1].get();
    expect(contextValue.expressionFields).toEqual(expect.arrayContaining(['customA', 'customB', 'customC']));
    contextValue.registerExpressionFieldInterface('customD');
    expect(plugin.expressionFields).toContain('customD');

    expect(registerModelLoaders).toHaveBeenCalledWith({
      FormulaFieldModel: {
        loader: expect.any(Function),
      },
    });
    const loaders = registerModelLoaders.mock.calls[0][0];
    await expect(loaders.FormulaFieldModel.loader()).resolves.toHaveProperty('FormulaFieldModel', FormulaFieldModel);
  });

  it('defines formula field schema and configuration', () => {
    const fieldInterface = new FormulaFieldInterface();

    expect(fieldInterface).toMatchObject({
      name: 'formula',
      type: 'object',
      group: 'advanced',
      order: 1,
      title: 'Formula',
      sortable: true,
      default: {
        interface: 'formula',
        type: 'formula',
        uiSchema: {
          type: 'string',
          'x-component': 'Input',
          'x-read-pretty': true,
          'x-component-props': {
            stringMode: true,
            step: '1',
          },
        },
      },
      titleUsable: true,
    });
    expect(fieldInterface.configure.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'dataType',
          component: 'Select',
          defaultValue: 'double',
          required: true,
        }),
        expect.objectContaining({
          name: 'engine',
          component: 'Radio.Group',
          defaultValue: 'formula.js',
          options: [
            { value: 'formula.js', label: 'Formula.js' },
            { value: 'math.js', label: 'Math.js' },
          ],
        }),
        expect.objectContaining({
          name: 'expression',
          Component: FormulaExpressionConfigureField,
          required: true,
        }),
      ]),
    );
    expect(fieldInterface.configure.items[0].disabled?.({ context: { createOnly: true } } as any)).toBe(false);
    expect(fieldInterface.configure.items[0].disabled?.({ context: { createOnly: false } } as any)).toBe(true);
  });

  it('shows type-specific configuration and filter operators', () => {
    const fieldInterface = new FormulaFieldInterface();
    const precisionItem = fieldInterface.configure.items.find(
      (item) => item.name === 'uiSchema.x-component-props.step',
    );
    const dateFormatItem = fieldInterface.configure.items.find(
      (item) => item.name === 'uiSchema.x-component-props.dateFormat',
    );

    expect(precisionItem?.hidden?.({ getValue: () => 'double' } as any)).toBe(false);
    expect(precisionItem?.hidden?.({ getValue: () => 'date' } as any)).toBe(true);
    expect(dateFormatItem?.hidden?.({ getValue: () => 'date' } as any)).toBe(false);
    expect(dateFormatItem?.hidden?.({ getValue: () => 'string' } as any)).toBe(true);

    const dateOperatorValues = formulaDateOperators.map((operator) => operator.value);
    expect(dateOperatorValues).not.toContain('$dateNotBefore');
    expect(dateOperatorValues).not.toContain('$dateNotAfter');

    const numberOperators = fieldInterface.filterable.operators.filter(
      (operator) =>
        operator.visible?.({
          options: {
            dataType: 'double',
          },
        }),
    );
    const stringOperators = fieldInterface.filterable.operators.filter(
      (operator) =>
        operator.visible?.({
          options: {
            dataType: 'string',
          },
        }),
    );

    expect(numberOperators.length).toBeGreaterThan(0);
    expect(stringOperators.length).toBeGreaterThan(0);
    expect(numberOperators).not.toEqual(stringOperators);
  });
});
