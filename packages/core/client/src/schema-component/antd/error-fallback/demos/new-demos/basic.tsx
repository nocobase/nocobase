

import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '@nocobase/client';
import { Button } from 'antd';

const App = () => {
  const [showError, setShowError] = React.useState(false);

  if (showError) {
    throw new Error('error message');
  }

  return (
    <Button danger onClick={() => setShowError(true)}>
      show error
    </Button>
  );
};

export default () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={console.error}>
      <App />
    </ErrorBoundary>
  );
};
