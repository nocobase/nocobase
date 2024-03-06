import { createContext } from 'react';
import { APIClient } from './APIClient';

export const APIClientContext = createContext<APIClient>(new APIClient());
APIClientContext.displayName = 'APIClientContext';
