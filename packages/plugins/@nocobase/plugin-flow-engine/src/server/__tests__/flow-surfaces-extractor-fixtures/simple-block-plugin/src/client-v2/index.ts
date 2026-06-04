/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

declare const flowEngine: {
  registerModels(models: Record<string, unknown>): void;
};
declare const SimpleBlockModel: {
  define(definition: Record<string, unknown>): void;
};

flowEngine.registerModels({
  SimpleBlockModel,
});

SimpleBlockModel.define({
  label: 'Simple block',
  createModelOptions: {
    use: 'SimpleBlockModel',
  },
});
