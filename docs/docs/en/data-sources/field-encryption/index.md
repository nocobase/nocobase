---
pkg: "@nocobase/plugin-field-encryption"
---

# Encryption

## Introduction

You can encrypt sensitive business data—such as customer phone numbers, email addresses, or card numbers—so that it is stored in the database as ciphertext.

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Encryption Method

:::warning
The plugin automatically generates an `application key`, which is stored under the directory `/storage/apps/main/encryption-field-keys`.

Each `application key` is saved as a file whose name is the key ID, with the `.key` extension. Do not rename these files.

Keep your `application key` files safe. If an `application key` file is lost, encrypted data cannot be decrypted.

If the plugin is enabled in a sub-application, the key is stored under:
`/storage/apps/${sub-app-name}/encryption-field-keys`
:::

### How It Works

This plugin uses an **envelope encryption** scheme.

![20251118151143](https://static-docs.nocobase.com/20251118151143.png)

### Application and Field Key Creation

  1. When you create your first encrypted field, NocoBase automatically generates a 32-byte `application key`, stores it in the default directory, and encodes it in base64.
1. Each time you create a new encrypted field, the system generates a random 32-byte `field key`, encrypts it using the `application key` and a randomly generated 16-byte `field IV` (AES), and stores the encrypted result in the `options` column of the `fields` table.

### Field Encryption Process

   1. When writing data to an encrypted field, NocoBase retrieves the encrypted `field key` and `field IV` from the `options` column of the `fields` table.
2. The system decrypts the `field key` using the `application key` and `field IV`. It then encrypts the actual data using the `field key` and a randomly generated 16-byte `data IV` (AES).
3. The decrypted `field key` is also used to sign the plaintext using `HMAC-SHA256`, producing a base64-encoded `data signature` (used later for querying).
4. The 16-byte `data IV` and `ciphertext` are concatenated and encoded in base64.
5. The base64 `data signature` and base64 `ciphertext` are joined with a `.` separator.
6. The final string is stored in the database.

## Environment Variables

If you want to specify your own `application key`, you can set the environment variable `ENCRYPTION_FIELD_KEY_PATH`. The plugin will load all `.key` files in this directory as application keys.

**Application key file requirements:**

1. The file extension must be `.key`.
2. The filename is treated as the key ID; using a UUID is recommended.
3. The file content must be base64-encoded 32-byte binary data.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Field Configuration

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## How Encryption Affects Filtering

Encrypted fields only support the following filter operators:

* Equal to
* Not equal to
* Exists
* Does not exist

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

### How Filtering Works Internally

1. Retrieve the encrypted `field key` and decrypt it using the `application key`.
2. Use the `field key` to generate an `HMAC-SHA256 signature` for the user’s input.
3. Concatenate the signature with `.` and perform a **prefix search** on the encrypted field value in the database.

## Key Rotation

:::warning
Before running the key rotation command `nocobase key-rotation`, ensure that this plugin is already enabled in the application.
:::

When migrating an application to a new environment, you may want to replace the old application key. You can use the `nocobase key-rotation` command to generate a new application key.

The command requires the application key from the old environment. After running it, NocoBase generates a new application key and replaces the old one. The new key is stored in the default directory and base64-encoded.

```bash
# --key-path points to the old application key file corresponding to the encrypted data in the database
yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

For rotating a sub-application’s key, add the `--app-name` parameter:

```bash
yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```
