/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parseVariablesAndChangeParamsToQueryString } from '../../hooks/index';

describe('parseVariablesAndChangeParamsToQueryString', () => {
  it('should parse variables and change params to query string', async () => {
    const searchParams = [
      { name: 'param1', value: '{{ $var1.value }}' },
      { name: 'param2', value: 'value2' },
      { name: 'param3', value: 'value3' },
    ];
    const variables: any = {
      parseVariable: vi.fn().mockResolvedValue('parsedValue'),
    };
    const localVariables: any = [
      { name: '$var1', ctx: { value: 'localValue1' } },
      { name: '$var2', ctx: { value: 'localValue2' } },
    ];
    const replaceVariableValue = vi.fn().mockResolvedValue('replacedValue');

    const result = await parseVariablesAndChangeParamsToQueryString({
      searchParams,
      variables,
      localVariables,
      replaceVariableValue,
    });

    expect(variables.parseVariable).toHaveBeenCalledTimes(1);
    expect(variables.parseVariable).toHaveBeenCalledWith('{{ $var1.value }}', localVariables);
    expect(replaceVariableValue).toHaveBeenCalledTimes(2);
    expect(replaceVariableValue).toHaveBeenCalledWith('value2', variables, localVariables);
    expect(replaceVariableValue).toHaveBeenCalledWith('value3', variables, localVariables);

    expect(result).toBe('param1=parsedValue&param2=replacedValue&param3=replacedValue');
  });
});
