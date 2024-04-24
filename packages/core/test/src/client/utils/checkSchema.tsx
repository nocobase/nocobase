import { waitFor, screen } from '@testing-library/react';
import { expect } from 'vitest';

export async function checkSchema(matchObj?: Record<string, any>, name?: string) {
  const objText = screen.queryByTestId(name ? `test-schema-${name}` : `test-schema`);

  await waitFor(() => {
    expect(JSON.parse(objText.textContent)).toMatchObject(matchObj);
  });
}
