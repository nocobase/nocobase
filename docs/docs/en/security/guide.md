# NocoBase Security Guide

NocoBase focuses on the security of data and applications from functional design to system implementation. The platform has built-in multiple security functions such as user authentication, access control, and data encryption, and also allows flexible configuration of security policies according to actual needs. Whether it is protecting user data, managing access permissions, or isolating development and production environments, NocoBase provides practical tools and solutions. This guide aims to provide guidance for the secure use of NocoBase, helping users protect the security of data, applications, and the environment, ensuring the efficient use of system functions under the premise of user security.

## User Authentication

User authentication is used to identify user identities, prevent users from entering the system without authorization, and ensure that user identities are not abused.

### Token Key

By default, NocoBase uses JWT (JSON Web Token) for authentication of server-side APIs. Users can set the Token key through the system environment variable `APP_KEY`. Please properly manage the application's Token key to prevent external leakage. Note that if `APP_KEY` is modified, old Tokens will also become invalid.

### Token Policy

NocoBase supports the setting of the following security policies for user Tokens:

| Configuration Item          | Description                                                                                                                                                                                                                                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session Validity            | The maximum valid time for each user login. During the session validity, the Token will be automatically updated. After the timeout, the user is required to log in again.                                                                                                                                                       |
| Token Validity              | The validity period of each issued API Token. After the Token expires, if it is within the session validity period and has not exceeded the refresh limit, the server will automatically issue a new Token to maintain the user session, otherwise the user is required to log in again. (Each Token can only be refreshed once) |
| Expired Token Refresh Limit | The maximum time limit allowed for refreshing a Token after it expires.                                                                                                                                                                                                                                                          |

Usually, we recommend administrators:

- Set a shorter Token validity period to limit the exposure time of the Token.
- Set a reasonable session validity period, which is longer than the Token validity period but should not be too long, to balance user experience and security. Use the automatic Token refresh mechanism to ensure that active user sessions are not interrupted while reducing the risk of long-term sessions being abused.
- Set a reasonable expired Token refresh limit so that the Token naturally expires when the user is inactive for a long time without issuing a new Token, reducing the risk of abuse of idle user sessions.

### Token Client Storage

By default, user Tokens are stored in the browser's LocalStorage. After closing the browser page and opening it again, if the Token is still valid, the user does not need to log in again.

If you want users to log in again every time they enter the page, you can set the environment variable `API_CLIENT_STORAGE_TYPE=sessionStorage` to save the user Token to the browser's SessionStorage, so as to achieve the purpose of users logging in again every time they open the page.

### Password Policy

> Professional Edition and above

NocoBase supports setting password rules and password login attempt lock policies for all users to enhance the security of NocoBase applications that have password login enabled. You can refer to [Password Policy](./password-policy/index.md) to understand each configuration item.

#### Password Rules

| Configuration Item                     | Description                                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Password Length**                    | The minimum password length requirement, the maximum length is 64.                                                 |
| **Password Complexity**                | Set the complexity requirements for the password, the types of characters that must be included.                   |
| **Can't Include Username in Password** | Set whether the password can include the current user's username.                                                  |
| **Remember Password History**          | Remember the number of passwords recently used by the user. The user cannot reuse them when changing the password. |

#### Password Expiration Configuration

| Configuration Item                                    | Description                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Password Validity Period**                          | The validity period of user passwords. Users must change their passwords before they expire in order to recalculate the validity period. If they do not change their passwords before they expire, they will not be able to log in with the old password and will need administrator assistance to reset it. <br>If other login methods are configured, the user can log in using other methods. |
| **Password Expiration Reminder Notification Channel** | Within 10 days before the user's password expires, a reminder will be sent each time the user logs in.                                                                                                                                                                                                                                                                                           |

#### Password Login Security

| Configuration Item                                         | Description                                                                                                                                                                                                                                               |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Maximum Invalid Password Login Attempts**                | Set the maximum number of login attempts a user can try within a specified time interval.                                                                                                                                                                 |
| **Maximum Invalid Password Login Time Interval (seconds)** | Set the time interval for calculating the user's maximum invalid login attempts, in seconds.                                                                                                                                                              |
| **Lock Time (seconds)**                                    | Set the time to lock the user after the user exceeds the invalid password login limit (0 means no limit). <br>During the period when the user is locked, it will be forbidden to access the system through any authentication method, including API keys. |

Usually, we recommend:

- Set strong password rules to reduce the risk of passwords being guessed by association or brute force.
- Set a reasonable password validity period to force users to change their passwords regularly.
- Combine the number of invalid password logins and time configuration to limit high-frequency password login attempts in a short time and prevent brute-force password cracking.
- If the security requirements are strict, you can set a reasonable time for locking the user after exceeding the login limit. However, it should be noted that the lock time setting may be maliciously used. Attackers may intentionally enter the wrong password multiple times for target accounts, forcing the accounts to be locked and unable to be used normally. In actual use, you can combine IP restrictions, API frequency restrictions, and other means to prevent such attacks.
- Change the default NocoBase root username, email, and password to prevent malicious use.
- Since both password expiration or account locking will prevent access to the system, including administrator accounts, it is recommended to set up multiple accounts in the system that have permission to reset passwords and unlock users.


![](https://static-docs.nocobase.com/202501031618900.png)


### User Lockout

> Professional Edition and above, included in the password policy plugin

Manage users who are locked out for exceeding the invalid password login limit. You can actively unlock them or actively add abnormal users to the lockout list. After a user is locked, they will be prohibited from accessing the system through any authentication method, including API keys.


![](https://static-docs.nocobase.com/202501031618399.png)


### API Keys

NocoBase supports calling system APIs through API keys. Users can add API keys in the API Keys plugin configuration.

- Please bind the correct role to the API key and ensure that the permissions associated with the role are properly configured.
- Prevent API keys from being leaked during use.
- Generally, we recommend that users set a validity period for API keys and avoid using the "Never expire" option.
- If an API key is found to be abnormally used and may be at risk of leakage, users can delete the corresponding API key to invalidate it.


![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)


### Single Sign-On (SSO)

> Commercial Plugin

NocoBase provides a rich set of SSO authentication plugins, supporting multiple mainstream protocols such as OIDC, SAML 2.0, LDAP, and CAS. At the same time, NocoBase also has a complete set of authentication method extension interfaces, which can support the rapid development and access of other authentication types. You can easily connect your existing IdP with NocoBase to centrally manage user identities on the IdP to enhance security.

![](https://static-docs.nocobase.com/202501031619427.png)


### Two-factor authentication

> Enterprise Edition

Two-factor authentication requires users to provide a second piece of valid information to prove their identity when logging in with a password, such as sending a one-time dynamic verification code to the user's trusted device, to verify the user's identity and ensure that the user's identity is not abused which reduces the risk of password leakage.

### IP Access Control

> Enterprise Edition

NocoBase supports setting blacklists or whitelists for user access IPs.

- In a strictly secure environment, you can set an IP whitelist to allow only specific IPs or IP ranges to access the system to restrict unauthorized external network connections and reduce security risks at the source.
- Under public network access conditions, if the administrator discovers abnormal access, they can set an IP blacklist to block known malicious IP addresses or accesses from suspicious sources, reducing security threats such as malicious scanning and brute force cracking.
- Log records are kept for rejected access requests.

## Permission Control

By setting different roles in the system and setting corresponding permissions for roles, you can finely control the permissions of users to access resources. Administrators need to configure reasonably according to the needs of actual scenarios to reduce the risk of system resource leakage.

### Root User

When NocoBase is initially installed, the application will initialize a root user. It is recommended that users modify the root user's information by setting system environment variables to avoid malicious exploitation.

- `INIT_ROOT_USERNAME` - root username
- `INIT_ROOT_EMAIL` - root user email
- `INIT_ROOT_PASSWORD` - root user password, please set a strong password.

During subsequent use of the system, it is recommended that users set up and use other administrator accounts, and avoid directly using the root user to operate the application.

### Roles and Permissions

NocoBase controls the permissions of users to access resources by setting roles in the system, authorizing different roles, and binding users to corresponding roles. Each user can have multiple roles, and users can switch roles to operate resources from different perspectives. If the department plugin is installed, you can also bind roles and departments, so that users can have the roles bound on their respective departments.


![](https://static-docs.nocobase.com/202501031620965.png)


### System Configuration Permissions

System configuration permissions include the following settings:

- Whether to allow the configuration interface
- Whether to allow to install, enable, and disable plugins
- Whether to allow to configure plugins
- Whether to allow to clear the cache and restart the application
- Configuration permissions for each plugin

### Menu Permissions

Menu permissions are used to control the permission of users to enter different menu pages, including desktop and mobile.

![](https://static-docs.nocobase.com/202501031620717.png)


### Data Permissions

NocoBase provides fine-grained control over the permissions of users to access data in the system, ensuring that different users can only access data related to their responsibilities, preventing overreach and data leakage.

#### Global Control


![](https://static-docs.nocobase.com/202501031620866.png)


#### Table-level, Field-level Control


![](https://static-docs.nocobase.com/202501031621047.png)


#### Data Scope Control

Set the scope of data that users can operate. Note that the scope of data here is different from the scope of data configured in the block. The scope of data configured in the block is usually only used for front-end filtering of data. If you need to strictly control the permission of users to access data resources, you need to configure it here, which is controlled by the server.


![](https://static-docs.nocobase.com/202501031621712.png)


## Data Security

During the data storage and backup process, NocoBase provides an effective mechanism to ensure data security.

### Password Storage

NocoBase users' passwords are encrypted and stored using the scrypt algorithm, which can effectively resist large-scale hardware attacks.

### Environment Variables and Keys

When using third-party services in NocoBase, we recommend that you configure the third-party key information into environment variables and store them encrypted. This is convenient for configuration and use in different places and also enhances security. You can refer to the documentation for detailed usage methods.

:::warning
By default, the key is encrypted using the AES-256-CBC algorithm. NocoBase will automatically generate a 32-bit encryption key and save it to storage/.data/environment/aes_key.dat. Users should properly keep the key file to prevent it from being stolen. If you need to migrate data, the key file needs to be migrated together.
:::


![](https://static-docs.nocobase.com/202501031622612.png)


### File Storage

If you need to store sensitive files, it is recommended to use a cloud storage service compatible with the S3 protocol and use the commercial plugin File storage: S3 (Pro) to enable private reading and writing of files. If you need to use it in the internal network environment, it is recommended to use storage applications that support private deployment and are compatible with the S3 protocol, such as MinIO.


![](https://static-docs.nocobase.com/202501031623549.png)


### Application Backup

To ensure the security of application data and avoid data loss, we recommend that you back up the database regularly.

Open-source edition can refer to https://www.nocobase.com/en/blog/nocobase-backup-restore to back up with database tools. We also recommend that you properly keep backup files to prevent data leakage.

Professional and above editions can use the backup manager for backups. The backup manager provides the following features:

- Scheduled automatic backup: Periodic automatic backups save time and manual operations, and data security is more secure.
- Synchronize backup files to cloud storage: Isolate backup files from the application service itself to prevent the loss of backup files while the service is unavailable due to server failure.
- Backup file encryption: Set a password for backup files to reduce the risk of data loss caused by backup file leakage.


![](https://static-docs.nocobase.com/202501031623107.png)


## Runtime Environment Security

Correctly deploying NocoBase and ensuring the security of the runtime environment is one of the keys to ensuring the security of NocoBase applications.

### HTTPS Deployment

To prevent man-in-the-middle attacks, we recommend that you add an SSL/TLS certificate to your NocoBase application site to ensure the security of data during network transmission.

### API Transport Encryption

> Enterprise Edition

In environments with more stringent data security requirements, NocoBase supports enabling API transport encryption to encrypt API request and response content, avoid clear text transmission, and increase the threshold for data cracking.

### Private Deployment

By default, NocoBase does not need to communicate with third-party services, and the NocoBase team will not collect any user information. It is only necessary to connect to the NocoBase server when performing the following two operations:

1. Automatically download commercial plugins through the NocoBase Service platform.
2. Online identity verification and application activation for commercial edition.

If you are willing to sacrifice a certain degree of convenience, these two operations also support offline completion and do not need to be directly connected to the NocoBase server.

NocoBase supports complete intranet deployment, refer to

- https://www.nocobase.com/en/blog/load-docker-image

### Multiple Environment Isolation

> Professional Edition and above

In actual use, we recommend enterprise users to isolate testing and production environments to ensure the security of application data and the runtime environment in the production environment. With the migration management plugin, you can migrate application data between different environments.


![](https://static-docs.nocobase.com/202501031627729.png)


## Auditing and Monitoring

### Audit Logs

> Enterprise Edition

NocoBase's audit log function records users' activity records in the system. By recording users' key operations and access behaviors, administrators can:

- Check users' access information such as IP, device, and operation time to detect abnormal behaviors in time.
- Trace the operation history of data resources in the system.


![](https://static-docs.nocobase.com/202501031627719.png)



![](https://static-docs.nocobase.com/202501031627922.png)


### Application Logs

NocoBase provides multiple log types to help users understand the system's running status and behavior records, so that system problems can be identified and located in a timely manner, ensuring the system's security and controllability from different dimensions. The main types of logs include:

- Request log: API request logs, including accessed URLs, HTTP methods, request parameters, response times, and status codes.
- System log: Records application running events, including service startup, configuration changes, error messages, and key operations.
- SQL log: Records database operation statements and their execution times, covering operations such as query, update, insert, and delete.
- Workflow log: Execution log of the workflow, including execution time, running information, and error information.