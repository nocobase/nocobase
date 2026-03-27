/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export class FlowModelOperationError extends Error {
  status: number;
  code: string;
  details?: any;

  constructor(params: { status: number; code: string; message: string; details?: any }) {
    super(params.message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
    this.name = 'FlowModelOperationError';
  }
}

export function unwrapFlowModelSqlError(error: any) {
  return error?.original?.parent ?? error?.parent ?? error?.original ?? error;
}

export function isFlowModelUniqueConstraintError(error: any) {
  if (!error) {
    return false;
  }

  if (error?.name === 'SequelizeUniqueConstraintError') {
    return true;
  }

  const sqlError = unwrapFlowModelSqlError(error);
  if (!sqlError) {
    return false;
  }

  if (sqlError?.code === '23505') {
    return true;
  }

  if (sqlError?.errno === 1062) {
    return true;
  }

  if (typeof sqlError?.code === 'string' && sqlError.code.startsWith('SQLITE_CONSTRAINT')) {
    return true;
  }

  return false;
}
