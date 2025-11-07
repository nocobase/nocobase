# Tencent Cloud COS

A storage engine based on Tencent Cloud COS. You need to prepare the relevant account and permissions before use.

## Configuration Parameters


![Tencent COS Storage Engine Configuration Example](https://static-docs.nocobase.com/20240712222125.png)


:::info{title=Note}
This section only introduces the specific parameters for the Tencent Cloud COS storage engine. For general parameters, please refer to [General Engine Parameters](./index.md#general-engine-parameters).
:::

### Region

Enter the region for COS storage, for example: `ap-chengdu`.

:::info{title=Note}
You can view the region information of your bucket in the [Tencent Cloud COS Console](https://console.cloud.tencent.com/cos). You only need to use the region prefix (not the full domain name).
:::

### SecretId

Enter the ID of your Tencent Cloud access key.

### SecretKey

Enter the Secret of your Tencent Cloud access key.

### Bucket

Enter the name of the COS bucket, for example: `qing-cdn-1234189398`.