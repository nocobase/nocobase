import { waitFor, screen } from '@testing-library/react';

export async function checkSchema(matchObj?: Record<string, any>) {
  const objText = screen.queryByTestId('test-schema');

  await waitFor(() => {
    expect(JSON.parse(objText.textContent)).toMatchObject(matchObj);
  });
}
