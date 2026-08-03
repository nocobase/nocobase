/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parseArgv } from '../command-task-type';

describe('command task type', () => {
  it('parses the target sub-app from command arguments', () => {
    expect(parseArgv(['import:xlsx', '--app=a_demo', '--hooks=true'])).toEqual({
      import: 'xlsx',
      app: 'a_demo',
      hooks: true,
    });
  });

  it('keeps malformed JSON arguments as strings', () => {
    expect(parseArgv(['--context={invalid'])).toEqual({
      context: '{invalid',
    });
  });
});
