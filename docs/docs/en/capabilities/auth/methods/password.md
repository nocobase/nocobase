---
title: 'Password authentication'
description: 'Sign in with an account and configure registration, password requirements, and password recovery.'
---

# Password authentication

Password authentication lets users sign in with a username or email and a password. The default application template includes sign-in, registration, forgot-password, and reset-password pages. A session maintains the user's identity after sign-in.

## Sign in and sign out

Open the application, enter your account and password, and click Sign in. The initial administrator account follows the configuration used when creating the application.

![Sign in with a username or email and password](../../../../cn/capabilities/auth/assets/password-login.png)

After sign-in, you enter the application. To sign out, open the user menu in the upper-right corner and click Sign out. Sign in again the next time you visit a page that requires authentication.

## Disable self-registration

For internal applications, administrators often create employee accounts. Give your development Agent this requirement:

```text
This application is for company employees only. Administrators create all accounts.
Disable self-registration and remove the registration link from the sign-in page.
Existing employees must still be able to sign in with their accounts and passwords.
Keep the forgot-password link.
```

The sign-in page no longer shows Sign up. Administrators can still create accounts through user management. Disabling registration requires both server rules and page changes; hiding a link alone is insufficient.

![Sign-in page with self-registration disabled](../../../../cn/capabilities/auth/assets/password-registration-closed.png)

## Change password requirements

Describe the requirements for new passwords:

```text
Require at least 12 characters when registering or resetting a password.
Show this requirement in both forms and use consistent validation messages.
Keep existing accounts able to sign in without requiring an immediate password change.
```

Your development Agent updates authentication configuration and forms. Users follow the instructions on the page when setting a new password.

## Verify email addresses

To confirm that a registration email belongs to the user, require verification before sign-in:

```text
Send an email verification message after registration using the application's existing email notification channel.
Allow sign-in only after email verification. Explain that the user must open their email to complete verification.
```

Email verification requires an available email channel and a connection between that channel and authentication's verification flow. See [notifications](../../notification) for preparing email delivery. Application developers connect delivery to registration verification.

## Recover and reset passwords

After configuring an email channel and connecting it to password recovery, users can reset their passwords through the existing forgot-password and reset-password pages. Give your development Agent this requirement:

```text
Connect password recovery to the application's configured email channel.
Users click Forgot password on the sign-in page, enter their email, and receive a reset link.
The link opens this application's reset-password page. After setting a new password, return to the sign-in page.
Show the same submission message whether or not the email belongs to an account.
```

Users click Forgot password?, enter their email, open the received link, set a new password, and sign in again. The authentication flow manages link expiration and one-time use.

## Sign-in state

Refreshing the page reads the existing session, so users do not need to enter their password every time. An expired session requires sign-in again. Disabled accounts cannot continue accessing features that require authentication. See [protect APIs and pages](../advanced/protecting-apis) for using sessions in custom features.
