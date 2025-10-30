# File Storage: S3 (Pro)

<PluginInfo commercial="true" name="file-storage-s3-pro"></PluginInfo>

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

![Create Bucket](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

3. Fill in the `Bucket Name`, leave other fields as default, scroll to the bottom, and click the **"Create"** button to complete the process.

![Bucket Configuration](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

#### CORS Configuration

1. In the bucket list, find and click the newly created bucket to access its details.

![Bucket List](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Navigate to the "Permission" tab and scroll down to the CORS configuration section.

![Permissions Tab](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

3. Enter the following configuration (customize as needed) and save.

```bash
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

![CORS Rules](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970494.png)

#### AccessKey and SecretAccessKey Retrieval

1. Click the "Security credentials" button in the top-right corner.

![Security Credentials](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Scroll to the "Access Keys" section and click "Create Access Key."

![Create Access Key](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Agree to the terms (IAM usage is recommended for production environments).

![Access Key Agreement](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Save the displayed Access Key and Secret Access Key.

![Access Key Details](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Parameter Retrieval and Configuration

1. Use the retrieved `AccessKey ID` and `AccessKey Secret`.

2. Visit the bucket's properties panel to find the `Bucket Name` and `Region`.

![Bucket Details](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Public Access (Optional)

For public file access, configure as follows:

1. In the Permissions panel, scroll to "Object Ownership," click "Edit," and enable ACLs.

![Enable ACLs](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Scroll to "Block public access," click "Edit," and allow ACL control.

![Block Public Access](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

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
   2. `Access base URL`: Enter the value from Outputs -> ApiEndpoint after deployment.
   3. `Full access URL style`: Select **Ignore** (as the bucket name has already been filled in the configuration, no further action is needed during access).
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Configuration Example

![](https://static-docs.nocobase.com/20250414152344959.png)


### Alibaba Cloud OSS

#### Bucket Creation

1. Open the [OSS Console](https://oss.console.aliyun.com/overview).

![OSS Console](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Select "Buckets" from the left menu and click "Create Bucket."

![Create OSS Bucket](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Fill in the bucket details and click "Create."

   - `Bucket Name`: Choose based on your business needs.
   - `Region`: Select the nearest region for your users.
   - Other settings can remain default or customized as needed.

![Bucket Details](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### CORS Configuration

1. Navigate to the bucket details page.

![Bucket Details Page](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Click "Content Security -> CORS" in the menu.

![CORS Menu](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Click "Create Rule," complete the fields, and click "OK."

![CORS Rule Setup](https://static-docs.nocobase.com/20250219171042784.png)

#### AccessKey and SecretAccessKey Retrieval

1. Click "AccessKey" under your account avatar.

![AccessKey Menu](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Create an AccessKey. For production, refer to the [RAM AccessKey Guide](https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp).

![Create AccessKey](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

3. Complete account verification.

![Account Verification](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

4. Save the Access Key and Secret Access Key.

![AccessKey Details](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### Parameter Retrieval and Configuration

1. Use the retrieved `AccessKey ID` and `AccessKey Secret`.

2. Access the bucket details to retrieve the `Bucket Name`.

![Bucket Name](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Scroll down to find the `Region` (omit `.aliyuncs.com`).

![Region Details](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Retrieve the `Endpoint` and add `https://` as a prefix.

![Endpoint Configuration](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Thumbnail Configuration (Optional)

This configuration is optional and should only be used when optimizing the image preview size or effect.

1. Fill in the relevant parameters for `Thumbnail rule`. For specific parameter settings, refer to [Image Processing Parameters](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1).

2. Keep the `Full upload URL style` and `Full access URL style` settings the same.

#### Configuration Example

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### Bucket Creation

1. Click on the **Buckets** menu on the left -> Click **Create Bucket** to open the creation page.

2. Enter the Bucket name, then click the **Save** button.

![Bucket Creation](https://static-docs.nocobase.com/20250106111325326.png)

#### AccessKey and SecretAccessKey Retrieval

1. Navigate to **Access Keys** -> Click the **Create access key** button to open the creation page.

![Create Access Key](https://static-docs.nocobase.com/20250106111922957.png)

2. Click the **Save** button.

![Save Access Key](https://static-docs.nocobase.com/20250106111850639.png)

3. Save the **Access Key** and **Secret Key** from the popup window for future configuration.

![Access Key Details](https://static-docs.nocobase.com/20250106112831483.png)

#### Parameter Configuration

1. Go to the **File Manager** page in NocoBase.

2. Click the **Add new** button and select **S3 Pro**.

3. Configure the form as follows:
   - **AccessKey ID** and **AccessKey Secret**: Use the values saved from the previous step.
   - **Region**: For private deployments of MinIO, the concept of a region does not apply. Set it to `"auto"`.
   - **Endpoint**: Enter the domain name or IP address of your deployed service.
   - Set **Force path style** to **Path-Style**. The final file URL will be in the format:  
     `https://{Endpoint}/{bucket-name}/{fileKey}`.

#### Configuration Example

![](https://static-docs.nocobase.com/20250414152700671.png)


### Tencent COS

Refer to the configurations above. The process is largely similar.

#### Configuration Example

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

Refer to the configurations above. The process is largely similar.

#### Configuration Example

![](https://static-docs.nocobase.com/20250414154500264.png)


## User Guide

Refer to the [file-manager plugin documentation](https://docs.nocobase.com/data-sources/file-manager/).
