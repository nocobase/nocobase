---
pkg: "@nocobase/plugin-file-storage-s3-pro"
---

# File Storage: S3 (Pro)

## Introduction

Building on the file management plugin, this version adds support for file storage types compatible with the S3 protocol. Any object storage service supporting the S3 protocol can be seamlessly integrated, such as Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO, Cloudflare R2, etc., enhancing the compatibility and flexibility of storage services.

## Features

1. **Client Upload:** Files are uploaded directly to the storage service without passing through the NocoBase server, enabling a more efficient and faster upload experience.

2. **Private Access:** All file URLs are signed temporary authorization addresses, ensuring secure and time-limited access to files.

## Use Cases

1. **File Table Management:** Centrally manage and store all uploaded files, supporting various file types and storage methods for easy classification and retrieval.

2. **Attachment Field Storage:** Store attachments uploaded via forms or records and associate them with specific data entries.

## Plugin Configuration

1. Enable the `plugin-file-storage-s3-pro` plugin.

2. Navigate to "Setting -> FileManager" to access the file management settings.

3. Click the "Add new" button and select "S3 Pro".


![](https://static-docs.nocobase.com/20250102160704938.png)


4. In the pop-up window, you will see a detailed form to fill out. Refer to the following documentation to obtain the relevant parameters for your file service and correctly input them into the form.


![](https://static-docs.nocobase.com/20250413190828536.png)


## Service Provider Configuration

### Amazon S3

#### Bucket Creation

1. Visit [Amazon S3 Console](https://ap-southeast-1.console.aws.amazon.com/s3/home).

2. Click the "Create bucket" button on the right-hand side.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)


3. Fill in the `Bucket Name`, leave other fields as default, scroll to the bottom, and click the **"Create"** button to complete the process.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)



![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)


#### CORS Configuration

1. In the bucket list, find and click the newly created bucket to access its details.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)


2. Navigate to the "Permission" tab and scroll down to the CORS configuration section.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)



![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)


3. Enter the following configuration (customize as needed) and save.

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "POST",
            "PUT"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970494.png)


#### AccessKey and SecretAccessKey Retrieval

1. Click the "Security credentials" button in the top-right corner.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)


2. Scroll to the "Access Keys" section and click "Create Access Key."


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)


3. Agree to the terms (IAM usage is recommended for production environments).


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)


4. Save the displayed Access Key and Secret Access Key.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)


#### Parameter Retrieval and Configuration

1. Use the retrieved `AccessKey ID` and `AccessKey Secret`.

2. Visit the bucket's properties panel to find the `Bucket Name` and `Region`.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)


#### Public Access (Optional)

This is an optional configuration. Configure it when you need to make uploaded files completely public.

1. In the Permissions panel, scroll to "Object Ownership," click "Edit," and enable ACLs.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)


2. Scroll to "Block public access," click "Edit," and set it to allow ACL control.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)


3. Check "Public access" in NocoBase.

#### Thumbnail Configuration (Optional)

This configuration is optional and should be used when you need to optimize the image preview size or effect. **Please note, this deployment may incur additional costs. For more details, refer to AWS's terms and pricing.**

1. Visit [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Click the `Launch in the AWS Console` button at the bottom of the page to start the deployment.
   

![](https://static-docs.nocobase.com/20250221164214117.png)


3. Follow the prompts to complete the configuration. The following options need special attention:
   1. When creating the stack, you need to specify the Amazon S3 bucket name that contains the source images. Please enter the bucket name you created earlier.
   2. If you chose to deploy the demo UI, after deployment, you can use the UI to test the image processing functionality. In the AWS CloudFormation console, select your stack, go to the "Outputs" tab, find the value corresponding to the `DemoUrl` key, and click the link to open the demo interface.
   3. This solution uses the `sharp` Node.js library for efficient image processing. You can download the source code from the GitHub repository and customize it as needed.
   

![](https://static-docs.nocobase.com/20250221164315472.png)

   

![](https://static-docs.nocobase.com/20250221164404755.png)


4. Once the configuration is complete, wait for the deployment status to change to `CREATE_COMPLETE`.

5. In the NocoBase configuration, please note the following:
   1. `Thumbnail rule`: Fill in the image processing parameters, such as `?width=100`. For details, refer to the [AWS documentation](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint`: Enter the value from Outputs -> ApiEndpoint after deployment.
   3. `Full access URL style`: Select **Ignore** (as the bucket name has already been filled in the configuration, it is not needed for access).
   

![](https://static-docs.nocobase.com/20250414152135514.png)


#### Configuration Example


![](https://static-docs.nocobase.com/20250414152344959.png)


### Alibaba Cloud OSS

#### Bucket Creation

1. Open the [OSS Console](https://oss.console.aliyun.com/overview).


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)


2. Select "Buckets" from the left menu and click "Create Bucket."


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)


3. Fill in the bucket details and click "Create."

   - `Bucket Name`: Choose based on your business needs.
   - `Region`: Select the nearest region for your users.
   - Other settings can remain default or customized as needed.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)


#### CORS Configuration

1. Navigate to the bucket details page of the bucket you just created.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)


2. Click "Content Security -> CORS" in the middle menu.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)


3. Click "Create Rule," complete the fields, scroll down, and click "OK." You can refer to the screenshot below or configure more detailed settings.


![](https://static-docs.nocobase.com/20250219171042784.png)


#### AccessKey and SecretAccessKey Retrieval

1. Click "AccessKey" under your account avatar in the top right corner.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)


2. For demonstration purposes, we will create an AccessKey using the main account. In a production environment, it is recommended to use RAM to create the AccessKey. For instructions, please refer to the [Alibaba Cloud documentation](https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair).
    
3. Click the "Create AccessKey" button.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)


4. Complete the account verification.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)


5. Save the displayed Access Key and Secret Access Key.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)


#### Parameter Retrieval and Configuration

1. Use the `AccessKey ID` and `AccessKey Secret` obtained in the previous step.

2. Go to the bucket details page to get the `Bucket` name.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)


3. Scroll down to get the `Region` (the trailing ".aliyuncs.com" is not needed).


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)


4. Get the endpoint address and add the `https://` prefix when entering it into NocoBase.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)


#### Thumbnail Configuration (Optional)

This configuration is optional and should only be used when optimizing the image preview size or effect.

1. Fill in the relevant parameters for `Thumbnail rule`. For specific parameter settings, refer to the Alibaba Cloud documentation on [Image Processing](https://www.alibabacloud.com/help/en/oss/user-guide/image-processing).

2. Keep the `Full upload URL style` and `Full access URL style` settings the same.

#### Configuration Example


![](https://static-docs.nocobase.com/20250414152525600.png)


### MinIO

#### Bucket Creation

1. Click on the **Buckets** menu on the left -> Click **Create Bucket** to open the creation page.
2. Enter the Bucket name, then click the **Save** button.

#### AccessKey and SecretAccessKey Retrieval

1. Navigate to **Access Keys** -> Click the **Create access key** button to open the creation page.


![](https://static-docs.nocobase.com/20250106111922957.png)


2. Click the **Save** button.


![](https://static-docs.nocobase.com/20250106111850639.png)


3. Save the **Access Key** and **Secret Key** from the popup window for future configuration.


![](https://static-docs.nocobase.com/20250106112831483.png)


#### Parameter Configuration

1. Go to the **File manager** page in NocoBase.

2. Click the **Add new** button and select **S3 Pro**.

3. Fill out the form:
   - **AccessKey ID** and **AccessKey Secret**: Use the values saved from the previous step.
   - **Region**: Privately deployed MinIO does not have the concept of a region; you can set it to `"auto"`.
   - **Endpoint**: Enter the domain name or IP address of your deployed service.
   - Set **Full access URL style** to **Path-Style**.

#### Configuration Example


![](https://static-docs.nocobase.com/20250414152700671.png)


### Tencent COS

Refer to the configurations for the file services above. The logic is similar.

#### Configuration Example


![](https://static-docs.nocobase.com/20250414153252872.png)


### Cloudflare R2

Refer to the configurations for the file services above. The logic is similar.

#### Configuration Example


![](https://static-docs.nocobase.com/20250414154500264.png)


## User Guide

Refer to the [file-manager plugin documentation](/data-sources/file-manager).