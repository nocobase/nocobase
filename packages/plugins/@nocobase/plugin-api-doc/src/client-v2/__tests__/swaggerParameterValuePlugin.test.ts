/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, test } from 'vitest';
import { createSwaggerParameterValuePlugin } from '../swaggerParameterValuePlugin';

function createSwaggerDom() {
  const root = document.createElement('div');
  root.innerHTML = `
    <div class="opblock" id="operations-posts-get_posts_get">
      <table class="parameters">
        <tbody>
          <tr data-param-name="filterByTk" data-param-in="query">
            <td class="parameters-col_description">
              <input type="text" placeholder="filterByTk" value="" />
            </td>
          </tr>
          <tr data-param-name="except" data-param-in="query">
            <td class="parameters-col_description">
              <input type="text" placeholder="except" value="id,createdAt" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  return root;
}

function createSwaggerParameter(name: string, paramIn = 'query') {
  const valueByKey: Record<string, string> = {
    name,
    in: paramIn,
  };

  return {
    get: (key: string) => valueByKey[key],
  };
}

describe('swaggerParameterValuePlugin', () => {
  test('should route debounced Swagger UI parameter updates to the active input row', () => {
    const root = createSwaggerDom();
    const { plugin, dispose } = createSwaggerParameterValuePlugin(root);
    const filterByTk = root.querySelector('tr[data-param-name="filterByTk"] input') as HTMLInputElement;
    const changeParamCalls: unknown[][] = [];
    const originalCalls: unknown[][] = [];
    const wrappedAction = plugin().statePlugins.spec.wrapActions.changeParamByIdentity(
      (...args: unknown[]) => originalCalls.push(args),
      {
        specActions: {
          changeParam: (...args: unknown[]) => changeParamCalls.push(args),
        },
      },
    );

    filterByTk.focus();
    filterByTk.value = '123';
    filterByTk.dispatchEvent(new Event('input', { bubbles: true }));
    wrappedAction(['/t_ahss65z6qlx:get', 'get'], createSwaggerParameter('except'), '123');

    expect(changeParamCalls).toEqual([[['/t_ahss65z6qlx:get', 'get'], 'filterByTk', 'query', '123', undefined]]);
    expect(originalCalls).toEqual([]);
    dispose();
  });

  test('should fall back to the Swagger UI parameter identity without active input', () => {
    const root = createSwaggerDom();
    const { plugin, dispose } = createSwaggerParameterValuePlugin(root);
    const changeParamCalls: unknown[][] = [];
    const wrappedAction = plugin().statePlugins.spec.wrapActions.changeParamByIdentity(() => undefined, {
      specActions: {
        changeParam: (...args: unknown[]) => changeParamCalls.push(args),
      },
    });

    wrappedAction(['/t_ahss65z6qlx:get', 'get'], createSwaggerParameter('except'), 'id,createdAt');

    expect(changeParamCalls).toEqual([[['/t_ahss65z6qlx:get', 'get'], 'except', 'query', 'id,createdAt', undefined]]);
    dispose();
  });
});
