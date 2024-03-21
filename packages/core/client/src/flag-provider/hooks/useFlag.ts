import { useContext } from 'react';
import { FlagContext } from '../FlagProvider';

export const useFlag = () => {
  return useContext(FlagContext);
};
