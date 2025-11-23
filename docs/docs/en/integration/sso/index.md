# Single Sign-On (SSO) Integration

NocoBase provides comprehensive Single Sign-On (SSO) solutions, supporting multiple mainstream authentication protocols for seamless integration with existing enterprise identity systems.

## Overview

Single Sign-On allows users to access multiple related but independent systems with a single set of credentials. Users authenticate once and gain access to all authorized applications without repeated login prompts. This enhances user experience while improving security and administrative efficiency.

## Supported Authentication Protocols

NocoBase supports the following authentication protocols and methods through plugins:

### Enterprise SSO Protocols

- **[SAML 2.0](/plugins/@nocobase/plugin-auth-saml/)**: XML-based open standard widely used for enterprise identity authentication. Suitable for integration with enterprise Identity Providers (IdP).

- **[OIDC (OpenID Connect)](/plugins/@nocobase/plugin-auth-oidc/)**: Modern authentication layer built on OAuth 2.0, providing authentication and authorization mechanisms. Supports integration with major identity providers (Google, Azure AD, etc.).

- **[CAS (Central Authentication Service)](/plugins/@nocobase/plugin-auth-cas/)**: SSO protocol developed by Yale University, widely adopted in higher education institutions.

- **[LDAP](/plugins/@nocobase/plugin-auth-ldap/)**: Lightweight Directory Access Protocol for accessing and maintaining distributed directory information services. Suitable for integration with Active Directory or other LDAP servers.

### Third-Party Platform Authentication

- **[WeCom (WeChat Work)](/plugins/@nocobase/plugin-auth-wecom/)**: Supports WeCom QR code login and in-app seamless authentication.

- **[DingTalk](/plugins/@nocobase/plugin-auth-dingtalk/)**: Supports DingTalk QR code login and in-app seamless authentication.

### Other Authentication Methods

- **[SMS Verification](/plugins/@nocobase/plugin-auth-sms/)**: Mobile phone SMS-based verification code authentication.

- **[Username/Password](/plugins/@nocobase/plugin-auth/)**: NocoBase's built-in basic authentication method.

## Integration Steps

### 1. Install Authentication Plugin

Based on your requirements, locate and install the appropriate authentication plugin from the plugin manager. Most SSO authentication plugins require separate purchase or subscription.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2. Configure Authentication Method

1. Navigate to **System Settings > User Authentication**
2. Click **Add Authentication Method**
3. Select the installed authentication type
4. Configure the required parameters as prompted

### 3. Configure Identity Provider

Each authentication protocol requires specific Identity Provider configuration:

- **SAML**: Configure IdP metadata, certificates, etc.
- **OIDC**: Configure Client ID, Client Secret, discovery endpoint, etc.
- **CAS**: Configure CAS server address
- **LDAP**: Configure LDAP server address, Bind DN, etc.
- **WeCom/DingTalk**: Configure application credentials, Corp ID, etc.

### 4. Test Authentication

After configuration, perform a test login:

1. Log out of the current session
2. Select the configured SSO method on the login page
3. Complete the Identity Provider authentication flow
4. Verify successful login to NocoBase

## User Mapping and Role Assignment

Upon successful SSO authentication, NocoBase automatically handles user accounts:

- **First Login**: Automatically creates a new user account and syncs basic information (nickname, email, etc.) from the Identity Provider
- **Subsequent Logins**: Uses the existing account; optionally syncs updated user information
- **Role Assignment**: Configure default roles or automatically assign roles based on user attributes from the Identity Provider

## Security Recommendations

1. **Use HTTPS**: Ensure NocoBase is deployed with HTTPS to protect authentication data transmission
2. **Regular Certificate Updates**: Promptly update and rotate security credentials such as SAML certificates
3. **Configure Callback URL Whitelist**: Properly configure NocoBase callback URLs in the Identity Provider
4. **Principle of Least Privilege**: Assign appropriate roles and permissions to SSO users
5. **Enable Audit Logging**: Record and monitor SSO login activities

## Troubleshooting

### SSO Login Failure?

1. Verify Identity Provider configuration is correct
2. Ensure callback URLs are properly configured
3. Check NocoBase logs for detailed error messages
4. Confirm certificates and keys are valid

### User Information Not Syncing?

1. Check user attributes returned by the Identity Provider
2. Verify field mapping configuration is correct
3. Confirm user information sync option is enabled

### How to Support Multiple Authentication Methods?

NocoBase supports configuring multiple authentication methods simultaneously. Users can select their preferred method on the login page.

## Related Resources

- [Authentication Plugin Documentation](/plugins/@nocobase/plugin-auth/)
- [API Keys Authentication](/integration/api-keys/)
- [User and Permission Management](/plugins/@nocobase/plugin-users/)
