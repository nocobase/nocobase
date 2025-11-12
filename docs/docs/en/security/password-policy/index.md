---
pkg: '@nocobase/plugin-password-policy'
---

# Password Policy

## Introduction

Set password rules, password expiration, and password login security policies for all users, and manage locked users.

## Password Rules


![](https://static-docs.nocobase.com/202412281329313.png)


### Minimum Password Length

Set the minimum length requirement for passwords, with a maximum length of 64.

### Password Complexity Requirements

The following options are supported:

- Must contain letters and numbers
- Must contain letters, numbers, and symbols
- Must contain numbers, uppercase and lowercase letters
- Must contain numbers, uppercase and lowercase letters, and symbols
- Must contain at least 3 of the following: numbers, uppercase letters, lowercase letters, and special characters
- No restrictions


![](https://static-docs.nocobase.com/202412281331649.png)


### Password Cannot Contain Username

Set whether the password can contain the current user's username.

### Password History Count

Remember the number of recently used passwords by the user. Users cannot reuse these passwords when changing their password. 0 means no restriction, with a maximum count of 24.

## Password Expiration Configuration


![](https://static-docs.nocobase.com/202412281335588.png)


### Password Validity Period

The validity period of the user's password. Users must change their password before it expires to reset the validity period. If the password is not changed before expiration, the user will be unable to log in with the old password and will require an administrator to reset it. If other login methods are configured, the user can still log in using those methods.

### Password Expiration Notification Channel

Within 10 days of the user's password expiration, a reminder is sent each time the user logs in. By default, the reminder is sent via the "Password Expiration Reminder" internal message channel, which can be managed in the notification management section.

### Configuration Recommendations

Since password expiration may result in the inability to log in, including for administrator accounts, it is recommended to change passwords promptly and set up multiple accounts in the system that have the authority to modify user passwords.

## Password Login Security

Set limits on invalid password login attempts.


![](https://static-docs.nocobase.com/202412281339724.png)


### Maximum Invalid Password Login Attempts

Set the maximum number of login attempts a user can make within a specified time interval.

### Maximum Invalid Password Login Time Interval (Seconds)

Set the time interval (in seconds) for calculating the maximum number of invalid login attempts by a user.

### Lockout Duration (Seconds)

Set the duration for which a user is locked out after exceeding the invalid password login limit (0 means no restriction). During the lockout period, the user is prohibited from accessing the system through any authentication method, including API keys. If manual unlocking is required, refer to [User Lockout](./lockout.md).

### Scenarios

#### No Restrictions

No restrictions on the number of invalid password attempts by users.


![](https://static-docs.nocobase.com/202412281343226.png)


#### Limit Attempt Frequency, Do Not Lock User

Example: A user can attempt to log in up to 5 times every 5 minutes.


![](https://static-docs.nocobase.com/202412281344412.png)


#### Lock User After Exceeding Limit

Example: If a user makes 5 consecutive invalid password login attempts within 5 minutes, the user is locked out for 2 hours.


![](https://static-docs.nocobase.com/202412281344952.png)


### Configuration Recommendations

- The number of invalid password login attempts and the time interval configuration are typically used to limit high-frequency password login attempts within a short period, preventing brute-force attacks.
- Whether to lock the user after exceeding the limit should be considered based on actual usage scenarios. The lockout duration setting may be maliciously exploited, as attackers could intentionally enter incorrect passwords multiple times for a target account, forcing the account to be locked and rendering it unusable. This can be mitigated by combining IP restrictions, API rate limits, and other measures.
- Since account lockout prevents access to the system, including administrator accounts, it is advisable to set up multiple accounts in the system that have the authority to unlock users.