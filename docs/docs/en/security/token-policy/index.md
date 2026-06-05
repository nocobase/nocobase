---
pkg: '@nocobase/plugin-auth'
---

# Token Security Policy

## Introduction

The Token Security Policy is a functional configuration designed to protect system security and enhance user experience. It includes three main configuration items: "Session Validity Period", "Token Validity Period", and "Expired Token Refresh Time Limit".

## Configuration Entry

The configuration entry is located under Plugin Settings - Security - Token Policy:


![20250105111821-2025-01-05-11-18-24](https://static-docs.nocobase.com/20250105111821-2025-01-05-11-18-24.png)


## Session Validity Period

**Definition:**

The Session Validity Period refers to the maximum duration that the system allows a user to maintain an active session after logging in.

**Function:**

Once the Session Validity Period is exceeded, the user will receive a 401 error response upon subsequent access to the system, and will then be redirected to the login page for re-authentication.
Example:
If the Session Validity Period is set to 8 hours, the session will expire 8 hours after the user logs in, assuming no additional interactions.

**Recommended Settings:**

- Short-term operation scenarios: Recommended 1-2 hours to enhance security.
- Long-term work scenarios: Can be set to 8 hours to accommodate business needs.

## Token Validity Period

**Definition:**

The Token Validity Period refers to the lifecycle of each Token issued by the system during the user's active session.

**Function:**

When a Token expires, the system will automatically issue a new Token to maintain the session activity.
Each expired Token is only allowed to be refreshed once.

**Recommended Settings:**

For security reasons, it is recommended to set it between 15 to 30 minutes.
Adjustments can be made based on scenario requirements. For example:
High-security scenarios: The Token Validity Period can be shortened to 10 minutes or less.
Low-risk scenarios: The Token Validity Period can be appropriately extended to 1 hour.

## Expired Token Refresh Time Limit

**Definition:**

The Expired Token Refresh Time Limit refers to the maximum time window allowed for a user to obtain a new Token through a refresh operation after the Token has expired.

**Characteristics:**

If the refresh time limit is exceeded, the user must log in again to obtain a new Token.
The refresh operation does not extend the Session Validity Period, it only regenerates the Token.

**Recommended Settings:**

For security reasons, it is recommended to set it between 5 to 10 minutes.