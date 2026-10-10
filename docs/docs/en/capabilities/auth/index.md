---
title: 'Overview'
description: 'Sign-in, sessions, API keys, and authentication extensions in NocoBase.'
---

# Authentication

Authentication identifies the user or program accessing an application. NocoBase provides account sign-in, sessions, and API keys that applications can reuse. You can also connect company accounts or third-party sign-in to avoid building another account system.

## Available capabilities

| Capability                                             | What it provides                                                         | How to use it                                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| [Password authentication](./methods/password)          | Username or email sign-in, registration, and password recovery           | The default template includes the pages; password recovery and email verification require email delivery |
| [API keys](./methods/api-keys)                         | Let scripts and external systems call application APIs as a user         | Create and manage keys in Settings                                                                       |
| [Add authentication methods](./custom/sign-in-methods) | Sign in with GitHub or a company identity platform                       | Connect the platform's sign-in flow                                                                      |
| [Customize sign-in pages](./custom/login-pages)        | Change branding, copy, and the layout of sign-in options                 | Ask your development Agent to update the application's sign-in page                                      |
| [Protect APIs and pages](./advanced/protecting-apis)   | Require sign-in for custom business features and access the current user | Connect authentication to business pages and server APIs                                                 |

After sign-in, a session identifies the current user. Signing out ends the current session. Authentication also handles account disabling and session revocation.

Authentication establishes who you are; [authorization](../authorization) determines what you can do. Signing in to a procurement application uses authentication. Restricting buyers to their own orders uses authorization rules.

Third-party, company, and passwordless sign-in use the underlying Better Auth extension mechanism. They are not enabled sign-in options in the default template. Choose the methods your application needs.
