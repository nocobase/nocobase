import { defineMigration } from '@nocobase/db';
import migration from '../../../database/migrations/202611130006_lifecycle_example_start_snapshots.js';

// Test the real migration without relying on an outer transaction to undo writes.
export default defineMigration({ ...migration, transaction: false });
