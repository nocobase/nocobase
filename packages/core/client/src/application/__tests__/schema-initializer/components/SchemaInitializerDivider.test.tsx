import { screen } from '@nocobase/test/client';

import { createAndHover } from './fixtures/createAppAndHover';

describe('SchemaInitializerDivider', () => {
  it('basic', async () => {
    await createAndHover([
      {
        name: 'a',
        type: 'item',
        title: 'A',
      },
      {
        type: 'divider',
        name: 'divider1',
      },
      {
        name: 'b',
        type: 'item',
        title: 'B',
      },
    ]);

    expect(screen.queryByText('A')).toBeInTheDocument();
    expect(screen.queryByText('B')).toBeInTheDocument();
    expect(document.querySelector('.ant-divider')).toBeInTheDocument();
  });
});
