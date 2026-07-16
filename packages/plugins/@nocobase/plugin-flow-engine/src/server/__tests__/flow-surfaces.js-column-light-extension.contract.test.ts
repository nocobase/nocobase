/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowSurfacesService } from '../flow-surfaces/service';

const binding = {
  type: 'light-extension-entry',
  repoId: 'repo_fields',
  entryId: 'entry_column',
  kind: 'js-field',
};

describe('flowSurfaces JS column light-extension write contract', () => {
  it('writes binding-only source into canonical jsSettings.runJs without placeholder code', async () => {
    const service = new FlowSurfacesService({ db: {} } as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const updateSettings = vi.spyOn(service, 'updateSettings').mockResolvedValue({ uid: 'column-1' });

    await (service as any).configureJSColumn(
      { uid: 'column-1' },
      {
        sourceBinding: binding,
        settings: {
          currency: 'USD',
        },
      },
      {},
    );

    expect(updateSettings).toHaveBeenCalledWith(
      {
        target: { uid: 'column-1' },
        props: {},
        stepParams: {
          jsSettings: {
            runJs: {
              sourceMode: 'light-extension',
              sourceBinding: binding,
              settings: {
                currency: 'USD',
              },
            },
          },
        },
      },
      {},
    );
    expect(updateSettings.mock.calls[0][0].stepParams.jsSettings.runJs.code).toBeUndefined();
    expect(updateSettings.mock.calls[0][0].stepParams.sourceMode).toBeUndefined();
  });
});
