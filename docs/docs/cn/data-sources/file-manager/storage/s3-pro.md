# 文件存储：S3 (Pro)

<PluginInfo commercial="true" name="file-storage-s3-pro"></PluginInfo>

## 介绍

在文件管理插件的基础上，新增支持兼容 S3 协议的文件存储类型。任何支持 S3 协议的对象存储服务均可轻松接入，例如亚马逊 S3、阿里云 OSS、腾讯云 COS、MinIO、Cloudflare R2等，进一步提升存储服务的兼容性与灵活性。

## 功能特点

1. 客户端上传：文件上传过程无需经过 NocoBase 服务器，直接对接文件存储服务，实现更加高效、快速的上传体验。
    
2. 私有访问：访问文件时，所有的 URL 均为经过签名的临时授权地址，确保文件访问的安全性和时效性。


## 使用场景

1. **文件表管理**：集中管理和存储所有上传的文件，支持多种文件类型和存储方式，方便文件的分类与检索。
    
2. **附件字段存储**：用于表单或记录中上传附件的数据存储，支持与具体数据记录的关联。
  

## 插件配置

1. 开启 plugin-file-storage-s3-pro 插件
    
2. 点击 "Setting-> FileManager" 进入文件管理设置

3. 点击 "Add new" 按钮，选择 "S3 Pro"

![](https://static-docs.nocobase.com/20250102160704938.png)

4. 在弹出浮层后，您将看到需要填写的表单内容较多。可以参考后续文档，获取对应文件服务的相关参数信息，并将其正确填写到表单中。

![](https://static-docs.nocobase.com/20250413190828536.png)


## 服务商配置

### 亚马逊S3

#### Bucket 创建

1. 打开 https://ap-southeast-1.console.aws.amazon.com/s3/home 进入S3控制台
    
2. 点击右侧 "Create bucket" 按钮

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. 填写 Bucket Name（存储桶名称），其他字段可保持默认设置，向下滚动至页面底部，点击 **"**Create**"** 按钮完成创建。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### CORS配置

1. 进入buckets 列表，找到并点击刚刚创建的 Bucket 以进入其详细页面

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. 点击 "Permission" 标签页，然后向下滚动找到 CORS 配置部分

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. 填入以下配置（可以自定细化配置），并保存
    
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

#### AccessKey、SecretAccessKey 获取

1. 点击页面右上角的 "Security credentials" 按钮

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. 向下滚动，找到 "Access Keys" 部分，点击 "Create Access Key" 按钮。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. 点击 同意（此处为主账号演示，建议在正式环境中使用 IAM 进行操作）。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. 保存页面中显示的 Access key 和 Secret access key

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### 参数获取与配置

1. AccessKey ID 和 AccessKey Secret 为您在上一操作中获取到的对应值，请准确填写
    
2. 进入 bucket 详情页的 properties 面板，您可以在其中获取到 Bucket 名称和 Region（区域）信息。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### 公开访问（可选）

此为非必要配置，当你需要将上传文件完全公开时，进行配置

1. 进入Permissions 面板，向下滚动到Object Ownership，点击编辑，开启 ACLs

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. 滚动到Block public access，点击编辑，设置成允许ACLs控制

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. 在NocoBase中勾选 Public access


#### 缩略图配置（可选）

此配置为可选项，适用于优化图像预览尺寸或效果时使用。**请注意，该部署方案可能产生额外费用，具体费用请参考 AWS 的相关条款。**

1. 访问 [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls)。

2. 点击页面底部的 `Launch in the AWS Console` 按钮，开始部署方案。
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. 按照提示完成配置，以下几个选项需要特别注意：
   1. 在创建堆栈时，您需要指定一个包含源图像的 Amazon S3 存储桶名称。请填写您之前创建的存储桶名称。
   2. 如果您选择了部署演示 UI，部署完成后可通过该界面测试图像处理功能。在 AWS CloudFormation 控制台中，选择您的堆栈，转到“输出”选项卡，找到 DemoUrl 键对应的值，点击该链接打开演示界面。
   3. 本方案使用了 `sharp` Node.js 库来高效处理图像。您可以从 GitHub 仓库下载源代码，按需进行自定义。
   
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. 配置完成后，等待部署状态变为 `CREATE_COMPLETE` 即可。

5. 在 NocoBase 配置中，有以下几个注意事项：
   1. `Thumbnail rule`：填写图像处理相关参数，例如 `?width=100`。具体可参考 [AWS 文档](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html)。
   2. `Access endpoint`：填写部署后 Outputs -> ApiEndpoint 的值。
   3. `Full access URL style`：需勾选 **Ignore**（因为在配置时已经填写了存储桶名称，访问时不再需要）。
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### 配置示例

![](https://static-docs.nocobase.com/20250414152344959.png)


### 阿里云OSS

#### Bucket 创建

1. 打开OSS控制台 https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. 点进左侧菜单中的 "Buckets"，然后点击 "Create Bucket" 按钮开始创建存储桶

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. 填写 bucket 相关信息，最后点击 Create 按钮
    
    1. Bucket Name 符合自己的业务，名称随意
        
    2. Region 选择自己用户最近的区域
        
    3. 其他内容可以默认，或者基于需求自行配置    

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)


#### CORS 配置

1. 进入上一步创建的 bucket 详情页

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. 点击中间菜单中的 "Content Security -> CORS"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. 点击 "Create Rule" 按钮，并填写相关内容滚动至下方点击 "OK"。可参考下方截图，或者进行更加详细设置

![](https://static-docs.nocobase.com/20250219171042784.png)

#### AccessKey、SecretAccessKey 获取

1. 点击右上角头像下方 "AccessKey" 

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. 此处为了方便演示，使用主账户进行创建AccessKey，正式使用场景建议使 RAM 去创建，可以参考 https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp
    
3. 点击 "Create AccessKey" 按钮 

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. 进行账户验证

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. 保存页面中显示的 Access key 和 Secret access key

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)


#### 参数获取与配置

1. AccessKey ID 和 AccessKey Secret 为上一操作中获取到的值
    
2. 进入 bucket 详情页，获取到 Bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. 向下滚动，获取到 Region（后面的 ".aliyuncs.com" 不需要 ）

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. 获取到 endpoint 地址，填入NocoBase的时候需要添加 https:// 前缀

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### 缩略图配置（可选）

此配置为可选项，仅在需要优化图像预览尺寸或效果时使用。

1. 填写 `Thumbnail rule` 相关参数。具体参数设置可参考 [图片处理参数](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1)。

2. `Full upload URL style` 和 `Full access URL style` 保持相同即可。

#### 配置示例

![](https://static-docs.nocobase.com/20250414152525600.png)


### MinIO

#### Bucket 创建

1. 点击左侧 Buckets 菜单 -> 点击 Create Bucket，进入创建页面
2. 填写Bucket名称后，点击保存按钮
#### AccessKey、SecretAccessKey 获取

1. 进入 Access Keys -> 点击 Create access key 按钮，进入创建页面

![](https://static-docs.nocobase.com/20250106111922957.png)

2. 点击保存按钮

![](https://static-docs.nocobase.com/20250106111850639.png)

1. 保存弹窗内的 Access Key 和 Secret Key，后续配置使用

![](https://static-docs.nocobase.com/20250106112831483.png)

#### 参数配置

1. 进入到 NocoBase -> File manager 页面

2. 点击 Add new 按钮，选择 S3 Pro

3. 填写表单
   - **AccessKey ID** 和 **AccessKey Secret** 为上一步保存的文本
   - **Region**：私有部署的MinIO没有Region概念，可以配置成 "auto"
   - **Endpoint**：填写部署的服务域名或者ip地址
   - 需将 Full access URL style 设置为 Path-Style

#### 配置示例

![](https://static-docs.nocobase.com/20250414152700671.png)


### 腾讯COS

可以参考上述的文件服务进行配置，逻辑相似

#### 配置示例

![](https://static-docs.nocobase.com/20250414153252872.png)


### Cloudflare R2

可以参考上述的文件服务进行配置，逻辑相似

#### 配置示例

![](https://static-docs.nocobase.com/20250414154500264.png)


## 用户使用

参照 file-manager 插件使用 https://docs.nocobase.com/data-sources/file-manager/