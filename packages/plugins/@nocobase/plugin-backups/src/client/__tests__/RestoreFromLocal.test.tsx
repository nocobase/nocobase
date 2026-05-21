import * as nocobaseClient from '@nocobase/client';
import { act, fireEvent, render, screen, userEvent, waitFor } from '@nocobase/test/client';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';
import { RestoreFromLocal } from '../components/RestoreFromLocal';
import { NAMESPACE } from '../constants';

vi.mock('@nocobase/client', async () => {
  const actual = await vi.importActual<typeof nocobaseClient>('@nocobase/client');
  return {
    ...actual,
    useApp: () => ({
      i18n: {
        t: vi.fn().mockImplementation((key) => key), // Mock translation function, return the key directly
      },
    }),
  };
});

describe('RestoreFromLocal', () => {
  let axioMocked: MockAdapter;
  const mockedRestore = vi.fn().mockReturnValue({ data: { status: 'ok' } });

  const MockedRestoreFromLocal = () => {
    const api = nocobaseClient.useAPIClient();
    axioMocked = new MockAdapter(api.axios);
    axioMocked.onPost(`${NAMESPACE}:upload`).reply(() => {
      return [200, mockedRestore()];
    });
    return <RestoreFromLocal />;
  };

  test('should render restore from backup button', async () => {
    render(<MockedRestoreFromLocal />);
    expect(screen.getByText('Restore backup from local')).toBeInTheDocument();
  });

  test('should trigger restore api', async () => {
    const file = new File([''], 'backup_20240818_182302_2122.nbdata', { type: 'application/octet-stream' });
    const user = userEvent.setup();
    render(<MockedRestoreFromLocal />);
    await act(async () => {
      user.click(screen.getByText('Restore backup from local'));
    });
    await waitFor(() => {
      const fileBtn = screen.getByText((content, element) => {
        return element.tagName.toLowerCase() === 'input' && element['type'] === 'file';
      });
      fireEvent.change(fileBtn, { target: { files: [file] } });
    });
    await act(async () => {
      user.click(screen.getByText('Submit'));
    });
    await waitFor(() => {
      expect(mockedRestore).toHaveBeenCalled();
    });
  });
});
