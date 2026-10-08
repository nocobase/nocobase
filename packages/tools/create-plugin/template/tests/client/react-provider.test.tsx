import type { PropsWithChildren, ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import reactProviders from '../../client/react-providers/index.js';

function Children({ children }: PropsWithChildren): ReactElement {
  return <>{children}</>;
}

describe(__NOCOBASE_PACKAGE_NAME_LITERAL__, () => {
  it('declares its Client React Provider', () => {
    expect(reactProviders).toMatchObject([
      {
        name: __NOCOBASE_SHORT_NAME_LITERAL__,
        component: expect.any(Function),
      },
    ]);
    expect(
      reactProviders[0]?.component({ children: <Children /> }),
    ).toBeDefined();
  });
});
