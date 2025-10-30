# Sync User Data via HTTP API

## Get API Key

Refer to [API Keys](/auth-verification/api-keys), you need to ensure that the role set for the API key has user data synchronization permissions.

## API Description

### Example

```bash
curl 'https://localhost:13000/api/userData:push' \
  -H 'Authorization: Bearer <token>' \
  --data-raw '{"dataType":"user","records":[]}' # See below for detailed request body description
```

### Endpoint

```bash
POST /api/userData:push
```

### User Data Format

#### UserData

| Parameter Name | Type                               | Description                                                                                                      |
| -------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `dataType`     | `'user' \| 'department'`           | Required, the type of data to push. Fill in `user` to push user data.                                            |
| `matchKey`     | `'username' \| 'email' \| 'phone'` | Optional. Used to match existing users in the system based on the provided field and its corresponding value in the pushed data. |
| `records`      | `UserRecord[]`                     | Required, an array of user data records.                                                                         |

#### UserRecord

| Parameter Name | Type       | Description                                                                                                                              |
| -------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `uid`          | `string`   | Required, the unique identifier of the source user data, used to associate the source raw data with the system user. It is immutable for the same user. |
| `nickname`     | `string`   | Optional, user nickname.                                                                                                                 |
| `username`     | `string`   | Optional, username.                                                                                                                      |
| `email`        | `string`   | Optional, user email.                                                                                                                    |
| `phone`        | `string`   | Optional, phone number.                                                                                                                  |
| `departments`  | `string[]` | Optional, an array of department uids to which the user belongs.                                                                         |
| `isDeleted`    | `boolean`  | Optional, whether the record is deleted.                                                                                                 |
| `<field>`      | `any`      | Optional, data for other custom fields in the users collection.                                                                          |

### Department Data Format

:::info
Pushing department data requires installing and enabling the [Departments](../../departments) plugin.
:::

#### DepartmentData

| Parameter Name | Type                     | Description                                                                 |
| -------------- | ------------------------ | --------------------------------------------------------------------------- |
| `dataType`     | `'user' \| 'department'` | Required, the type of data to push. Fill in `department` to push department data. |
| `records`      | `DepartmentRecord[]`     | Required, an array of department data records.                              |

#### DepartmentRecord

| Parameter Name | Type      | Description                                                                                                                                      |
| -------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `uid`          | `string`  | Required, the unique identifier of the source department data, used to associate the source raw data with the system department. It is immutable for the same department. |
| `title`        | `string`  | Required, department title.                                                                                                                      |
| `parentUid`    | `string`  | Optional, parent department uid.                                                                                                                 |
| `isDeleted`    | `boolean` | Optional, whether the record is deleted.                                                                                                         |
| `<field>`      | `any`     | Optional, data for other custom fields in the departments collection.                                                                            |

:::info

1. Pushing data multiple times is idempotent.
2. If a parent department has not been created when pushing a department, the association cannot be established. You can push the data again.
3. If a department has not been created when pushing a user, the user cannot be associated with the department. You can push the user data again after pushing the department data.
   :::