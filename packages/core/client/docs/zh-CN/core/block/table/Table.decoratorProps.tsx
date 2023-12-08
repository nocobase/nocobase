import { useState } from 'react';

export const useTableDecoratorProps = ({ fieldNames }) => {
  const [expandFlag, setExpandFlag] = useState(fieldNames ? true : false);
  return {
    expandFlag,
    setExpandFlag,
  };
};
