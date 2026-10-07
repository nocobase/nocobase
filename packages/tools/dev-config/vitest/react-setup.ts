import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// The 1s default is too short when a whole workspace's suites share one CI machine.
configure({ asyncUtilTimeout: 5000 });

afterEach(cleanup);
