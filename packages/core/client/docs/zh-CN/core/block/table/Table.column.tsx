import { useField } from '@formily/react';
import React from 'react';

export const TableColumn = () => {
  const field = useField();
  return <div role="button">{field.title}</div>;
};
