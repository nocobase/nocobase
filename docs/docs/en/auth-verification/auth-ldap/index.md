# Auth: LDAP

<PluginInfo commercial="true" name="auth-ldap"></PluginInfo>

## Introduction

The Auth: LDAP plugin follows the LDAP (Lightweight Directory Access Protocol) protocol standard, enabling users to sign in to NocoBase using their LDAP server credentials.

## Activate plugin

<img src="https://static-docs.nocobase.com/202405101600789.png"/>

## Add LDAP Authentication

Go to the authentication plugin settings page.

<img src="https://static-docs.nocobase.com/202405101601510.png"/>

Add - LDAP

<img src="https://static-docs.nocobase.com/202405101602104.png"/>

## Configuration

### Basic Configuration

<img src="https://static-docs.nocobase.com/202405101605728.png"/>

- Sign up automatically when the user does not exist - Whether to automatically create a new user when no matching existing user is found.
- LDAP URL - LDAP server URL
- Bind DN - DN used to test server connection and search for users
- Bind password - Password of Bind DN
- Test connection - Click the button to test server connection and Bind DN authentication.

### Search Configuration

<img src="https://static-docs.nocobase.com/202405101609984.png"/>

- Search DN - DN used to search for users
- Search filter - Filtering condition for searching users, using `{{account}}` to represent the user account used for login
- Scope - `Base`, `One level`, `Subtree`, default `Subtree`
- Size limit - Search page size

### Attribute Mapping

<img src="https://static-docs.nocobase.com/202405101612814.png"/>

- Use this field to bind the user - Field used to bind existing users. If the login account is a username, choose username; if it is an email, choose email. Default is username.
- Attribute map - Mapping of user attributes to fields in the NocoBase user table.

## Sign In

Visit the sign in page and enter LDAP username and password in the sign in form.

<img src="https://static-docs.nocobase.com/202405101614300.png"/>
