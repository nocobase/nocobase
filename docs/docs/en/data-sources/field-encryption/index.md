---
pkg: "@nocobase/plugin-field-encryption"
---

# Encryption

## Introduction

Some private business data, such as customer mobile phone number, e-mail address, card number, etc. , can be encrypted. after encryption, stored in the form of ciphertext to the database.

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Encryption

:::warning
The plug-in automatically generates an `application key` , which is stored in the `/storage/apps/main/encryption-field-keys` directory.

The `application key` file is named key ID with the suffix  `.Key`, please don't change the file name at will.

Please keep the `application key` file safe. If you lose the `application key` file, the encrypted data will not be decrypted.

If the plug-in is enabled by a sub-application, the key is saved by default in the directory `/storage/apps/${sub-application name}/encryption-field-keys`
:::

### How it works

Use Envelope Encryption

![20251118151143](https://static-docs.nocobase.com/20251118151143.png)

### Key creation process
1. The first time an encrypted field is created, a 32-bit `application key` is automatically generated and stored in the default storage directory in Base64 encoding.
2. Each time a new encrypted field is created, a random 32-bit `field key` is generated for the field, it is then encrypted with the `application key` and a randomly generated 16-bit `field encryption vector` (`AES` encryption algorithm) and stored in the `options` field of the `fields` table.

### Field encryption process
1. Each time you write to an encrypted field, you first get the encrypted  `field key` and `field encryption vector` from the `options` field of the `Fields` table.
2. Decrypts the encrypted `field key` using the  `application key` and  `Field Encryption Vector` , the data is then encrypted using the `field key` and a randomly generated 16-bit `data encryption vector` ('AES' encryption algorithm) .
3. The data is signed using the decrypted `field key` (`HMAC-SHA256` digest algorithm) and converted to a string in Base64 encoding (the resulting `data signature` is subsequently used for data retrieval) .
4. Concatenate the 16-byte `data initialization vector` and the encrypted `ciphertext`, then encode in Base64.
5. Concatenate the Base64-encoded `data signature` and the Base64-encoded data using a `.` separator.
6. Save the final concatenated string to the database.


## Environment Variables

To specify a custom  `application key`, set the environment variable `ENCRYPTION_FIELD_KEY_PATH`.  
The plugin will load the file at that path as the `application key`.

**Requirements for the application key file:**

1. The file extension must be `.key`.
2. The filename will be used as the key ID; using a UUID is recommended.
3. The file content must be 32 bytes of Base64-encoded binary data.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Field configuration

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Impact on filtering after encryption

Encrypted fields support only:
equals, not equals, exists, not exists.

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

Filtering workflow：
1. Retrieve the encrypted field’s `field key`, and decrypt it using the `application key`.
2. Use the `field key` to sign the user’s input (HMAC-SHA256).
3. Concatenate the signature with a `.` separator, and perform a prefix-match query in the database.

## Key rotation

:::warning
Before using the `nocobase key-rotation` command, ensure that the plugin has been loaded.
:::

When migrating an application to a new environment, you can use the `nocobase key-rotation` command to replace the `application key`.

Running the key rotation command requires specifying the old application’s `application key`.
After execution, a new `application key` will be generated and stored (Base64-encoded) in the default directory.

```bash
# --key-path specifies the old environment’s application key 
 yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

To rotate the `application key` of a sub-application, add the `--app-name` parameter:

```bash
 yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```
