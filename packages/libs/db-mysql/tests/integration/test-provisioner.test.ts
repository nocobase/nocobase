import { describeTestDatabaseProvisioner } from '@nocobase/db-testkit';
import { testDatabaseProvisioner } from '../../src/testing.js';

describeTestDatabaseProvisioner('mysql', testDatabaseProvisioner);
