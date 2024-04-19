import React from 'react';
import { FC } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { BlockItemCard } from './BlockItemCard';
import { ErrorFallback } from '../error-fallback';

const FallbackComponent: FC<FallbackProps> = (props) => {
  return (
    <BlockItemCard>
      <ErrorFallback {...props} />
    </BlockItemCard>
  );
};

export const BlockItemError: FC = ({ children }) => {
  const handleErrors = (error) => {
    console.error(error);
  };
  return (
    <ErrorBoundary FallbackComponent={FallbackComponent} onError={handleErrors}>
      {children}
    </ErrorBoundary>
  );
};
