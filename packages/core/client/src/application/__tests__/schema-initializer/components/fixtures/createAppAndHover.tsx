import { screen, userEvent, waitFor } from '@nocobase/test/client';

import { createApp } from '../../fixures/createApp';
import { SchemaInitializerItemType } from '@nocobase/client';

export async function createAndHover(items: SchemaInitializerItemType[], appOptions: any = {}) {
  await createApp({ items }, appOptions);
  await userEvent.hover(screen.getByText('Test'));

  await waitFor(async () => {
    expect(screen.queryByRole('tooltip')).toBeInTheDocument();
  });
}
