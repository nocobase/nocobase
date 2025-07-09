/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { z } from 'zod';
import { ToolOptions } from '../manager/tool-manager';

export const defineCollections: ToolOptions= {
  name: "defineCollections",
  title: '{{t("Define collections")}}',
  description: '{{t("Create or edit collections")}}',
  schema: z.object({
    collections: z.array(z.record(z.any())).describe('An array of collections to be defined or edited.'),
  }),
  invoke: async () => {
    return {
      status: 'success',
      content: 'I have filled the form with the provided data.',
    };
  },
};

export const getCollectionMetadata: ToolOptions = {
  name: "getCollectionMetadata",
  title: '{{t("Get collection metadata")}}',
  description: '{{t("Retrieve metadata for specified collections")}}',
  schema: z.object({
    collectionNames: z.array(z.string()).describe('An array of collection names to retrieve metadata for.'),
  }),
  invoke: async () => {
    return {
      status: 'success',
      content: 'I have retrieved the metadata for the specified collections.',
    };
  },
};
