---
pkg: '@nocobase/plugin-file-storage-s3-pro'
---

# Storage Engine: S3 (Pro)

## Introduction

Building on the File Manager plugin, this adds support for S3 protocol-compatible file storage types. Any object storage service that supports the S3 protocol can be easily integrated, such as Amazon S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2, etc., further enhancing the compatibility and flexibility of storage services.

## Features

1. Client-side upload: The file upload process does not go through the NocoBase server, but directly connects to the file storage service, providing a more efficient and faster upload experience.
    
2. Private access: When accessing files, all URLs are signed temporary authorized addresses, ensuring the security and timeliness of file access.


## Use Cases

1. **File collection management**: Centrally manage and store all uploaded files, supporting various file types and storage methods for easy classification and retrieval.
    
2. **Attachment field storage**: Used for data storage of attachments uploaded in forms or records, supporting association with specific data records.
  

## Plugin Configuration

1. Enable the plugin-file-storage-s3-pro plugin.
    
2. Click "Setting -> FileManager" to enter the file manager settings.

3. Click the "Add new" button and select "S3 Pro".


![](https://static-docs.nocobase.com/20250102160704938.png)


4. After the pop-up appears, you will see a form with many fields to fill in. You can refer to the subsequent documentation to obtain the relevant parameter information for the corresponding file service and fill it into the form correctly.


![](https://static-docs.nocobase.com/20250413190828536.png)



## Service Provider Configuration

### Amazon S3

#### Bucket Creation

1. Open https://ap-southeast-1.console.aws.amazon.com/s3/home to enter the S3 console.
    
2. Click the "Create bucket" button on the right.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)


2. Fill in the Bucket Name. Other fields can be left at their default settings. Scroll down to the bottom of the page and click the **"**Create**"** button to complete the creation.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)



![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)


#### CORS Configuration

1. Go to the buckets list, find and click the bucket you just created to enter its details page.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)


2. Click the "Permission" tab, then scroll down to find the CORS configuration section.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)



![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)


3. Enter the following configuration (you can customize it further) and save.
    
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


#### Getting AccessKey and SecretAccessKey

1. Click the "Security credentials" button in the upper right corner of the page.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)


2. Scroll down to the "Access Keys" section and click the "Create Access Key" button.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)


3. Click to agree (this is a demonstration with the root account; it is recommended to use IAM in a production environment).


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)


4. Save the Access key and Secret access key displayed on the page.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)


#### Getting and Configuring Parameters

1. The AccessKey ID and AccessKey Secret are the values you obtained in the previous step. Please fill them in accurately.
    
2. Go to the properties panel of the bucket details page, where you can get the Bucket name and Region information.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)


#### Public Access (Optional)

This is an optional configuration. Configure it when you need to make uploaded files completely public.

1. Go to the Permissions panel, scroll down to Object Ownership, click edit, and enable ACLs.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)


2. Scroll to Block public access, click edit, and set it to allow ACLs control.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)


3. Check Public access in NocoBase.


#### Thumbnail Configuration (Optional)

This configuration is optional and is used to optimize image preview size or effects. **Please note that this deployment solution may incur additional costs. For specific fees, please refer to the relevant AWS terms.**

1. Visit [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Click the `Launch in the AWS Console` button at the bottom of the page to start deploying the solution.
   
![](https://static-docs.nocobase.com/20250221164214117.png)


3. Follow the prompts to complete the configuration. Pay special attention to the following options:
   1. When creating the stack, you need to specify the name of an Amazon S3 bucket that contains the source images. Please enter the name of the bucket you created earlier.
   2. If you choose to deploy the demo UI, you can test the image processing features through this interface after deployment. In the AWS CloudFormation console, select your stack, go to the "Outputs" tab, find the value corresponding to the DemoUrl key, and click the link to open the demo interface.
   3. This solution uses the `sharp` Node.js library for efficient image processing. You can download the source code from the GitHub repository and customize it as needed.
   
   
![](https://static-docs.nocobase.com/20250221164315472.png)

   
![](https://static-docs.nocobase.com/20250221164404755.png)


4. After the configuration is complete, wait for the deployment status to change to `CREATE_COMPLETE`.

5. In the NocoBase configuration, there are several points to note:
   1. `Thumbnail rule`: Fill in image processing-related parameters, for example, `?width=100`. For details, refer to the [AWS documentation](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint`: Fill in the value of Outputs -> ApiEndpoint after deployment.
   3. `Full access URL style`: You need to check **Ignore** (because the bucket name was already filled in during configuration, it is no longer needed for access).
   
   
![](https://static-docs.nocobase.com/20250414152135514.png)


#### Configuration Example


![](https://static-docs.nocobase.com/20250414152344959.png)



### Aliyun OSS

#### Bucket Creation

1. Open the OSS console https://oss.console.aliyun.com/overview


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)


2. Click "Buckets" in the left menu, then click the "Create Bucket" button to start creating a bucket.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)


3. Fill in the bucket-related information and finally click the Create button.
    
    1. The Bucket Name should suit your business needs; the name can be arbitrary.
        
    2. Choose the Region closest to your users.
        
    3. Other settings can be left as default or configured based on your requirements.    


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)



#### CORS Configuration

1. Go to the details page of the bucket created in the previous step.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)


2. Click "Content Security -> CORS" in the middle menu.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)


3. Click the "Create Rule" button, fill in the relevant content, scroll down, and click "OK". You can refer to the screenshot below or configure more detailed settings.


![](https://static-docs.nocobase.com/20250219171042784.png)


#### Getting AccessKey and SecretAccessKey

1. Click "AccessKey" under your profile picture in the upper right corner.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)


2. For demonstration purposes, we are creating an AccessKey using the main account. In a production environment, it is recommended to use RAM to create it. You can refer to https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair
    
3. Click the "Create AccessKey" button.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)


4. Perform account verification.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)


5. Save the Access key and Secret access key displayed on the page.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)



#### Getting and Configuring Parameters

1. The AccessKey ID and AccessKey Secret are the values obtained in the previous step.
    
2. Go to the bucket details page to get the Bucket name.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)


3. Scroll down to get the Region (the trailing ".aliyuncs.com" is not needed).


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)


4. Get the endpoint address, and add the https:// prefix when filling it into NocoBase.


![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)


#### Thumbnail Configuration (Optional)

This configuration is optional and should only be used when you need to optimize image preview size or effects.

1. Fill in the `Thumbnail rule` related parameters. For specific parameter settings, refer to [Image Processing Parameters](https://www.alibabacloud.com/help/en/object-storage-service/latest/process-images).

2. `Full upload URL style` and `Full access URL style` can be kept the same.

#### Configuration Example


![](https://static-docs.nocobase.com/20250414152525600.png)



### MinIO

#### Bucket Creation

1. Click the Buckets menu on the left -> click Create Bucket to go to the creation page.
2. Fill in the Bucket name and click the save button.
#### Getting AccessKey and SecretAccessKey

1. Go to Access Keys -> click the Create access key button to go to the creation page.


![](https://static-docs.nocobase.com/20250106111922957.png)


2. Click the save button.


![](https://static-docs.nocobase.com/20250106111850639.png)


1. Save the Access Key and Secret Key from the pop-up window for later configuration.


![](https://static-docs.nocobase.com/20250106112831483.png)


#### Parameter Configuration

1. Go to the NocoBase -> File manager page.

2. Click the Add new button and select S3 Pro.

3. Fill out the form:
   - **AccessKey ID** and **AccessKey Secret** are the values saved in the previous step.
   - **Region**: A self-hosted MinIO does not have the concept of a Region, so it can be configured as "auto".
   - **Endpoint**: Fill in the domain name or IP address of your deployment.
   - Full access URL style must be set to Path-Style.

#### Configuration Example


![](https://static-docs.nocobase.com/20250414152700671.png)



### Tencent COS

You can refer to the configuration of the file services mentioned above, as the logic is similar.

#### Configuration Example


![](https://static-docs.nocobase.com/20250414153252872.png)



### Cloudflare R2

You can refer to the configuration of the file services mentioned above, as the logic is similar.

#### Configuration Example


![](https://static-docs.nocobase.com/20250414154500264.png)
