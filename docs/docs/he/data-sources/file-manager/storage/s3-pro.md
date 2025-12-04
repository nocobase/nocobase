---
pkg: "@nocobase/plugin-file-storage-s3-pro"
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::



# אחסון קבצים: S3 (Pro)

## מבוא

בהתבסס על **תוסף** ניהול הקבצים, גרסה זו מוסיפה תמיכה בסוגי אחסון קבצים התואמים לפרוטוקול S3. כל שירות אחסון אובייקטים התומך בפרוטוקול S3 יכול להשתלב בקלות, כמו Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO, Cloudflare R2 ועוד, מה שמשפר עוד יותר את התאימות והגמישות של שירותי האחסון.

## תכונות עיקריות

1.  **העלאה מצד הלקוח:** קבצים מועלים ישירות לשירות האחסון, ללא צורך לעבור דרך שרת NocoBase. זה מאפשר חווית העלאה יעילה ומהירה יותר.

2.  **גישה פרטית:** כל כתובות ה-URL של הקבצים הן כתובות מורשות זמניות חתומות, מה שמבטיח גישה מאובטחת ומוגבלת בזמן לקבצים.

## תרחישי שימוש

1.  **ניהול טבלאות קבצים:** ניהול ואחסון מרכזי של כל הקבצים שהועלו, עם תמיכה בסוגי קבצים ושיטות אחסון מגוונות, לנוחות סיווג ואחזור קבצים.

2.  **אחסון שדות קבצים מצורפים:** אחסון קבצים מצורפים שהועלו באמצעות טפסים או רשומות, עם תמיכה בקישורם לרשומות נתונים ספציפיות.

## הגדרות **תוסף**

1.  הפעילו את ה**תוסף** `plugin-file-storage-s3-pro`.

2.  עברו אל "Setting -> FileManager" כדי לגשת להגדרות ניהול הקבצים.

3.  לחצו על כפתור "Add new" ובחרו "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4.  בחלון הקופץ, תראו טופס מפורט למילוי. עיינו בתיעוד הבא כדי לקבל את הפרמטרים הרלוונטיים עבור שירות הקבצים שלכם והזינו אותם נכון לטופס.

![](https://static-docs.nocobase.com/20250413190828536.png)

## הגדרות ספק שירות

### Amazon S3

#### יצירת Bucket

1.  היכנסו ל-[Amazon S3 Console](https://ap-southeast-1.console.aws.amazon.com/s3/home).

2.  לחצו על כפתור "Create bucket" בצד ימין.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

3.  מלאו את `Bucket Name` (שם ה-Bucket), השאירו שדות אחרים כברירת מחדל, גללו לתחתית העמוד ולחצו על כפתור **"Create"** כדי להשלים את היצירה.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### הגדרות CORS

1.  ברשימת ה-Buckets, מצאו ולחצו על ה-Bucket שיצרתם זה עתה כדי לגשת לדף הפרטים שלו.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2.  עברו ללשונית "Permission" וגללו למטה עד שתמצאו את קטע הגדרות CORS.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3.  הזינו את ההגדרות הבאות (ניתן להתאים אישית לפי הצורך) ושמרו.

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

#### אחזור AccessKey ו-SecretAccessKey

1.  לחצו על כפתור "Security credentials" בפינה הימנית העליונה של העמוד.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2.  גללו למטה, מצאו את קטע "Access Keys" ולחצו על כפתור "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3.  הסכימו לתנאים (מומלץ להשתמש ב-IAM בסביבות ייצור).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4.  שמרו את ה-Access Key וה-Secret Access Key המוצגים בעמוד.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### אחזור והגדרת פרמטרים

1.  השתמשו ב-`AccessKey ID` וב-`AccessKey Secret` שאוחזרו בפעולה הקודמת. אנא מלאו אותם במדויק.

2.  עברו ללשונית Properties בדף פרטי ה-Bucket. שם תוכלו למצוא את שם ה-`Bucket` ואת פרטי ה-`Region` (אזור).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### גישה ציבורית (אופציונלי)

זוהי הגדרה אופציונלית. הגדירו אותה כאשר אתם צריכים להפוך קבצים שהועלו לציבוריים לחלוטין.

1.  בלוח Permissions, גללו אל "Object Ownership", לחצו על "Edit" והפעילו ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2.  גללו אל "Block public access", לחצו על "Edit" והגדירו לאפשר שליטת ACL.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3.  סמנו "Public access" ב-NocoBase.

#### הגדרות תמונות ממוזערות (אופציונלי)

הגדרה זו היא אופציונלית ונועדה לשימוש כאשר יש צורך לייעל את גודל או אפקט תצוגה מקדימה של תמונות. **שימו לב, פריסה זו עשויה לגרור עלויות נוספות. לפרטים נוספים, עיינו בתנאים וההגבלות הרלוונטיים של AWS.**

1.  בקרו ב-[Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2.  לחצו על כפתור `Launch in the AWS Console` בתחתית העמוד כדי להתחיל את הפריסה.

![](https://static-docs.nocobase.com/20250221164214117.png)

3.  עקבו אחר ההנחיות כדי להשלים את ההגדרות. יש לשים לב במיוחד לאפשרויות הבאות:
    1.  בעת יצירת ה-Stack, עליכם לציין את שם ה-Bucket של Amazon S3 המכיל את תמונות המקור. אנא הזינו את שם ה-Bucket שיצרתם קודם לכן.
    2.  אם בחרתם לפרוס את ממשק המשתמש לדוגמה (Demo UI), לאחר הפריסה תוכלו להשתמש בו כדי לבדוק את פונקציונליות עיבוד התמונה. במסוף AWS CloudFormation, בחרו את ה-Stack שלכם, עברו ללשונית "Outputs", מצאו את הערך המתאים למפתח `DemoUrl` ולחצו על הקישור כדי לפתוח את ממשק הדוגמה.
    3.  פתרון זה משתמש בספריית `sharp` של Node.js לעיבוד תמונה יעיל. ניתן להוריד את קוד המקור ממאגר GitHub ולהתאים אותו אישית לפי הצורך.

![](https://static-docs.nocobase.com/20250221164315472.png)

![](https://static-docs.nocobase.com/20250221164404755.png)

4.  לאחר השלמת ההגדרות, המתינו שמצב הפריסה ישתנה ל-`CREATE_COMPLETE`.

5.  בהגדרות NocoBase, שימו לב לנקודות הבאות:
    1.  `Thumbnail rule`: מלאו את הפרמטרים הקשורים לעיבוד תמונה, לדוגמה `?width=100`. לפרטים נוספים, עיינו ב-[תיעוד AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
    2.  `Access endpoint`: הזינו את הערך מ-Outputs -> ApiEndpoint לאחר הפריסה.
    3.  `Full access URL style`: יש לסמן **Ignore** (מכיוון ששם ה-Bucket כבר הוזן בהגדרות, הוא אינו נדרש לגישה).

![](https://static-docs.nocobase.com/20250414152135514.png)

#### דוגמת הגדרה

![](https://static-docs.nocobase.com/20250414152344959.png)

### Alibaba Cloud OSS

#### יצירת Bucket

1.  פתחו את [OSS Console](https://oss.console.aliyun.com/overview).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2.  בחרו "Buckets" מהתפריט השמאלי ולחצו על כפתור "Create Bucket" כדי להתחיל ביצירת Bucket.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3.  מלאו את פרטי ה-Bucket הרלוונטיים ולבסוף לחצו על כפתור Create.

    -   `Bucket Name`: בחרו שם המתאים לצרכים העסקיים שלכם. השם יכול להיות שרירותי.
    -   `Region`: בחרו את האזור הקרוב ביותר למשתמשים שלכם.
    -   הגדרות אחרות יכולות להישאר כברירת מחדל, או שניתן להגדיר אותן באופן עצמאי בהתאם לדרישות.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### הגדרות CORS

1.  עברו לדף פרטי ה-Bucket שיצרתם בשלב הקודם.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2.  לחצו על "Content Security -> CORS" בתפריט האמצעי.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3.  לחצו על כפתור "Create Rule", מלאו את השדות הרלוונטיים, גללו למטה ולחצו על "OK". תוכלו להיעזר בצילום המסך למטה, או לבצע הגדרות מפורטות יותר.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### אחזור AccessKey ו-SecretAccessKey

1.  לחצו על "AccessKey" מתחת לאווטאר החשבון שלכם בפינה הימנית העליונה.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2.  לצורך הדגמה, ניצור AccessKey באמצעות החשבון הראשי. בסביבת ייצור, מומלץ להשתמש ב-RAM ליצירת AccessKey. להנחיות, אנא עיינו ב-[תיעוד של Alibaba Cloud](https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp).

3.  לחצו על כפתור "Create AccessKey".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4.  השלימו את אימות החשבון.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5.  שמרו את ה-Access Key וה-Secret Access Key המוצגים בעמוד.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### אחזור והגדרת פרמטרים

1.  השתמשו ב-`AccessKey ID` וב-`AccessKey Secret` שהושגו בשלב הקודם.

2.  עברו לדף פרטי ה-Bucket כדי לקבל את שם ה-`Bucket`.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3.  גללו למטה כדי לקבל את ה-`Region` (הסיומת ".aliyuncs.com" אינה נחוצה).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4.  קבלו את כתובת ה-Endpoint וודאו שאתם מוסיפים את הקידומת `https://` בעת הזנתה ל-NocoBase.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### הגדרות תמונות ממוזערות (אופציונלי)

הגדרה זו היא אופציונלית ונועדה לשימוש רק כאשר יש צורך לייעל את גודל או אפקט תצוגה מקדימה של תמונות.

1.  מלאו את הפרמטרים הרלוונטיים עבור `Thumbnail rule`. להגדרות פרמטרים ספציפיות, עיינו בתיעוד של Alibaba Cloud בנושא [עיבוד תמונה](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1).

2.  שמרו את ההגדרות של `Full upload URL style` ו-`Full access URL style` זהות.

#### דוגמת הגדרה

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### יצירת Bucket

1.  לחצו על תפריט **Buckets** בצד שמאל -> לחצו על **Create Bucket** כדי לפתוח את דף היצירה.
2.  לאחר הזנת שם ה-Bucket, לחצו על כפתור **Save**.

#### אחזור AccessKey ו-SecretAccessKey

1.  עברו אל **Access Keys** -> לחצו על כפתור **Create access key** כדי לפתוח את דף היצירה.

![](https://static-docs.nocobase.com/20250106111922957.png)

2.  לחצו על כפתור **Save**.

![](https://static-docs.nocobase.com/20250106111850639.png)

3.  שמרו את ה-**Access Key** וה-**Secret Key** מהחלון הקופץ לשימוש בהגדרות עתידיות.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### הגדרת פרמטרים

1.  עברו לדף **File manager** ב-NocoBase.

2.  לחצו על כפתור **Add new** ובחרו **S3 Pro**.

3.  מלאו את הטופס:
    -   **AccessKey ID** ו-**AccessKey Secret**: השתמשו בערכים שנשמרו מהשלב הקודם.
    -   **Region**: לפריסת MinIO פרטית אין מושג של Region; ניתן להגדיר אותו כ-"auto".
    -   **Endpoint**: הזינו את שם הדומיין או כתובת ה-IP של השירות הפרוס שלכם.
    -   יש להגדיר את **Full access URL style** ל-**Path-Style**.

#### דוגמת הגדרה

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

ניתן להתייחס להגדרות של שירותי הקבצים שהוזכרו לעיל; הלוגיקה דומה.

#### דוגמת הגדרה

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

ניתן להתייחס להגדרות של שירותי הקבצים שהוזכרו לעיל; הלוגיקה דומה.

#### דוגמת הגדרה

![](https://static-docs.nocobase.com/20250414154500264.png)

## מדריך למשתמש

עיינו בתיעוד של **תוסף** [file-manager](/data-sources/file-manager).