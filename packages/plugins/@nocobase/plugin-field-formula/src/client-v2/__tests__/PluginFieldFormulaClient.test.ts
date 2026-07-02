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
import { FormulaFieldModel } from '../models/FormulaFieldModel';
import PluginFieldFormulaClient from '../plugin';
import { FormulaFieldInterface, formulaDateOperators } from '../interfaces/formula';

describe('PluginFieldFormulaClient', () => {
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
});
