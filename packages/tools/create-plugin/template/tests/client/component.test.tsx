import { describe, expect, it } from 'vitest';

import { __NOCOBASE_SYMBOL_NAME__Component } from '../../client/components/plugin-component.js';

describe(__NOCOBASE_PACKAGE_NAME_LITERAL__, () => {
  it('renders its Client component', () => {
    expect(__NOCOBASE_SYMBOL_NAME__Component()).toMatchObject({
      type: 'div',
      props: { children: __NOCOBASE_DISPLAY_NAME_LITERAL__ },
    });
  });
});
