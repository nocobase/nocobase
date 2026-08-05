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
  registerModelLoaders(loaders: Record<string, unknown>): void;
};

const loaders = {
  LoaderBlockModel: {
    loader() {
      class LoaderResolvedBlockModel {}

      flowEngine.registerModels({
        LoaderResolvedBlockModel,
      });
      return 'loader-executed';
    },
  },
};

flowEngine.registerModelLoaders(loaders);
