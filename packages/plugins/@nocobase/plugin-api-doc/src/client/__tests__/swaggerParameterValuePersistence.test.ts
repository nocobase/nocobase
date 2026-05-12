/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, test } from 'vitest';
import {
  createSwaggerParameterValuePersistence,
  syncSwaggerParameterValues,
} from '../swaggerParameterValuePersistence';

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
          <tr data-param-name="filter" data-param-in="query">
            <td class="parameters-col_description">
              <textarea>{"additionalProp1":{}}</textarea>
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

describe('swaggerParameterValuePersistence', () => {
  test('should restore each parameter input by operation and parameter name', () => {
    const root = createSwaggerDom();
    const values = new Map<string, string>();

    syncSwaggerParameterValues(root, values);

    const [filterByTk, , except] = Array.from(
      root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea'),
    );

    filterByTk.value = '123';
    values.set('operations-posts-get_posts_get::query::filterByTk', '123');
    except.value = '123';

    syncSwaggerParameterValues(root, values);

    expect(filterByTk.value).toBe('123');
    expect(except.value).toBe('id,createdAt');
  });

  test('should persist textarea values across rerenders', async () => {
    const root = createSwaggerDom();
    const dispose = createSwaggerParameterValuePersistence(root);
    const textarea = root.querySelector('textarea') as HTMLTextAreaElement;

    textarea.value = '{\n  "id": 1\n}';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.value = '{\n  "additionalProp1": {}\n}';

    const tableBody = root.querySelector('tbody') as HTMLTableSectionElement;
    const duplicateRow = (root.querySelector('tr[data-param-name="except"]') as HTMLTableRowElement).cloneNode(true);
    tableBody.appendChild(duplicateRow);
    duplicateRow.remove();
    await Promise.resolve();

    expect(textarea.value).toBe('{\n  "id": 1\n}');
    dispose();
  });
});
