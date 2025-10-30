# Tencent COS

The storage engine based on Tencent Cloud COS, you need to prepare relevant accounts and permissions in advance.

## Options

![Example of Tencent COS options](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Hint}
This section only covers the specific options for the Tencent Cloud COS storage engine. For common parameters, please refer to [Common Engine Parameters](./index.md#common-engine-parameters).
:::

### Region

Fill in the region of the COS storage, for example: `ap-chengdu`.

:::info{title=Hint}
You can view the region information of the storage bucket in the [Tencent Cloud COS Console](https://console.cloud.tencent.com/cos), and only need to take the prefix part of the region (without the complete domain name).
:::

### SecretId

Fill in the ID of the Tencent Cloud authorized access key.

### SecretKey

Fill in the secret of the Tencent Cloud authorized access key.

### Bucket

Fill in the name of the COS bucket, for example: `qing-cdn-1234189398`.
