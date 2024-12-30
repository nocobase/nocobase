/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parse } from '@nocobase/utils';

export class Environment {
  private vars = {};

  setVariable(key: string, value: string) {
    this.vars[key] = value;
  }

  removeVariable(key: string) {
    delete this.vars[key];
  }

  getVariablesAndSecrets() {
    return this.vars;
  }

  getVariables() {
    return this.vars;
  }

  renderJsonTemplate(template: any) {
    return parse(template)({
      $env: this.vars,
    });
  }
}
