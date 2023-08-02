import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '../ErrorFallback';

const App = () => {
  throw new Error('error message');
};

export default () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={console.error}>
      <App />
    </ErrorBoundary>
  );
};
