# Authentication: SAML 2.0

<PluginInfo commercial="true" name="auth-saml"></PluginInfo>

## Introduction

The Authentication: SAML 2.0 plugin follows the SAML 2.0 (Security Assertion Markup Language 2.0) protocol standard, enabling users to log in to NocoBase using accounts provided by a third-party Identity Provider (IdP).

## Enable Plugin


![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)


## Add SAML Authentication

Go to the User Authentication plugin management page.


![](https://static-docs.nocobase.com/202411130004459.png)


Add - SAML


![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)


## Configuration


![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)


- SSO URL - Provided by the IdP, the URL for single sign-on.
- Public Certificate - Provided by the IdP.
- IdP Issuer - Optional, provided by the IdP.
- http - Check this if your NocoBase application uses the http protocol.
- Use this field to bind the user - The field used to match and bind with existing users. You can choose email or username, with email as the default. The user information from the IdP must include an `email` or `username` field.
- Sign up automatically when the user does not exist - Whether to automatically create a new user when no existing user can be matched and bound.
- Usage - `SP Issuer / EntityID` and `ACS URL` are used to copy and fill into the corresponding configuration in the IdP.

## Field Mapping

Field mapping needs to be configured on the IdP's configuration platform. You can refer to the [example](./examples/google.md).

The fields available for mapping in NocoBase are:

- email (required)
- phone (only effective for platforms that support the `phone` scope, such as Alibaba Cloud, Lark)
- nickname
- username
- firstName
- lastName

`nameID` is carried by the SAML protocol and does not need to be mapped. It will be saved as the user's unique identifier.
Priority for new user's nickname: `nickname` > `firstName lastName` > `username` > `nameID`
Mapping user organizations and roles is not currently supported.

## Login

Visit the login page and click the button below the login form to initiate a third-party login.


![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)