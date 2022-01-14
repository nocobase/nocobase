import { isValid } from '@formily/shared';
import { createContext, useContext } from 'react';

export const PlaceholderContext = createContext<string>('');

export const usePlaceholder = (value?: any) => {
  const placeholder = useContext(PlaceholderContext) || '';
  return isValid(value) && value !== '' ? value : placeholder;
};
