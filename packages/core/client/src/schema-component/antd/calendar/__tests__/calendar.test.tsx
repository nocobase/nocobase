import dayjs from 'dayjs';
import React from 'react';
import { render, screen, waitFor } from 'testUtils';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';

describe('Calendar', () => {
  it('basic', async () => {
    render(<App1 />);

    await waitFor(() => {
      const currentDate = dayjs().format('YYYY-M');

      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText(currentDate)).toBeInTheDocument();
      expect(screen.getByText('Month')).toBeInTheDocument();
    });
  });

  it('use CalendarBlockProvider', async () => {
    render(<App2 />);

    await waitFor(() => {
      const currentDate = dayjs().format('YYYY-M');

      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText(currentDate)).toBeInTheDocument();
      expect(screen.getByText('Month')).toBeInTheDocument();
    });
  });
});
