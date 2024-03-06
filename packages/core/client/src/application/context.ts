import { createContext } from 'react';
import { Application } from './Application';

export const ApplicationContext = createContext<Application>(null);
ApplicationContext.displayName = 'ApplicationContext';
