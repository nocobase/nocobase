---
pkg: '@nocobase/plugin-file-storage-s3-pro'
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# 스토리지 엔진: S3 (Pro)

## 소개

파일 관리 플러그인을 기반으로, S3 프로토콜과 호환되는 파일 스토리지 유형을 새롭게 지원합니다. Amazon S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2 등 S3 프로토콜을 지원하는 모든 객체 스토리지 서비스를 쉽게 연동할 수 있어, 스토리지 서비스의 호환성과 유연성을 한층 더 높여줍니다.

## 주요 기능

1. **클라이언트 측 업로드**: 파일 업로드 과정이 NocoBase 서버를 거치지 않고 파일 스토리지 서비스에 직접 연결되어, 더욱 효율적이고 빠른 업로드 경험을 제공합니다.
    
2. **프라이빗 접근**: 파일에 접근할 때 모든 URL은 서명된 임시 인증 주소로 제공되어, 파일 접근의 보안성과 유효성을 보장합니다.

## 활용 사례

1. **파일 컬렉션 관리**: 업로드된 모든 파일을 중앙에서 관리하고 저장하며, 다양한 파일 유형과 저장 방식을 지원하여 파일 분류 및 검색을 용이하게 합니다.
    
2. **첨부 파일 필드 스토리지**: 폼이나 기록에 업로드된 첨부 파일의 데이터 저장에 사용되며, 특정 데이터 기록과의 연동을 지원합니다.
  

## 플러그인 설정

1. `plugin-file-storage-s3-pro` 플러그인을 활성화합니다.
    
2. 'Setting -> FileManager'를 클릭하여 파일 관리 설정으로 이동합니다.

3. 'Add new' 버튼을 클릭하고 'S3 Pro'를 선택합니다.

![](https://static-docs.nocobase.com/20250102160704938.png)

4. 팝업 창이 나타나면, 작성해야 할 필드가 많은 양식(폼)을 보게 될 것입니다. 해당 파일 서비스에 대한 관련 파라미터 정보를 얻으려면 다음 문서를 참조하여 양식에 정확하게 입력해 주세요.

![](https://static-docs.nocobase.com/20250413190828536.png)

## 서비스 제공업체 설정

### Amazon S3

#### 버킷 생성

1. https://ap-southeast-1.console.aws.amazon.com/s3/home으로 이동하여 S3 콘솔에 접속합니다.
    
2. 오른쪽의 'Create bucket' 버튼을 클릭합니다.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. 버킷 이름(Bucket Name)을 입력합니다. 다른 필드는 기본 설정으로 유지하고, 페이지 하단으로 스크롤하여 'Create' 버튼을 클릭하여 생성을 완료합니다.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### CORS 설정

1. 버킷 목록으로 이동하여 방금 생성한 버킷을 찾아 클릭하여 상세 페이지로 들어갑니다.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. 'Permission' 탭을 클릭한 다음 아래로 스크롤하여 CORS 설정 섹션을 찾습니다.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. 다음 설정을 입력하고 (필요에 따라 세부 설정 가능) 저장합니다.
    
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

#### AccessKey, SecretAccessKey 발급

1. 페이지 오른쪽 상단의 'Security credentials' 버튼을 클릭합니다.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. 아래로 스크롤하여 'Access Keys' 섹션을 찾은 다음 'Create Access Key' 버튼을 클릭합니다.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. 동의를 클릭합니다 (이것은 루트 계정으로 시연하는 것이며, 프로덕션 환경에서는 IAM을 사용하는 것을 권장합니다).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. 페이지에 표시된 Access key와 Secret access key를 저장합니다.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### 파라미터 발급 및 설정

1. AccessKey ID와 AccessKey Secret은 이전 단계에서 발급받은 값입니다. 정확하게 입력해 주세요.
    
2. 버킷 상세 페이지의 속성(properties) 패널로 이동하면 버킷 이름과 리전(Region) 정보를 확인할 수 있습니다.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### 공개 접근 (선택 사항)

이 설정은 필수는 아니며, 업로드된 파일을 완전히 공개해야 할 때 구성합니다.

1. 권한(Permissions) 패널로 이동하여 객체 소유권(Object Ownership)까지 아래로 스크롤한 다음 편집을 클릭하고 ACL을 활성화합니다.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. 퍼블릭 액세스 차단(Block public access)까지 스크롤한 다음 편집을 클릭하고 ACL 제어를 허용하도록 설정합니다.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. NocoBase에서 'Public access'를 선택합니다.

#### 썸네일 설정 (선택 사항)

이 설정은 선택 사항이며, 이미지 미리 보기 크기나 효과를 최적화할 때 사용됩니다. **이 배포 솔루션은 추가 비용이 발생할 수 있으니, 자세한 비용은 AWS의 관련 약관을 참조해 주세요.**

1. [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls)에 접속합니다.

2. 페이지 하단의 `Launch in the AWS Console` 버튼을 클릭하여 솔루션 배포를 시작합니다.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. 안내에 따라 설정을 완료합니다. 다음 몇 가지 옵션에 특히 주의해 주세요.
   1. 스택을 생성할 때 원본 이미지가 포함된 Amazon S3 버킷 이름을 지정해야 합니다. 이전에 생성한 버킷 이름을 입력해 주세요.
   2. 데모 UI 배포를 선택한 경우, 배포 완료 후 이 인터페이스를 통해 이미지 처리 기능을 테스트할 수 있습니다. AWS CloudFormation 콘솔에서 스택을 선택하고 '출력(Outputs)' 탭으로 이동하여 DemoUrl 키에 해당하는 값을 찾은 다음 해당 링크를 클릭하여 데모 인터페이스를 엽니다.
   3. 이 솔루션은 `sharp` Node.js 라이브러리를 사용하여 이미지를 효율적으로 처리합니다. GitHub 저장소에서 소스 코드를 다운로드하여 필요에 따라 사용자 지정할 수 있습니다.
   
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. 설정이 완료되면 배포 상태가 `CREATE_COMPLETE`로 변경될 때까지 기다립니다.

5. NocoBase 설정에는 다음 몇 가지 유의 사항이 있습니다.
   1. `Thumbnail rule`: 이미지 처리 관련 파라미터(예: `?width=100`)를 입력합니다. 자세한 내용은 [AWS 문서](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html)를 참조해 주세요.
   2. `Access endpoint`: 배포 후 출력(Outputs) -> ApiEndpoint 값을 입력합니다.
   3. `Full access URL style`: **Ignore**를 선택해야 합니다 (설정 시 버킷 이름을 이미 입력했으므로, 접근 시 다시 필요하지 않습니다).
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### 설정 예시

![](https://static-docs.nocobase.com/20250414152344959.png)

### Aliyun OSS

#### 버킷 생성

1. OSS 콘솔 https://oss.console.aliyun.com/overview에 접속합니다.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. 왼쪽 메뉴에서 'Buckets'를 클릭한 다음 'Create Bucket' 버튼을 클릭하여 버킷 생성을 시작합니다.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. 버킷 관련 정보를 입력하고 마지막으로 'Create' 버튼을 클릭합니다.
    
    1. 버킷 이름(Bucket Name)은 비즈니스 요구사항에 맞게 자유롭게 지정할 수 있습니다.
        
    2. 리전(Region)은 사용자에게 가장 가까운 지역을 선택합니다.
        
    3. 다른 설정은 기본값으로 두거나 필요에 따라 직접 구성할 수 있습니다.    

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### CORS 설정

1. 이전 단계에서 생성한 버킷의 상세 페이지로 이동합니다.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. 중앙 메뉴에서 'Content Security -> CORS'를 클릭합니다.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. 'Create Rule' 버튼을 클릭하고 관련 내용을 입력한 다음 아래로 스크롤하여 'OK'를 클릭합니다. 아래 스크린샷을 참조하거나 더 자세한 설정을 진행할 수 있습니다.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### AccessKey, SecretAccessKey 발급

1. 오른쪽 상단 프로필 사진 아래의 'AccessKey'를 클릭합니다.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. 여기서는 시연을 위해 주 계정으로 AccessKey를 생성합니다. 실제 사용 환경에서는 RAM을 사용하여 생성하는 것을 권장하며, 다음 문서를 참조할 수 있습니다: https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp
    
3. 'Create AccessKey' 버튼을 클릭합니다.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. 계정 인증을 진행합니다.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. 페이지에 표시된 Access key와 Secret access key를 저장합니다.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### 파라미터 발급 및 설정

1. AccessKey ID와 AccessKey Secret은 이전 단계에서 발급받은 값입니다.
    
2. 버킷 상세 페이지로 이동하여 버킷 이름을 확인합니다.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. 아래로 스크롤하여 리전(Region)을 확인합니다 (뒤에 '.aliyuncs.com'은 필요하지 않습니다).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. 엔드포인트(endpoint) 주소를 확인하고, NocoBase에 입력할 때 https:// 접두사를 추가해야 합니다.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### 썸네일 설정 (선택 사항)

이 설정은 선택 사항이며, 이미지 미리 보기 크기나 효과를 최적화해야 할 때만 사용됩니다.

1. `Thumbnail rule` 관련 파라미터를 입력합니다. 자세한 파라미터 설정은 [이미지 처리 파라미터](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1)를 참조해 주세요.

2. `Full upload URL style`과 `Full access URL style`은 동일하게 유지하면 됩니다.

#### 설정 예시

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### 버킷 생성

1. 왼쪽의 'Buckets' 메뉴를 클릭한 다음 'Create Bucket'을 클릭하여 생성 페이지로 이동합니다.
2. 버킷 이름을 입력한 후 저장 버튼을 클릭합니다.

#### AccessKey, SecretAccessKey 발급

1. 'Access Keys'로 이동한 다음 'Create access key' 버튼을 클릭하여 생성 페이지로 이동합니다.

![](https://static-docs.nocobase.com/20250106111922957.png)

2. 저장 버튼을 클릭합니다.

![](https://static-docs.nocobase.com/20250106111850639.png)

1. 팝업 창에 표시된 Access Key와 Secret Key를 저장하여 이후 설정에 사용합니다.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### 파라미터 설정

1. NocoBase -> File manager 페이지로 이동합니다.

2. 'Add new' 버튼을 클릭하고 'S3 Pro'를 선택합니다.

3. 양식(폼)을 작성합니다.
   - **AccessKey ID**와 **AccessKey Secret**은 이전 단계에서 저장한 값입니다.
   - **Region**: 자체 호스팅 MinIO는 리전 개념이 없으므로 'auto'로 설정할 수 있습니다.
   - **Endpoint**: 배포된 서비스의 도메인 이름 또는 IP 주소를 입력합니다.
   - `Full access URL style`은 Path-Style로 설정해야 합니다.

#### 설정 예시

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

위에서 설명한 파일 서비스 설정을 참조하여 구성할 수 있으며, 설정 방식은 유사합니다.

#### 설정 예시

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

위에서 설명한 파일 서비스 설정을 참조하여 구성할 수 있으며, 설정 방식은 유사합니다.

#### 설정 예시

![](https://static-docs.nocobase.com/20250414154500264.png)