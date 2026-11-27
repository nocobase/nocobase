# Verification App Plugin

The Verification plugin sends one-time codes for application-defined scenarios, verifies phone ownership, and issues short-lived credentials for sensitive operations. It delivers SMS through the Notification plugin's transient send interface.

Install and register the Server entries for Authentication, Notification, Notification Providers, and Verification in the host application, along with Notification's dependencies. Apply the pending database migrations. Register application scenes and step-up purposes during provider boot. See the [integration Skill](skills/nocobase-app-plugin-verification/SKILL.md) for configuration, access policies, and a sub-application migration example.

Use the typed API and React hooks from `@nocobase/app-plugin-verification/client` in an application that provides the Authentication client and Verification server. Follow the [client integration guide](skills/nocobase-app-plugin-verification/references/client.md) for first-time binding, changing a verified phone, and protecting a business operation with step-up verification.
