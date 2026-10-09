---
title: 'Add authentication methods'
description: 'Connect third-party accounts, a company identity platform, or an internal sign-in protocol.'
---

# Add authentication methods

An application can use an existing identity platform in addition to account passwords. Users authenticate with the platform and return to the application, which creates its own session and continues to apply existing business permissions.

## Supported approaches

| Requirement                                                        | Integration approach                                                           | What to prepare                                                       |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Sign in with GitHub, Google, or similar accounts                   | Platform configuration supported by Better Auth                                | Platform application details and a callback URL                       |
| Sign in with a company account                                     | Standard OAuth 2.0 or OIDC integration, such as Keycloak or Microsoft Entra ID | Identity platform address, application details, and account rules     |
| Sign in with DingTalk or Feishu                                    | Integrate the platform's authorization and user information APIs               | An open-platform application, sign-in permissions, and a callback URL |
| Email codes, sign-in links, Passkeys, or two-factor authentication | The corresponding authentication extension                                     | Email delivery, pages, and storage required by that method            |
| Use an internal ticket or signature protocol                       | A custom authentication extension                                              | Protocol documentation, verification API, and user identifiers        |

These methods require integration; they are not enabled sign-in options in the default template. Your development Agent selects an implementation based on the application's Better Auth version and the platform documentation.

## Prepare the integration

The identity platform administrator registers the business application, provides its identifier, service address, and required credentials, and registers the callback URL. Application developers implement the server integration and sign-in entry. The person responsible for configuration supplies credentials in the runtime environment.

Decide whether first sign-in can create an application account and whether accounts may be linked to existing accounts. Use the platform's stable user identifier to identify an account, rather than its display name alone.

## Example: company account sign-in

Employees should use the company's existing identity platform to enter the procurement application. This example uses OpenID Connect (OIDC), a standard sign-in protocol.

```text
Let employees sign in to the procurement application with our company identity platform using OIDC.

Keep account-password sign-in and add a Company account button.
The button opens the company identity platform. After successful sign-in, return to the procurement application's home page.

Allow first sign-in to create an application account, identified by the platform's stable user identifier.
Do not automatically link accounts by matching names or emails. New accounts use the application's default permissions.

List the information the identity platform administrator must provide and the callback URL they need to register.
```

Your development Agent provides the callback URL to register and the application's configuration requirements. The two sides must use matching addresses, including the application's public address and deployment subpath.

### Sign-in flow

**Step 1: choose company account sign-in.**

On the application's sign-in page, click Continue with Company account below the password form.

![Choose company account sign-in in the application](../../../../cn/capabilities/auth/assets/oidc-entry.png)

**Step 2: sign in on the identity platform.**

The browser opens the company identity platform's sign-in page. Enter your company account to sign in.

![Sign in on the company identity platform](../../../../cn/capabilities/auth/assets/oidc-provider-login.png)

**Step 3: return to the application.**

After sign-in, the browser returns to the procurement application. The user menu in the upper-right corner shows the company account's identity. An application session then provides access to business pages.

![Return to the application after company sign-in](../../../../cn/capabilities/auth/assets/oidc-signed-in.png)

## Other integration examples

### GitHub sign-in

```text
Add GitHub sign-in to this application and keep account-password sign-in.
Allow first sign-in to create an account. Do not automatically merge existing accounts with matching emails.
Open the home page after sign-in.
Explain which application to create in GitHub, the configuration to provide, and the callback URL to register.
```

The GitHub application owner creates an OAuth application and registers the callback URL. Application developers implement the sign-in button and callback flow. For configuration details, see the [Better Auth GitHub guide](https://www.better-auth.com/docs/authentication/github).

### Internal company protocol

```text
The company portal redirects to this application with a one-time ticket.
Follow the supplied protocol documentation to call the portal's verification API, obtain the user identity, and sign in to the application.
Identify accounts by the stable user identifier returned by the portal. Do not create accounts automatically on first sign-in.
Keep account-password sign-in and open the home page after sign-in.
```

Provide protocol documentation and an account for demonstration, and specify how portal identities map to existing application accounts. Your development Agent connects the protocol through an authentication extension; the application's authentication capability still creates the session.

## Further customization

Specify first-sign-in, linking, and sign-out rules in your requirements. For example, administrators may need to assign accounts before company sign-in is allowed, or signing out of the application may also need to sign out of the identity platform.

Depending on the authentication method, integration may involve storing identity platform user identifiers or adding pages for account linking. Your development Agent implements these as part of the sign-in flow.
