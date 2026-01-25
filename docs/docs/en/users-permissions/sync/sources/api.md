# Synchronizing User Data via HTTP API

## Obtain an API Key

Refer to [API Keys](/auth-verification/api-keys). Ensure that the role associated with the API key has the necessary permissions to sync user data.

## API Overview

### Example

```bash
curl 'https://localhost:13000/api/userData:push' \
  -H 'Authorization: Bearer <token>' \
  --data-raw '{"dataType":"user","records":[]}' # See details of the request body below
```

### Endpoint

```bash
POST /api/userData:push
```

### User Data Format

#### UserData

| Parameter  | Type                               | Description                                                                 |
| ---------- | ---------------------------------- | --------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'`           | Required. Type of data being pushed. Use `user` for pushing user data.      |
| `matchKey` | `'username' \| 'email' \| 'phone'` | Optional. Used to match existing system users based on the specified field. |
| `records`  | `UserRecord[]`                     | Required. Array of user data records.                                       |

#### UserRecord

| Parameter     | Type       | Description                                                                                                 |
| ------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `uid`         | `string`   | Required. Unique identifier for the source user data, used to associate the source data with the system user. Immutable for a user. |
| `nickname`    | `string`   | Optional. User's nickname.                                                                                  |
| `username`    | `string`   | Optional. Username.                                                                                         |
| `email`       | `string`   | Optional. User's email address.                                                                             |
| `phone`       | `string`   | Optional. User's phone number.                                                                              |
| `departments` | `string[]` | Optional. Array of department UIDs the user belongs to.                                                     |
| `isDeleted`   | `boolean`  | Optional. Indicates whether the record is deleted.                                                          |
| `<field>`     | `any`      | Optional. Custom fields in the user table.                                                                  |

### Department Data Format

:::info
Pushing department data requires the [Departments](../../departments) plugin to be installed and enabled.
:::

#### DepartmentData

| Parameter  | Type                     | Description                                                                |
| ---------- | ------------------------ | -------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'` | Required. Type of data being pushed. Use `department` for department data. |
| `records`  | `DepartmentRecord[]`     | Required. Array of department data records.                                |

#### DepartmentRecord

| Parameter   | Type      | Description                                                                                                       |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| `uid`       | `string`  | Required. Unique identifier for the source department data, used to associate the source data with the system department. Immutable. |
| `title`     | `string`  | Required. Department title.                                                                                         |
| `parentUid` | `string`  | Optional. UID of the parent department.                                                                             |
| `isDeleted` | `boolean` | Optional. Indicates whether the record is deleted.                                                                  |
| `<field>`   | `any`     | Optional. Custom fields in the department table.                                                                    |

:::info

1. Pushing data is an idempotent operation.
2. If a parent department does not exist when pushing department data, the association cannot be made. You can push the data again after the parent department has been created.
3. If a user's department does not exist when pushing user data, the user cannot be associated with that department. You can push the user data again after the department data has been pushed.

:::