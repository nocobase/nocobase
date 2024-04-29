import { renderApp, screen, userEvent, waitFor } from '@nocobase/test/client';
import { DataSourceCollectionCascader } from '../CollectionSelect';

describe('DataSourceCollectionCascader', () => {
  test('should works', async () => {
    await renderApp({
      enableMultipleDataSource: true,
      schema: {
        type: 'string',
        'x-component': DataSourceCollectionCascader,
      },
    });

    await userEvent.click(document.querySelector('.ant-select-selector'));
    await waitFor(() => {
      expect(screen.queryByText('Main')).toBeInTheDocument();
      expect(screen.queryByText('Data Source 2')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Main'));

    await waitFor(() => {
      expect(screen.queryByText('Users')).toBeInTheDocument();
      expect(screen.queryByText('Roles')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Users'));

    await waitFor(() => {
      expect(document.querySelector('.ant-select-selector')).toHaveTextContent('Main / Users');
    });
  });
});
