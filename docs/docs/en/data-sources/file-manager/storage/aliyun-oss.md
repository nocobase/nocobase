# Aliyun OSS

Storage engine based on Aliyun OSS, you need to prepare relevant accounts and permissions in advance.

## Options

![Example of Aliyun OSS options](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Hint}
Only the special parameters of the Aliyun OSS storage engine are introduced here. For common parameters, please refer to the [Common Engine Parameters](./index.md#common-engine-parameters).
:::

### Region

Specify the region of the OSS storage, for example: `oss-cn-hangzhou`.

:::info{title=Hint}
You can view the region information of the storage bucket in the [Aliyun OSS console](https://oss.console.aliyun.com/), and only need to take the prefix part of the region (without the complete domain name).
:::

### AccessKey ID

Fill in the ID of the Alibaba Cloud authorized access key.

### AccessKey Secret

Fill in the secret of the Alibaba Cloud authorized access key.

### Bucket

Fill in the name of the OSS bucket.
