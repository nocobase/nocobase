import { expect } from 'vitest';
import { waitFor, screen } from '@testing-library/react';

export const sleep = async (timeout = 0) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

export const WaitApp = async () => {
  await waitFor(() => {
    // @ts-ignore
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  const loadError = screen.queryByText('Load Plugin Error');
  if (loadError) {
    expect(screen.queryByText('Load Plugin Error')).not.toBeInTheDocument();
  }

  const renderError = screen.queryByText('Render Failed');
  if (renderError) {
    expect(screen.queryByText('Render Failed')).not.toBeInTheDocument();
  }
};
