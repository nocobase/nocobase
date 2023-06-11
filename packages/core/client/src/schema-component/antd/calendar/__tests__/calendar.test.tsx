import moment from 'dayjs';
import React from 'react';
import { render, screen } from 'testUtils';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';

describe('Calendar', () => {
  it('basic', () => {
    render(<App1 />);

    const currentDate = moment().format('YYYY-M');

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText(currentDate)).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
  });

  it('use CalendarBlockProvider', () => {
    render(<App2 />);

    const currentDate = moment().format('YYYY-M');

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText(currentDate)).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
  });
});
