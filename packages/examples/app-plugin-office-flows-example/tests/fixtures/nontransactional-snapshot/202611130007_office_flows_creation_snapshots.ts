import { defineMigration } from '@nocobase/db';
import migration from '../../../database/migrations/202611130007_office_flows_creation_snapshots.js';

// Ensure conflict preflight does not depend on transactional DDL rollback.
export default defineMigration({ ...migration, transaction: false });
