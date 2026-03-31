# Aliyun OSS

Storage engine based on Aliyun OSS. You need to prepare the relevant accounts and permissions in advance.

## Configuration


![Example of Aliyun OSS configuration](https://static-docs.nocobase.com/20240712220011.png)


:::info{title=Note}
Only the specific parameters for the Aliyun OSS storage engine are introduced here. For common parameters, please refer to [Common Engine Parameters](./index.md#common-engine-parameters).
:::

### Region

Specify the region of the OSS storage, for example: `oss-cn-hangzhou`.

:::info{title=Note}
You can view the region information of the storage bucket in the [Aliyun OSS console](https://oss.console.aliyun.com/). You only need to use the prefix part of the region (without the full domain name).
:::

### AccessKey ID

Fill in the ID of the Alibaba Cloud authorized access key.

### AccessKey Secret

Fill in the secret of the Alibaba Cloud authorized access key.

### Bucket

Fill in the name of the OSS bucket.