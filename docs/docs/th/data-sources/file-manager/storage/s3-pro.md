---
pkg: "@nocobase/plugin-file-storage-s3-pro"
---
:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::



# การจัดเก็บไฟล์: S3 (Pro)

## บทนำ

ต่อยอดจากปลั๊กอินจัดการไฟล์ เวอร์ชันนี้ได้เพิ่มการรองรับประเภทการจัดเก็บไฟล์ที่เข้ากันได้กับโปรโตคอล S3 ครับ/ค่ะ บริการ Object Storage ใดๆ ที่รองรับโปรโตคอล S3 ก็สามารถเชื่อมต่อได้อย่างง่ายดาย เช่น Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO, Cloudflare R2 และอื่นๆ ซึ่งช่วยเพิ่มความเข้ากันได้และความยืดหยุ่นของบริการจัดเก็บข้อมูลให้ดียิ่งขึ้นครับ/ค่ะ

## คุณสมบัติเด่น

1.  **การอัปโหลดจากไคลเอนต์:** กระบวนการอัปโหลดไฟล์ไม่จำเป็นต้องผ่านเซิร์ฟเวอร์ NocoBase ครับ/ค่ะ แต่จะเชื่อมต่อโดยตรงกับบริการจัดเก็บไฟล์ ทำให้ได้รับประสบการณ์การอัปโหลดที่รวดเร็วและมีประสิทธิภาพมากยิ่งขึ้นครับ/ค่ะ
2.  **การเข้าถึงแบบส่วนตัว:** เมื่อเข้าถึงไฟล์ URL ทั้งหมดจะเป็นที่อยู่ชั่วคราวที่ได้รับการลงนามเพื่ออนุญาตการเข้าถึง ซึ่งช่วยให้มั่นใจในความปลอดภัยและการเข้าถึงไฟล์ที่จำกัดเวลาครับ/ค่ะ

## กรณีการใช้งาน

1.  **การจัดการตารางไฟล์:** จัดการและจัดเก็บไฟล์ที่อัปโหลดทั้งหมดแบบรวมศูนย์ รองรับไฟล์หลายประเภทและวิธีการจัดเก็บที่หลากหลาย เพื่อความสะดวกในการจัดหมวดหมู่และค้นหาไฟล์ครับ/ค่ะ
2.  **การจัดเก็บข้อมูลในฟิลด์ไฟล์แนบ:** ใช้สำหรับจัดเก็บข้อมูลไฟล์แนบที่อัปโหลดผ่านฟอร์มหรือบันทึกต่างๆ และรองรับการเชื่อมโยงกับบันทึกข้อมูลเฉพาะครับ/ค่ะ

## การตั้งค่าปลั๊กอิน

1.  เปิดใช้งานปลั๊กอิน `plugin-file-storage-s3-pro` ครับ/ค่ะ
2.  ไปที่ "Setting -> FileManager" เพื่อเข้าสู่การตั้งค่าการจัดการไฟล์ครับ/ค่ะ
3.  คลิกปุ่ม "Add new" แล้วเลือก "S3 Pro" ครับ/ค่ะ

![](https://static-docs.nocobase.com/20250102160704938.png)

4.  เมื่อหน้าต่างป๊อปอัปปรากฏขึ้น คุณจะเห็นฟอร์มที่มีรายละเอียดค่อนข้างมากที่ต้องกรอกครับ/ค่ะ คุณสามารถอ้างอิงเอกสารประกอบส่วนถัดไป เพื่อดูข้อมูลพารามิเตอร์ที่เกี่ยวข้องสำหรับบริการไฟล์ของคุณ และกรอกข้อมูลเหล่านั้นลงในฟอร์มให้ถูกต้องครับ/ค่ะ

![](https://static-docs.nocobase.com/20250413190828536.png)

## การตั้งค่าผู้ให้บริการ

### Amazon S3

#### การสร้าง Bucket

1.  ไปที่ [Amazon S3 Console](https://ap-southeast-1.console.aws.amazon.com/s3/home) เพื่อเข้าสู่คอนโซล S3 ครับ/ค่ะ
2.  คลิกปุ่ม "Create bucket" ที่ด้านขวาครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

3.  กรอก Bucket Name (ชื่อ Bucket) ส่วนฟิลด์อื่นๆ สามารถปล่อยไว้ตามค่าเริ่มต้นได้เลยครับ/ค่ะ เลื่อนลงไปที่ด้านล่างของหน้า แล้วคลิกปุ่ม **"Create"** เพื่อสร้างให้เสร็จสมบูรณ์ครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### การตั้งค่า CORS

1.  ในรายการ Buckets ให้ค้นหาและคลิก Bucket ที่เพิ่งสร้างขึ้นเพื่อเข้าสู่หน้ารายละเอียดครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2.  ไปที่แท็บ "Permission" แล้วเลื่อนลงไปที่ส่วนการตั้งค่า CORS ครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3.  กรอกการตั้งค่าต่อไปนี้ (สามารถปรับแต่งเพิ่มเติมได้ตามต้องการ) แล้วบันทึกครับ/ค่ะ

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

#### การเรียกดู AccessKey และ SecretAccessKey

1.  คลิกปุ่ม "Security credentials" ที่มุมขวาบนของหน้าครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2.  เลื่อนลงไปที่ส่วน "Access Keys" แล้วคลิกปุ่ม "Create Access Key" ครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3.  คลิกยอมรับเงื่อนไขครับ/ค่ะ (นี่เป็นการสาธิตโดยใช้บัญชีหลัก ในสภาพแวดล้อมจริง แนะนำให้ใช้ IAM ในการดำเนินการครับ/ค่ะ)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4.  บันทึก Access Key และ Secret Access Key ที่แสดงบนหน้าจอไว้ครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### การเรียกดูและตั้งค่าพารามิเตอร์

1.  AccessKey ID และ AccessKey Secret คือค่าที่คุณได้รับจากการดำเนินการในขั้นตอนก่อนหน้า โปรดกรอกข้อมูลให้ถูกต้องครับ/ค่ะ
2.  ไปที่แผง Properties ของหน้ารายละเอียด Bucket คุณจะสามารถดูข้อมูล Bucket Name และ Region (ภูมิภาค) ได้จากที่นี่ครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### การเข้าถึงแบบสาธารณะ (ไม่บังคับ)

นี่เป็นการตั้งค่าที่ไม่จำเป็นครับ/ค่ะ ให้ตั้งค่าเมื่อคุณต้องการทำให้ไฟล์ที่อัปโหลดเป็นสาธารณะอย่างสมบูรณ์ครับ/ค่ะ

1.  ในแผง Permissions ให้เลื่อนลงไปที่ "Object Ownership" คลิก "Edit" แล้วเปิดใช้งาน ACLs ครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2.  เลื่อนไปที่ "Block public access" คลิก "Edit" แล้วตั้งค่าให้ยอมรับการควบคุม ACLs ครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3.  ติ๊กช่อง "Public access" ใน NocoBase ครับ/ค่ะ

#### การตั้งค่ารูปขนาดย่อ (ไม่บังคับ)

การตั้งค่านี้เป็นทางเลือกครับ/ค่ะ ใช้เมื่อคุณต้องการปรับขนาดหรือเอฟเฟกต์ของรูปภาพตัวอย่างให้เหมาะสมเท่านั้นครับ/ค่ะ **โปรดทราบว่า การปรับใช้โซลูชันนี้อาจมีค่าใช้จ่ายเพิ่มเติม สำหรับรายละเอียดค่าใช้จ่าย โปรดอ้างอิงจากข้อกำหนดและเงื่อนไขที่เกี่ยวข้องของ AWS ครับ/ค่ะ**

1.  ไปที่ [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls) ครับ/ค่ะ
2.  คลิกปุ่ม \`Launch in the AWS Console\` ที่ด้านล่างของหน้า เพื่อเริ่มการปรับใช้โซลูชันครับ/ค่ะ
    ![](https://static-docs.nocobase.com/20250221164214117.png)
3.  ทำตามคำแนะนำเพื่อตั้งค่าให้เสร็จสมบูรณ์ โดยมีตัวเลือกบางอย่างที่ต้องให้ความสนใจเป็นพิเศษดังนี้ครับ/ค่ะ:
    1.  เมื่อสร้าง Stack คุณจะต้องระบุชื่อ Amazon S3 Bucket ที่มีรูปภาพต้นฉบับอยู่ โปรดกรอกชื่อ Bucket ที่คุณสร้างไว้ก่อนหน้านี้ครับ/ค่ะ
    2.  หากคุณเลือกที่จะปรับใช้ Demo UI หลังจากปรับใช้เสร็จสิ้น คุณสามารถใช้ UI นั้นเพื่อทดสอบฟังก์ชันการประมวลผลรูปภาพได้ครับ/ค่ะ ในคอนโซล AWS CloudFormation ให้เลือก Stack ของคุณ ไปที่แท็บ "Outputs" ค้นหาค่าที่ตรงกับคีย์ DemoUrl แล้วคลิกลิงก์นั้นเพื่อเปิดหน้าจอ Demo ครับ/ค่ะ
    3.  โซลูชันนี้ใช้ไลบรารี \`sharp\` Node.js เพื่อประมวลผลรูปภาพอย่างมีประสิทธิภาพครับ/ค่ะ คุณสามารถดาวน์โหลดซอร์สโค้ดจาก GitHub repository และปรับแต่งได้ตามต้องการครับ/ค่ะ

    ![](https://static-docs.nocobase.com/20250221164315472.png)
    ![](https://static-docs.nocobase.com/20250221164404755.png)

4.  เมื่อการตั้งค่าเสร็จสมบูรณ์ ให้รอสถานะการปรับใช้เปลี่ยนเป็น \`CREATE_COMPLETE\` ครับ/ค่ะ
5.  ในการตั้งค่า NocoBase มีข้อควรทราบดังต่อไปนี้ครับ/ค่ะ:
    1.  \`Thumbnail rule\`: กรอกพารามิเตอร์ที่เกี่ยวข้องกับการประมวลผลรูปภาพ เช่น \`?width=100\` สำหรับรายละเอียดเพิ่มเติม โปรดอ้างอิง [เอกสารประกอบของ AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html) ครับ/ค่ะ
    2.  \`Access endpoint\`: กรอกค่าจาก Outputs -> ApiEndpoint หลังจากปรับใช้เสร็จสิ้นครับ/ค่ะ
    3.  \`Full access URL style\`: ต้องเลือก **Ignore** (เนื่องจากได้กรอกชื่อ Bucket ไปแล้วในการตั้งค่า จึงไม่จำเป็นต้องระบุอีกเมื่อเข้าถึงครับ/ค่ะ)

    ![](https://static-docs.nocobase.com/20250414152135514.png)

#### ตัวอย่างการตั้งค่า

![](https://static-docs.nocobase.com/20250414152344959.png)

### Alibaba Cloud OSS

#### การสร้าง Bucket

1.  เปิด [OSS Console](https://oss.console.aliyun.com/overview) ครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2.  คลิก "Buckets" ในเมนูด้านซ้าย แล้วคลิกปุ่ม "Create Bucket" เพื่อเริ่มสร้าง Bucket ครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3.  กรอกรายละเอียด Bucket ที่เกี่ยวข้อง แล้วคลิกปุ่ม Create ครับ/ค่ะ
    1.  Bucket Name: ตั้งชื่อตามความเหมาะสมกับธุรกิจของคุณได้เลยครับ/ค่ะ
    2.  Region: เลือกภูมิภาคที่ใกล้กับผู้ใช้งานของคุณมากที่สุดครับ/ค่ะ
    3.  การตั้งค่าอื่นๆ สามารถใช้ค่าเริ่มต้น หรือปรับแต่งเองได้ตามความต้องการครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### การตั้งค่า CORS

1.  ไปที่หน้ารายละเอียดของ Bucket ที่คุณสร้างไว้ในขั้นตอนก่อนหน้าครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2.  คลิก "Content Security -> CORS" ในเมนูกลางครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3.  คลิกปุ่ม "Create Rule" แล้วกรอกข้อมูลที่เกี่ยวข้อง เลื่อนลงไปด้านล่างแล้วคลิก "OK" ครับ/ค่ะ คุณสามารถอ้างอิงจากภาพหน้าจอด้านล่าง หรือตั้งค่ารายละเอียดเพิ่มเติมได้ครับ/ค่ะ

![](https://static-docs.nocobase.com/20250219171042784.png)

#### การเรียกดู AccessKey และ SecretAccessKey

1.  คลิก "AccessKey" ใต้รูปโปรไฟล์บัญชีของคุณที่มุมขวาบนครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2.  เพื่อความสะดวกในการสาธิต ในที่นี้จะใช้บัญชีหลักในการสร้าง AccessKey ครับ/ค่ะ แต่สำหรับการใช้งานจริง แนะนำให้ใช้ RAM ในการสร้างครับ/ค่ะ สามารถอ้างอิงได้จาก [เอกสารประกอบของ Alibaba Cloud](https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair) ครับ/ค่ะ
3.  คลิกปุ่ม "Create AccessKey" ครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4.  ดำเนินการยืนยันบัญชีครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5.  บันทึก Access Key และ Secret Access Key ที่แสดงบนหน้าจอไว้ครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### การเรียกดูและตั้งค่าพารามิเตอร์

1.  AccessKey ID และ AccessKey Secret คือค่าที่คุณได้รับจากขั้นตอนก่อนหน้าครับ/ค่ะ
2.  ไปที่หน้ารายละเอียด Bucket เพื่อดูชื่อ Bucket ครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3.  เลื่อนลงเพื่อดู Region (ไม่จำเป็นต้องรวม ".aliyuncs.com" ที่ต่อท้ายครับ/ค่ะ)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4.  ดูที่อยู่ Endpoint แล้วเพิ่มคำนำหน้า \`https://\` เมื่อกรอกลงใน NocoBase ครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### การตั้งค่ารูปขนาดย่อ (ไม่บังคับ)

การตั้งค่านี้เป็นทางเลือกครับ/ค่ะ ใช้เมื่อต้องการปรับขนาดหรือเอฟเฟกต์ของรูปภาพตัวอย่างให้เหมาะสมเท่านั้นครับ/ค่ะ

1.  กรอกพารามิเตอร์ที่เกี่ยวข้องสำหรับ \`Thumbnail rule\` สำหรับการตั้งค่าพารามิเตอร์โดยละเอียด โปรดอ้างอิง [เอกสารประกอบการประมวลผลรูปภาพของ Alibaba Cloud](https://www.alibabacloud.com/help/en/oss/user-guide/image-processing) ครับ/ค่ะ
2.  ตั้งค่า \`Full upload URL style\` และ \`Full access URL style\` ให้เหมือนกันครับ/ค่ะ

#### ตัวอย่างการตั้งค่า

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### การสร้าง Bucket

1.  คลิกเมนู **Buckets** ทางด้านซ้าย -> คลิก **Create Bucket** เพื่อเข้าสู่หน้าการสร้างครับ/ค่ะ
2.  กรอกชื่อ Bucket แล้วคลิกปุ่ม **Save** ครับ/ค่ะ

#### การเรียกดู AccessKey และ SecretAccessKey

1.  ไปที่ **Access Keys** -> คลิกปุ่ม **Create access key** เพื่อเข้าสู่หน้าการสร้างครับ/ค่ะ

![](https://static-docs.nocobase.com/20250106111922957.png)

2.  คลิกปุ่ม **Save** ครับ/ค่ะ

![](https://static-docs.nocobase.com/20250106111850639.png)

3.  บันทึก **Access Key** และ **Secret Key** จากหน้าต่างป๊อปอัปไว้สำหรับใช้ในการตั้งค่าต่อไปครับ/ค่ะ

![](https://static-docs.nocobase.com/20250106112831483.png)

#### การตั้งค่าพารามิเตอร์

1.  ไปที่หน้า **File manager** ใน NocoBase ครับ/ค่ะ
2.  คลิกปุ่ม **Add new** แล้วเลือก **S3 Pro** ครับ/ค่ะ
3.  กรอกข้อมูลในฟอร์ม:
    -   **AccessKey ID** และ **AccessKey Secret**: ใช้ค่าที่บันทึกไว้จากขั้นตอนก่อนหน้าครับ/ค่ะ
    -   **Region**: MinIO ที่ปรับใช้แบบส่วนตัวจะไม่มีแนวคิดเรื่อง Region คุณสามารถตั้งค่าเป็น \`"auto"\` ได้ครับ/ค่ะ
    -   **Endpoint**: กรอกชื่อโดเมนหรือที่อยู่ IP ของบริการที่คุณปรับใช้ครับ/ค่ะ
    -   ต้องตั้งค่า **Full access URL style** เป็น **Path-Style** ครับ/ค่ะ

#### ตัวอย่างการตั้งค่า

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

คุณสามารถอ้างอิงการตั้งค่าจากบริการไฟล์ด้านบนได้เลยครับ/ค่ะ หลักการจะคล้ายกันครับ/ค่ะ

#### ตัวอย่างการตั้งค่า

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

คุณสามารถอ้างอิงการตั้งค่าจากบริการไฟล์ด้านบนได้เลยครับ/ค่ะ หลักการจะคล้ายกันครับ/ค่ะ

#### ตัวอย่างการตั้งค่า

![](https://static-docs.nocobase.com/20250414154500264.png)

## คู่มือการใช้งาน

โปรดอ้างอิง [เอกสารประกอบปลั๊กอินจัดการไฟล์](/data-sources/file-manager) ครับ/ค่ะ