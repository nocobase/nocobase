import { useContext } from 'react';
import { Application } from '../Application';
import { ApplicationContext } from '../context';

export const useApp = () => {
  return useContext(ApplicationContext) || ({} as Application);
};
