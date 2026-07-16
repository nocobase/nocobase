---
pkg: "@nocobase/plugin-field-encryption"
title: "Field encryption"
description: "Encrypt sensitive business data such as phone numbers, email addresses, and card numbers before storing it as ciphertext in the database."
keywords: "field encryption,Encryption,sensitive data,ciphertext storage,NocoBase"
---

# Encryption

## Introduction

Sensitive business data, such as customer phone numbers, email addresses, and card numbers, can be encrypted and stored in the database as ciphertext.

![Encrypted field](https://static-docs.nocobase.com/20251104192513.png)

## Encryption method

:::warning Note

The plugin generates an **application key** automatically. The key is stored in `/storage/apps/main/encryption-field-keys`.

An application-key file uses the key ID as its file name and has the `.key` extension. Do not change the file name.

Keep application-key files safe. If an application-key file is lost, encrypted data cannot be decrypted.

When the plugin is enabled for a sub-application, the default key directory is `/storage/apps/${sub-application-name}/encryption-field-keys`.

:::

### How it works

The plugin uses envelope encryption.

![Envelope encryption](https://static-docs.nocobase.com/20251118151339.png)

### Key creation flow

1. When you create an encrypted field for the first time, the system generates a 32-byte **application key** and saves it, Base64 encoded, in the default storage directory.
2. When you create an encrypted field, the system generates a random 32-byte **field key**. It encrypts this key with the application key and a randomly generated 16-byte **field initialization vector** using AES, then saves it in the `options` field of the `fields` table.

### Field encryption flow

1. When data is written to an encrypted field, the system reads the encrypted field key and field initialization vector from the `options` field of the `fields` table.
2. It decrypts the encrypted field key with the application key and field initialization vector, then encrypts the data with the field key and a randomly generated 16-byte **data initialization vector** using AES.
3. It signs the data with the decrypted field key using HMAC-SHA256, then Base64 encodes the result. This **data signature** is used for data lookup.
4. It concatenates the 16-byte data initialization vector and encrypted data ciphertext as binary data, then Base64 encodes the result.
5. It joins the Base64 data signature and Base64 data ciphertext with `.`.
6. It saves the final concatenated string in the database.

## Environment variable

To specify an application key, use the `ENCRYPTION_FIELD_KEY_PATH` environment variable. The plugin loads the file at this path as the application key.

Application-key file requirements:

1. The file extension must be `.key`.
2. The file name is used as the key ID. Use a UUID to keep it unique.
3. The file content must be Base64-encoded 32-byte binary data.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Field configuration

![Configure an encrypted field](https://static-docs.nocobase.com/20240802173721.png)

## Effect on filtering

Encrypted fields support only equals, does not equal, exists, and does not exist filters.

![Encrypted field filtering](https://static-docs.nocobase.com/20240802174042.png)

Data is filtered as follows:

1. Read the field key for the encrypted field and decrypt it with the application key.
2. Sign the user-entered lookup text with the field key using HMAC-SHA256.
3. Append `.` to the signed lookup text and perform a prefix-match lookup against the encrypted database value.

## Key rotation

:::warning Note

Before using `nocobase key-rotation`, confirm that the application has loaded this plugin.

:::

After an application is migrated to a new environment, use `nocobase key-rotation` when you do not want to continue using the old environment's application key.

Key rotation requires the old application's application key. The command generates a new application key, replaces the old key, and saves the new key Base64 encoded in the default storage directory.

```bash
# --key-path specifies the old application-key file corresponding to encrypted database data
yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

To replace a sub-application application key, add `--app-name` and specify the sub-application `name`.

```bash
yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```
