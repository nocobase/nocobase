import React from 'react';
import { render } from '@testing-library/react';
import { APIClientProvider } from '../APIClientProvider';
import { isFunction, isBoolean } from 'lodash';
import { APIClient } from '../APIClient';
import { useRequest } from '../hooks/useRequest';

const ComponentA = () => {
  const { data, loading, refresh, run, params } = useRequest({
    url: 'users:get',
    method: 'get',
  });
  return <div>{`loading:${isBoolean(loading)}, refresh:${isFunction(refresh)}, run:${isFunction(run)}`}</div>;
};

describe('APIClientProvider', () => {
  it('useRequest is ok', () => {
    const apiClient = new APIClient({
      baseURL: 'http://localhost/api/',
    });
    const { container } = render(
      <APIClientProvider apiClient={apiClient}>
        <ComponentA />
      </APIClientProvider>,
    );

    expect(container).toMatchSnapshot();
  });
});
