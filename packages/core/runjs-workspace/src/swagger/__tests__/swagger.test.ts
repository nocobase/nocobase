/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import manifest from '../../shared/runjs-authoring-contract.v1.json';
import swagger from '..';

describe('RunJS workspace Swagger', () => {
  it('publishes the capabilities command from the versioned static manifest', () => {
    const operation = swagger.paths['/runJSSources:capabilities'].post;
    const schema = swagger.components.schemas.RunJSAuthoringCapabilities;

    expect(operation.summary).toContain('versioned RunJS authoring contract');
    expect(operation.responses[200].content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/RunJSAuthoringCapabilities',
    });
    expect(schema.properties.authoringContractVersion.enum).toEqual([manifest.authoringContractVersion]);
    expect(schema.properties.inlineWorkspace.properties.ownerKinds.items.enum).toEqual(
      manifest.inlineWorkspace.ownerKinds,
    );
    expect(schema.properties.inlineWorkspace.properties.modelUses.items.enum).toEqual(
      manifest.inlineWorkspace.modelUses,
    );
    expect(schema.properties.externalization.properties.entryKinds.items.enum).toEqual(
      manifest.externalization.entryKinds,
    );
    expect(schema.properties.externalization.properties.destinationTypes.items.enum).toEqual(
      manifest.externalization.destinationTypes,
    );
  });
});
