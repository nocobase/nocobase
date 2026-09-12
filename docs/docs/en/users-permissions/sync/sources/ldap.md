---
pkg: '@nocobase/plugin-auth-ldap'
title: "Synchronize User Data from LDAP"
description: "Synchronize LDAP users and departments to NocoBase by reusing an existing LDAP authenticator."
keywords: "LDAP,user synchronization,department synchronization,Bind DN,Search DN,NocoBase"
---

# Synchronize User Data from LDAP

<PluginInfo commercial="true" name="auth-ldap"></PluginInfo>

## Introduction

The **Auth: LDAP** plugin can use an existing LDAP authenticator as a user data synchronization source. The synchronization source reuses the authenticator's LDAP connection, Bind DN, Search DN, search scope, and attribute mappings, then writes the resulting users and optional department hierarchy to NocoBase.

## Before you begin

1. Install and enable the **Auth: LDAP** and **User Data Synchronization** plugins.
2. Create and verify an LDAP authenticator. See [Authentication: LDAP](/auth-verification/auth-ldap/).
3. Make sure the authenticator's attribute mappings include the fields needed by NocoBase, such as username or email, nickname, and phone number.

## Add an LDAP synchronization source

Go to **Users & Permissions > Synchronize**, click **Add new**, and select **LDAP** as the type.

Configure the following fields:

| Field | Description |
| --- | --- |
| Source name | A unique name for this synchronization source. |
| Enabled | Enables manual synchronization and LDAP synchronization tasks for this source. |
| LDAP authenticator | The existing LDAP authenticator whose connection and attribute mappings will be reused. |
| Sync filter | The LDAP filter used to find users during synchronization. The default is `(&(objectCategory=person)(objectClass=user))`. Adjust it to match your directory schema. |
| Size limit | Optional maximum number of entries returned by an LDAP search. Leave it empty to use the LDAP server's default limit. |
| Page size | Optional page size for paged LDAP searches. Use this when the directory contains more entries than a single query can return. |
| Sync departments | Also synchronizes the LDAP organizational hierarchy to NocoBase departments. |
| Department search DN | Required when department synchronization is enabled. Specify the DN that contains the organizational units to synchronize, for example `ou=departments,dc=example,dc=com`. |

:::info
The synchronization source uses the selected authenticator's Bind DN and Bind password to search LDAP. It does not store a second copy of the LDAP connection credentials.
:::

## Synchronize users

Save and enable the source, then click **Sync** to start a full synchronization. Open **Task** to review the result and retry a failed task.

User matching follows the field selected in the LDAP authenticator's **Use this field to bind the user** setting. Keep that setting and the authenticator's attribute mappings stable after the first synchronization to avoid creating duplicate users.

## Synchronize departments

Enable **Sync departments** and enter a **Department search DN** when the LDAP directory contains a hierarchy that should be represented in NocoBase.

The plugin searches organizational units below that DN, preserves their parent-child relationships, and associates users with departments based on their distinguished names. The configured Department search DN must cover the organizational units referenced by the users you expect to synchronize.

## Synchronized fields

### User fields

User fields reuse the selected LDAP authenticator's **Attribute mapping**:

| LDAP attribute or setting | NocoBase field or purpose |
| --- | --- |
| Login account attribute | Used as the source-unique user identifier and written to the username or email selected by the authenticator's **Use this field to bind the user** setting. This attribute is usually inferred from `{{account}}` in the authenticator's search filter, such as `uid`, `sAMAccountName`, or `mail`. A user without this attribute is skipped. |
| Attribute mapped to `username` | Username. |
| Attribute mapped to `nickname` | User nickname. |
| Attribute mapped to `email` | Email address. |
| Attribute mapped to `phone` | Phone number. |
| `distinguishedName`, falling back to the entry DN | Finds the nearest synchronized department in the DN path and sets it as the user's primary department. This applies only when department synchronization is enabled. |

For a multi-valued LDAP attribute, only the first value is currently synchronized. Other user attributes that are not included in the authenticator's attribute mapping are not synchronized.

### Department fields

| LDAP attribute or structure | NocoBase field or purpose |
| --- | --- |
| `objectGUID` | Source-unique department identifier. An organizational unit without this attribute is skipped. |
| `ou`, `cn`, `name` | The first non-empty value in this order becomes the department name. An organizational unit without a name is skipped. |
| `distinguishedName`, falling back to the entry DN | Identifies the current department and its parent to build the department hierarchy. |

Department synchronization searches for `organizationalUnit` and `container` objects by default. It does not currently synchronize multiple user departments from attributes such as `memberOf`, or department owners.

## Troubleshooting

- If no users are returned, verify the authenticator's Search DN, search scope, Bind DN permissions, and the synchronization filter.
- If the result is truncated, configure a page size and verify the LDAP server's size limits.
- If departments are missing, verify that department synchronization is enabled and the Department search DN covers the required organizational units.
- Review the synchronization task details and application logs for LDAP connection, bind, and search errors.
