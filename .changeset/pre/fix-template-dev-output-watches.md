---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Exclude the application's complete build output from Vite file watching to prevent EMFILE errors after a build, while preserving hot updates for linked workspace dependencies.

Check native file watching before development startup, fall back to polling with agent annotations disabled when native watchers are unavailable, and poll application configuration files so watcher resource errors no longer crash the development process.
