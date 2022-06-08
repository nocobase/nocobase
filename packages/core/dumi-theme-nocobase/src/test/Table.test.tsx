import '@testing-library/jest-dom';
import { render, fireEvent, act } from '@testing-library/react';
import Table from '../builtins/Table';
import React from 'react';

describe('test Table', () => {
  it('should render folded shadows', async () => {
    const text = 'Cell';
    const { container, queryByText } = render(
      <Table>
        <tbody>
          <tr>
            <td>{text}</td>
          </tr>
        </tbody>
      </Table>,
    );

    // mock offset & scroll value
    const content = container.querySelector('.__dumi-default-table-content');

    Object.defineProperties(content, {
      offsetWidth: { get: () => 100 },
      scrollLeft: { get: () => 10 },
      scrollWidth: { get: () => 120 },
    });

    // trigger scroll event to re-render
    fireEvent(content, new Event('scroll'));

    // wait for throttle
    await act(() => new Promise(resolve => setTimeout(resolve, 200)));

    // expect content be rendered
    expect(queryByText(text)).not.toBeNull();

    // expect folded shadows be rendered
    expect(content.hasAttribute('data-left-folded')).toBeTruthy();
    expect(content.hasAttribute('data-right-folded')).toBeTruthy();
  });
});
