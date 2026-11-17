import type { DependencyManifest } from '../../shared/capability-guide/index.js';

/**
 * A synthetic application manifest for the guide's tests: core modules listed and not listed, ordinary, example and
 * Skill-only plugins, and a third-party plugin the guide has no wording for. The templates check their own manifests.
 */
export const SAMPLE_MANIFEST: DependencyManifest = {
  dependencies: {
    '@nocobase/app-server': '*',
    '@nocobase/service-provider': '*',
    '@nocobase/authorization': '*',
    '@nocobase/caching': '*',
    '@nocobase/db': '*',
    '@nocobase/jobs': '*',
    '@nocobase/lifecycle': '*',
    '@nocobase/app-plugin-authorization': '*',
    '@nocobase/app-plugin-file': '*',
    '@nocobase/app-plugin-lifecycle-example': '*',
    '@acme/app-plugin-crm': '*',
  },
  devDependencies: {
    '@nocobase/app-client': '*',
    '@nocobase/drive': '*',
    '@nocobase/app-plugin-template-print': '*',
  },
};
