/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parse } from '@nocobase/utils';
import _ from 'lodash';

export class Environment {
  private vars = {};
  private secretKeys = new Set<string>();

  setVariable(key: string, value: string, options?: { isSecret?: boolean }) {
    this.vars[key] = value;
    if (options?.isSecret === true) {
      this.secretKeys.add(key);
    } else if (options?.isSecret === false) {
      this.secretKeys.delete(key);
    }
  }

  removeVariable(key: string) {
    delete this.vars[key];
    this.secretKeys.delete(key);
  }

  getVariablesAndSecrets() {
    return this.vars;
  }

  getVariables() {
    return this.vars;
  }

  getNonSecretVariables() {
    const result = {};
    for (const key of Object.keys(this.vars)) {
      if (!this.secretKeys.has(key)) {
        result[key] = this.vars[key];
      }
    }
    return result;
  }

  renderJsonTemplate(template: any, options?: { omit?: string[] }) {
    if (options?.omit) {
      const omitTemplate = _.omit(template, options.omit);
      const parsed = parse(omitTemplate)({
        $env: this.vars,
      });
      for (const key of options.omit) {
        _.set(parsed, key, _.get(template, key));
      }
      return parsed;
    }
    return parse(template)({
      $env: this.vars,
    });
  }
}
