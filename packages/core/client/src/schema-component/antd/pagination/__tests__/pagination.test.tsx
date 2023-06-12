import React from 'react';
import { render } from 'testUtils';
import { Pagination } from '../index';

describe('Pagination', () => {
  it('should render correctly', () => {
    render(<Pagination />);
    expect(document.querySelector('.ant-pagination')).toBeInTheDocument();
  });

  it('hidden', () => {
    render(<Pagination hidden />);
    expect(document.querySelector('.ant-pagination')).not.toBeInTheDocument();
  });
});
