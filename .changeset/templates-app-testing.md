---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
'@nocobase/app-skills': patch
---

The templates' tests take their databases from `@nocobase/app-testing`, now a development dependency of every template and of the applications they generate. The application server tests start the template on test databases written by `createTestAppConfig()` instead of SQLite files, so they run on the dialect `NOCOBASE_TEST_DB_DIALECT` selects. The examples template gains a test that signs in through the application with `@nocobase/app-plugin-authentication/testing` and checks that the sales confidentiality restriction leaves confidential quotes out of a proposal engineer's list and in an administrator's, and that they appear once the restriction is no longer assigned. The `nocobase-app-development` Skill's testing reference describes testing through the whole application, where a test's databases come from, and `describeMigration()` for migrations.
