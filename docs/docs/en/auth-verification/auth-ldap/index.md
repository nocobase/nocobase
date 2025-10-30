# Authentication: LDAP

<PluginInfo commercial="true" name="auth-ldap"></PluginInfo>

## Introduction

The Authentication: LDAP plugin follows the LDAP (Lightweight Directory Access Protocol) standard, allowing users to log in to NocoBase using their LDAP server account and password.

## Activate Plugin

<img src="https://static-docs.nocobase.com/202405101600789.png"/>

## Add LDAP Authentication

Go to the user authentication plugin management page.

<img src="https://static-docs.nocobase.com/202405101601510.png"/>

Add - LDAP

<img src="https://static-docs.nocobase.com/202405101602104.png"/>

## Configuration

### Basic Configuration

<img src="https://static-docs.nocobase.com/202405101605728.png"/>

- Sign up automatically when the user does not exist - Whether to automatically create a new user when no existing user can be found for binding.
- LDAP URL - The address of the LDAP server.
- Bind DN - The DN used to test server connectivity and search for users.
- Bind password - The password for the Bind DN.
- Test connection - Click the button to test server connectivity and the validity of the Bind DN.

### Search Configuration

<img src="https://static-docs.nocobase.com/202405101609984.png"/>

- Search DN - The DN used to search for users.
- Search filter - The filter condition for searching users. Use `{{account}}` to represent the user account used for login.
- Scope - `Base`, `One level`, `Subtree`. Default is `Subtree`.
- Size limit - The page size for search results.

### Attribute Mapping

<img src="https://static-docs.nocobase.com/202405101612814.png"/>

- Use this field to bind the user - The field used to bind to an existing user. If the login account is a username, select username; if it is an email, select email. The default is username.
- Attribute map - The mapping between user attributes and the fields of the NocoBase users collection.

## Login

Visit the login page and enter the LDAP username and password in the login form to log in.

<img src="https://static-docs.nocobase.com/202405101614300.png"/>