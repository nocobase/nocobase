---
pkg: '@nocobase/plugin-file-storage-s3-pro'
---
:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::

# เอนจินจัดเก็บข้อมูล: S3 (Pro)

## บทนำ

ต่อยอดจากปลั๊กอินจัดการไฟล์ โดยเพิ่มการรองรับประเภทการจัดเก็บไฟล์ที่เข้ากันได้กับโปรโตคอล S3 บริการจัดเก็บอ็อบเจกต์ใดๆ ที่รองรับโปรโตคอล S3 ก็สามารถเชื่อมต่อได้อย่างง่ายดาย ไม่ว่าจะเป็น Amazon S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2 และอื่นๆ ซึ่งจะช่วยเพิ่มความเข้ากันได้และความยืดหยุ่นของบริการจัดเก็บข้อมูลให้ดียิ่งขึ้นไปอีกครับ/ค่ะ

## คุณสมบัติ

1.  **การอัปโหลดจากฝั่งไคลเอ็นต์**: กระบวนการอัปโหลดไฟล์ไม่จำเป็นต้องผ่านเซิร์ฟเวอร์ NocoBase แต่จะเชื่อมต่อโดยตรงกับบริการจัดเก็บไฟล์ ทำให้การอัปโหลดมีประสิทธิภาพและรวดเร็วยิ่งขึ้นครับ/ค่ะ
2.  **การเข้าถึงแบบส่วนตัว**: เมื่อเข้าถึงไฟล์ URL ทั้งหมดจะเป็นที่อยู่ชั่วคราวที่ได้รับการลงนามเพื่ออนุญาตการเข้าถึง ซึ่งช่วยให้มั่นใจในความปลอดภัยและระยะเวลาการเข้าถึงไฟล์ครับ/ค่ะ

## กรณีการใช้งาน

1.  **การจัดการคอลเลกชันไฟล์**: จัดการและจัดเก็บไฟล์ที่อัปโหลดทั้งหมดจากส่วนกลาง รองรับไฟล์หลายประเภทและวิธีการจัดเก็บที่หลากหลาย เพื่อความสะดวกในการจัดหมวดหมู่และค้นหาไฟล์ครับ/ค่ะ
2.  **การจัดเก็บข้อมูลในฟิลด์ไฟล์แนบ**: ใช้สำหรับจัดเก็บข้อมูลไฟล์แนบที่อัปโหลดในฟอร์มหรือระเบียน โดยรองรับการเชื่อมโยงกับระเบียนข้อมูลเฉพาะครับ/ค่ะ

## การตั้งค่าปลั๊กอิน

1.  เปิดใช้งานปลั๊กอิน plugin-file-storage-s3-pro
2.  คลิก "Setting -> FileManager" เพื่อเข้าสู่การตั้งค่าตัวจัดการไฟล์
3.  คลิกปุ่ม "Add new" แล้วเลือก "S3 Pro"

![](https://static-docs.nocobase.com/20250102160704938.png)

4.  หลังจากหน้าต่างป๊อปอัปปรากฏขึ้น คุณจะเห็นฟอร์มที่มีช่องให้กรอกข้อมูลจำนวนมาก คุณสามารถอ้างอิงเอกสารประกอบในส่วนถัดไป เพื่อดูข้อมูลพารามิเตอร์ที่เกี่ยวข้องสำหรับบริการไฟล์นั้นๆ และกรอกข้อมูลลงในฟอร์มให้ถูกต้องครับ/ค่ะ

![](https://static-docs.nocobase.com/20250413190828536.png)

## การตั้งค่าผู้ให้บริการ

### Amazon S3

#### การสร้าง Bucket

1.  เปิด https://ap-southeast-1.console.aws.amazon.com/s3/home เพื่อเข้าสู่คอนโซล S3
2.  คลิกปุ่ม "Create bucket" ทางด้านขวา

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2.  กรอก Bucket Name (ชื่อ Bucket) ส่วนช่องอื่นๆ สามารถปล่อยไว้ตามค่าเริ่มต้นได้เลยครับ/ค่ะ เลื่อนลงไปที่ด้านล่างของหน้า แล้วคลิกปุ่ม **"**Create**"** เพื่อดำเนินการสร้างให้เสร็จสมบูรณ์

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### การตั้งค่า CORS

1.  ไปที่รายการ Buckets ค้นหาและคลิก Bucket ที่คุณเพิ่งสร้างขึ้น เพื่อเข้าสู่หน้ารายละเอียด

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2.  คลิกแท็บ "Permission" จากนั้นเลื่อนลงเพื่อค้นหาส่วนการตั้งค่า CORS

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3.  กรอกการตั้งค่าต่อไปนี้ (คุณสามารถปรับแต่งเพิ่มเติมได้) แล้วบันทึกครับ/ค่ะ

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

#### การรับ AccessKey และ SecretAccessKey

1.  คลิกปุ่ม "Security credentials" ที่มุมขวาบนของหน้า

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2.  เลื่อนลงไปที่ส่วน "Access Keys" แล้วคลิกปุ่ม "Create Access Key"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3.  คลิกยอมรับ (นี่เป็นการสาธิตโดยใช้บัญชีหลัก ในสภาพแวดล้อมจริง แนะนำให้ใช้ IAM ในการดำเนินการครับ/ค่ะ)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4.  บันทึก Access key และ Secret access key ที่แสดงบนหน้าจอ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### การรับและตั้งค่าพารามิเตอร์

1.  AccessKey ID และ AccessKey Secret คือค่าที่คุณได้รับในขั้นตอนก่อนหน้า โปรดกรอกข้อมูลให้ถูกต้องครบถ้วนครับ/ค่ะ
2.  ไปที่แผง Properties ในหน้ารายละเอียดของ Bucket คุณจะสามารถดูข้อมูลชื่อ Bucket และ Region (ภูมิภาค) ได้จากที่นั่นครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### การเข้าถึงแบบสาธารณะ (ไม่บังคับ)

นี่เป็นการตั้งค่าที่ไม่บังคับครับ/ค่ะ ให้ตั้งค่าเมื่อคุณต้องการให้ไฟล์ที่อัปโหลดเป็นสาธารณะอย่างสมบูรณ์

1.  ไปที่แผง Permissions เลื่อนลงไปที่ Object Ownership คลิกแก้ไข แล้วเปิดใช้งาน ACLs

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2.  เลื่อนไปที่ Block public access คลิกแก้ไข และตั้งค่าให้ยอมรับการควบคุม ACLs

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3.  ใน NocoBase ให้ทำเครื่องหมายที่ช่อง Public access

#### การตั้งค่ารูปย่อ (ไม่บังคับ)

การตั้งค่านี้เป็นทางเลือก ใช้เพื่อปรับขนาดหรือเอฟเฟกต์การแสดงตัวอย่างรูปภาพให้เหมาะสม **โปรดทราบว่าโซลูชันการปรับใช้ (deployment) นี้อาจมีค่าใช้จ่ายเพิ่มเติม สำหรับค่าใช้จ่ายที่เฉพาะเจาะจง โปรดอ้างอิงข้อกำหนดที่เกี่ยวข้องของ AWS ครับ/ค่ะ**

1.  เยี่ยมชม [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls)
2.  คลิกปุ่ม `Launch in the AWS Console` ที่ด้านล่างของหน้า เพื่อเริ่มปรับใช้โซลูชันครับ/ค่ะ
    ![](https://static-docs.nocobase.com/20250221164214117.png)
3.  ทำตามคำแนะนำเพื่อตั้งค่าให้เสร็จสมบูรณ์ โดยมีตัวเลือกบางอย่างที่ต้องให้ความสนใจเป็นพิเศษดังนี้ครับ/ค่ะ
    1.  ในระหว่างการสร้าง Stack คุณจะต้องระบุชื่อ Amazon S3 Bucket ที่มีรูปภาพต้นฉบับ โปรดกรอกชื่อ Bucket ที่คุณสร้างไว้ก่อนหน้านี้ครับ/ค่ะ
    2.  หากคุณเลือกที่จะปรับใช้ Demo UI หลังจากปรับใช้เสร็จสิ้น คุณสามารถทดสอบฟังก์ชันการประมวลผลรูปภาพผ่านอินเทอร์เฟซนี้ได้ ในคอนโซล AWS CloudFormation ให้เลือก Stack ของคุณ ไปที่แท็บ "Outputs" ค้นหาค่าที่ตรงกับคีย์ DemoUrl แล้วคลิกลิงก์เพื่อเปิดอินเทอร์เฟซ Demo ครับ/ค่ะ
    3.  โซลูชันนี้ใช้ไลบรารี `sharp` ของ Node.js เพื่อประมวลผลรูปภาพอย่างมีประสิทธิภาพ คุณสามารถดาวน์โหลดซอร์สโค้ดจาก GitHub repository และปรับแต่งได้ตามต้องการครับ/ค่ะ

    ![](https://static-docs.nocobase.com/20250221164315472.png)
    ![](https://static-docs.nocobase.com/20250221164404755.png)

4.  เมื่อตั้งค่าเสร็จสมบูรณ์ ให้รอสถานะการปรับใช้เปลี่ยนเป็น `CREATE_COMPLETE` ครับ/ค่ะ
5.  ในการตั้งค่า NocoBase มีข้อควรทราบดังนี้ครับ/ค่ะ
    1.  `Thumbnail rule`: กรอกพารามิเตอร์ที่เกี่ยวข้องกับการประมวลผลรูปภาพ เช่น `?width=100` สำหรับรายละเอียดเพิ่มเติม โปรดดู [เอกสารประกอบของ AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html) ครับ/ค่ะ
    2.  `Access endpoint`: กรอกค่าของ Outputs -> ApiEndpoint หลังจากปรับใช้ครับ/ค่ะ
    3.  `Full access URL style`: ต้องเลือก **Ignore** (เนื่องจากได้กรอกชื่อ Bucket ไปแล้วในระหว่างการตั้งค่า จึงไม่จำเป็นต้องใช้ในการเข้าถึงอีกต่อไปครับ/ค่ะ)

    ![](https://static-docs.nocobase.com/20250414152135514.png)

#### ตัวอย่างการตั้งค่า

![](https://static-docs.nocobase.com/20250414152344959.png)

### Aliyun OSS

#### การสร้าง Bucket

1.  เปิดคอนโซล OSS ที่ https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2.  คลิก "Buckets" ในเมนูด้านซ้าย จากนั้นคลิกปุ่ม "Create Bucket" เพื่อเริ่มสร้าง Bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3.  กรอกข้อมูลที่เกี่ยวข้องกับ Bucket แล้วคลิกปุ่ม Create ครับ/ค่ะ
    1.  Bucket Name ควรตั้งให้เหมาะสมกับธุรกิจของคุณ ชื่อสามารถตั้งได้อย่างอิสระครับ/ค่ะ
    2.  เลือก Region ที่ใกล้กับผู้ใช้งานของคุณมากที่สุดครับ/ค่ะ
    3.  การตั้งค่าอื่นๆ สามารถปล่อยไว้ตามค่าเริ่มต้น หรือกำหนดค่าเองตามความต้องการได้เลยครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### การตั้งค่า CORS

1.  ไปที่หน้ารายละเอียดของ Bucket ที่สร้างไว้ในขั้นตอนก่อนหน้า

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2.  คลิก "Content Security -> CORS" ในเมนูกลาง

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3.  คลิกปุ่ม "Create Rule" แล้วกรอกข้อมูลที่เกี่ยวข้อง เลื่อนลงไปด้านล่างแล้วคลิก "OK" คุณสามารถอ้างอิงจากภาพหน้าจอด้านล่าง หรือตั้งค่าแบบละเอียดเพิ่มเติมได้ครับ/ค่ะ

![](https://static-docs.nocobase.com/20250219171042784.png)

#### การรับ AccessKey และ SecretAccessKey

1.  คลิก "AccessKey" ใต้รูปโปรไฟล์ของคุณที่มุมขวาบน

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2.  เพื่อความสะดวกในการสาธิต เราจะสร้าง AccessKey โดยใช้บัญชีหลัก สำหรับสภาพแวดล้อมการใช้งานจริง แนะนำให้ใช้ RAM ในการสร้าง คุณสามารถอ้างอิงได้จาก https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair ครับ/ค่ะ
3.  คลิกปุ่ม "Create AccessKey"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4.  ดำเนินการยืนยันบัญชี

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5.  บันทึก Access key และ Secret access key ที่แสดงบนหน้าจอ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### การรับและตั้งค่าพารามิเตอร์

1.  AccessKey ID และ AccessKey Secret คือค่าที่ได้รับในขั้นตอนก่อนหน้า
2.  ไปที่หน้ารายละเอียดของ Bucket เพื่อดูชื่อ Bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3.  เลื่อนลงเพื่อดู Region (ไม่จำเป็นต้องใช้ส่วน ".aliyuncs.com" ที่ต่อท้าย)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4.  รับที่อยู่ Endpoint และเพิ่มคำนำหน้า https:// เมื่อกรอกลงใน NocoBase ครับ/ค่ะ

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### การตั้งค่ารูปย่อ (ไม่บังคับ)

การตั้งค่านี้เป็นทางเลือก และควรใช้เฉพาะเมื่อคุณต้องการปรับขนาดหรือเอฟเฟกต์การแสดงตัวอย่างรูปภาพให้เหมาะสมครับ/ค่ะ

1.  กรอกพารามิเตอร์ที่เกี่ยวข้องกับ `Thumbnail rule` สำหรับการตั้งค่าพารามิเตอร์เฉพาะ โปรดดู [พารามิเตอร์การประมวลผลรูปภาพ](https://www.alibabacloud.com/help/en/object-storage-service/latest/process-images) ครับ/ค่ะ
2.  `Full upload URL style` และ `Full access URL style` สามารถตั้งค่าให้เหมือนกันได้เลยครับ/ค่ะ

#### ตัวอย่างการตั้งค่า

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### การสร้าง Bucket

1.  คลิกเมนู Buckets ทางด้านซ้าย -> คลิก Create Bucket เพื่อไปยังหน้าสร้าง
2.  กรอกชื่อ Bucket แล้วคลิกปุ่มบันทึกครับ/ค่ะ

#### การรับ AccessKey และ SecretAccessKey

1.  ไปที่ Access Keys -> คลิกปุ่ม Create access key เพื่อไปยังหน้าสร้าง

![](https://static-docs.nocobase.com/20250106111922957.png)

2.  คลิกปุ่มบันทึกครับ/ค่ะ

![](https://static-docs.nocobase.com/20250106111850639.png)

1.  บันทึก Access Key และ Secret Key จากหน้าต่างป๊อปอัปไว้สำหรับการตั้งค่าในภายหลังครับ/ค่ะ

![](https://static-docs.nocobase.com/20250106112831483.png)

#### การตั้งค่าพารามิเตอร์

1.  ไปที่หน้า NocoBase -> File manager
2.  คลิกปุ่ม Add new แล้วเลือก S3 Pro
3.  กรอกข้อมูลในฟอร์ม
    -   **AccessKey ID** และ **AccessKey Secret** คือค่าที่บันทึกไว้ในขั้นตอนก่อนหน้า
    -   **Region**: MinIO ที่ติดตั้งเองจะไม่มีแนวคิดเรื่อง Region คุณสามารถตั้งค่าเป็น "auto" ได้ครับ/ค่ะ
    -   **Endpoint**: กรอกชื่อโดเมนหรือที่อยู่ IP ของบริการที่คุณปรับใช้
    -   ต้องตั้งค่า Full access URL style เป็น Path-Style

#### ตัวอย่างการตั้งค่า

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

คุณสามารถอ้างอิงการตั้งค่าจากบริการไฟล์ที่กล่าวมาข้างต้นได้เลยครับ/ค่ะ เนื่องจากมีหลักการที่คล้ายกัน

#### ตัวอย่างการตั้งค่า

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

คุณสามารถอ้างอิงการตั้งค่าจากบริการไฟล์ที่กล่าวมาข้างต้นได้เลยครับ/ค่ะ เนื่องจากมีหลักการที่คล้ายกัน

#### ตัวอย่างการตั้งค่า

![](https://static-docs.nocobase.com/20250414154500264.png)