import { useContext } from 'react';
import { VariablesContext } from '../VariablesProvider';

const useVariables = () => {
  return useContext(VariablesContext);
};

export default useVariables;
