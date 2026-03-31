# Storage Engine: Aliyun OSS

A storage engine based on Aliyun OSS. Before use, you need to prepare the relevant account and permissions.

## Configuration Parameters


![Aliyun OSS Storage Engine Configuration Example](https://static-docs.nocobase.com/20240712220011.png)


:::info{title=Note}
This section only introduces the specific parameters for the Aliyun OSS storage engine. For general parameters, please refer to [General Engine Parameters](./index#引擎通用参数).
:::

### Region

Enter the region of the OSS storage, for example: `oss-cn-hangzhou`.

:::info{title=Note}
You can view the region information of your bucket in the [Aliyun OSS Console](https://oss.console.aliyun.com/), and you only need to use the region prefix (not the full domain name).
:::

### AccessKey ID

Enter the ID of your Aliyun access key.

### AccessKey Secret

Enter the Secret of your Aliyun access key.

### Bucket

Enter the name of the OSS bucket.

### Timeout

Enter the timeout for uploading to Aliyun OSS, in milliseconds. The default is `60000` milliseconds (i.e., 60 seconds).