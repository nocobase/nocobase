# Storage Engine: Amazon S3

A storage engine based on Amazon S3. You need to prepare the relevant account and permissions before use.

## Configuration Parameters


![Amazon S3 Storage Engine Configuration Example](https://static-docs.nocobase.com/20251031092524.png)


:::info{title=Note}
This section only introduces the specific parameters for the Amazon S3 storage engine. For common parameters, please refer to [Common Engine Parameters](./index#引擎通用参数).
:::

### Region

Enter the S3 storage region, for example: `us-west-1`.

:::info{title=Note}
You can view the region information for your bucket in the [Amazon S3 console](https://console.aws.amazon.com/s3/), and you only need to use the region prefix (not the full domain name).
:::

### AccessKey ID

Enter the Amazon S3 AccessKey ID.

### AccessKey Secret

Enter the Amazon S3 AccessKey Secret.

### Bucket

Enter the S3 bucket name.