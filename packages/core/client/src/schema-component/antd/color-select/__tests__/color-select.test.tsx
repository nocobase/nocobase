import React from 'react';
import { fireEvent, render, screen } from 'testUtils';
import App from '../demos/demo1';

describe('ColorSelect', () => {
  it('should display the value of user selected', async () => {
    const { container } = render(<App />);

    const selector = container.querySelector('.ant-select-selector');
    // @ts-ignore
    fireEvent.mouseDown(selector);
    // @ts-ignore
    expect(screen.getByText('Red')).toBeInTheDocument();
    // @ts-ignore
    expect(screen.getByText('Magenta')).toBeInTheDocument();
    // @ts-ignore
    expect(screen.getByText('Volcano')).toBeInTheDocument();
    // @ts-ignore
    expect(screen.getByText('Orange')).toBeInTheDocument();
    // @ts-ignore
    expect(screen.getByText('Gold')).toBeInTheDocument();
    // @ts-ignore
    expect(screen.getByText('Lime')).toBeInTheDocument();
    // @ts-ignore
    expect(screen.getByText('Green')).toBeInTheDocument();
    // @ts-ignore
    expect(screen.getByText('Cyan')).toBeInTheDocument();
    // @ts-ignore
    expect(screen.getByText('Blue')).toBeInTheDocument();
    // @ts-ignore
    expect(screen.getByText('Geek blue')).toBeInTheDocument();
    // @ts-ignore
    expect(screen.getByText('Purple')).toBeInTheDocument();
    // @ts-ignore
    expect(screen.getByText('Default')).toBeInTheDocument();

    // select red
    fireEvent.click(screen.getByText('Red'));
    expect(screen.getAllByText('Red').length).toBe(3);
  });
});
