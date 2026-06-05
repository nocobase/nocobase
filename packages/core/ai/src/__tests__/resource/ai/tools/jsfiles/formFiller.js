/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all) __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === 'object') || typeof from === 'function') {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, '__esModule', { value: true }), mod);
var formFiller_exports = {};
__export(formFiller_exports, {
  default: () => formFiller_default,
});
module.exports = __toCommonJS(formFiller_exports);
var import_ai = require('@nocobase/ai');
var import_zod = require('zod');
var formFiller_default = (0, import_ai.defineTools)({
  scope: 'GENERAL',
  defaultPermission: 'ALLOW',
  execution: 'frontend',
  introduction: {
    title: '{{t("Form filler")}}',
    about: '{{t("Fill the form with the given content")}}',
  },
  definition: {
    name: 'formFiller',
    description: 'Fill the form with the given content',
    schema: import_zod.z.object({
      form: import_zod.z.string().describe('The UI Schema ID of the target form to be filled.'),
      data: import_zod.z.object({}).catchall(import_zod.z.any()).describe(
        `Structured key-value pairs matching the form's JSON Schema,
       to be assigned to form.values.
       Example: { "username": "alice", "email": "alice@example.com", "age": 30 }`,
      ),
    }),
  },
  invoke: async () => {
    return {
      status: 'success',
    };
  },
});
