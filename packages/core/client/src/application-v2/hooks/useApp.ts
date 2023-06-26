import { useContext } from 'react';
import { ApplicationContext } from '../context';

export const useApp = () => {
  return useContext(ApplicationContext);
};
