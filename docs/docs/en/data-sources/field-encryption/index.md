# Encryption

<PluginInfo commercial="true" name="field-encryption"></PluginInfo>

## Introduction

Sensitive business data, such as customer phone numbers, email addresses, and card numbers, can be encrypted to ensure privacy. Once encrypted, this data is securely stored in the database as ciphertext.

![20240802175127](https://static-docs.nocobase.com/20240802175127.png)

## Environment Variables

:::warning
Losing the `ENCRYPTION_FIELD_KEY` will make it impossible to decrypt the data.
:::

To enable the encryption feature, you must set up the `ENCRYPTION_FIELD_KEY` environment variable, which acts as the encryption key. This key must be exactly 32 characters long, for example:

```bash
ENCRYPTION_FIELD_KEY='2%&glK;<UA}eMxJVc53-4G(rTi0vg@J]'
```

## Field Configuration

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Filtering Limitations After Encryption

Once a field is encrypted, it only supports the following filtering operations: equals, not equals, exists, and does not exist.

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

## Example

To be added.
