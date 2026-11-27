# @nocobase/app-plugin-verification

## 0.1.0-beta.1

### Patch Changes

- 1952789: Declare whether each product plugin is enabled by default, preinstalled only, available separately, or deprecated.
- cf23bfe: Stop publishing CHANGELOG.md in the package; the changelog stays in the repository.
- Updated dependencies [888bca5]
- Updated dependencies [1952789]
- Updated dependencies [cf23bfe]
  - @nocobase/app-plugin-authentication@2.0.0-beta.27
  - @nocobase/app-plugin-notification@2.0.0-beta.12
  - @nocobase/app-plugin-notification-providers@1.0.0-beta.23

## 0.1.0-beta.0

### Minor Changes

- dd0f4bd: Add typed browser requests and React hooks for sending verification codes, reading and binding verified phones, and exchanging codes for step-up credentials.
- 87e3dac: Add a Server plugin for one-time SMS verification codes, verified phone binding, and short-lived step-up credentials for sensitive operations.

### Patch Changes

- cc0bf33: Run outstanding sample data when enabled on existing databases. Write seed history only after a successful run and omit disabled sample seeds from dry-run plans. Apply the preview environment's sample data setting on every deployment and document the guidance for adding sample seeds to business changes.
- 91a8ff2: Route SMS, SMS provider setup, verification codes, verified phone binding, step-up confirmation and their browser hooks to the right Skills from the application development Skill, and cross-link the notification, notification providers and verification Skills with the rule that one-time credentials never go through ordinary notification sends.
- 87e3dac: Apply the authentication proxy rules to anonymous verification sends, give signed-in users their own send quota, and preserve the old-phone credential when the new-phone code is incorrect.
- Updated dependencies [cc0bf33]
- Updated dependencies [4561d5f]
- Updated dependencies [87e3dac]
- Updated dependencies [52d0b0d]
- Updated dependencies [c12d990]
- Updated dependencies [1b92cdb]
- Updated dependencies [1b92cdb]
- Updated dependencies [1b92cdb]
- Updated dependencies [78bdca8]
- Updated dependencies [91a8ff2]
- Updated dependencies [87e3dac]
- Updated dependencies [9acf418]
  - @nocobase/app-server@5.0.0-beta.12
  - @nocobase/db@1.0.0-beta.31
  - @nocobase/app-plugin-notification-providers@1.0.0-beta.22
  - @nocobase/app-plugin-notification@2.0.0-beta.11
  - @nocobase/app-plugin-authentication@2.0.0-beta.26
  - @nocobase/app-client@4.0.0-beta.14

## 0.0.1
