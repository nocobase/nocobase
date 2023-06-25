import { RecursionField } from '@formily/react';
import React from 'react';
import { configurationSchema } from './schema';

export const Configuration = () => {
  return <RecursionField schema={configurationSchema} />;
};
