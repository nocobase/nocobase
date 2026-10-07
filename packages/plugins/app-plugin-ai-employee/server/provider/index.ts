export { AIEmployeeProvider } from './ai-employee.js';
export { AIEmployeeAuthorizationProvider } from './authorization.js';

import { AIEmployeeProvider } from './ai-employee.js';
import { AIEmployeeAuthorizationProvider } from './authorization.js';

export default [AIEmployeeAuthorizationProvider, AIEmployeeProvider] as const;
