# Verification App Plugin

The Verification plugin sends one-time codes for application-defined scenarios, verifies phone ownership, and issues short-lived credentials for sensitive operations. It delivers SMS through the Notification plugin's transient send interface.

Install and register the Server entries for Authentication, Notification, Notification Providers, and Verification in the host application, along with Notification's dependencies. Apply the pending database migrations. Register application scenes and step-up purposes during provider boot. See the [integration Skill](skills/nocobase-app-plugin-verification/SKILL.md) for configuration, access policies, and a sub-application migration example.
