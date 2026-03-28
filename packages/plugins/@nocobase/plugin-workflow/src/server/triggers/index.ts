/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Joi from 'joi';
import { Transactionable } from '@nocobase/database';
import type Plugin from '../Plugin';
import type { WorkflowModel } from '../types';
import Processor from '../Processor';

export abstract class Trigger {
  configSchema?: Joi.ObjectSchema;

  constructor(public readonly workflow: Plugin) {}
  on(workflow: WorkflowModel): void {}
  off(workflow: WorkflowModel): void {}
  validateEvent(workflow: WorkflowModel, context: any, options: Transactionable): boolean | Promise<boolean> {
    return true;
  }
  duplicateConfig?(
    workflow: WorkflowModel,
    options: Transactionable & { origin?: WorkflowModel },
  ): object | Promise<object>;

  validateConfig(config: Record<string, any>): Record<string, string> | null {
    if (!this.configSchema) {
      return null;
    }
    const { error } = this.configSchema.validate(config, { abortEarly: false, allowUnknown: true });
    if (!error) {
      return null;
    }
    const errors: Record<string, string> = {};
    for (const detail of error.details) {
      const key = detail.path.join('.');
      if (!errors[key]) {
        errors[key] = detail.message;
      }
    }
    return errors;
  }

  validateContext?(values: any, workflow: WorkflowModel): null | void | { [key: string]: string };
  sync?: boolean;
  execute?(
    workflow: WorkflowModel,
    values: any,
    options: Transactionable,
  ): void | Processor | Promise<void | Processor>;
}

export default Trigger;
