---
pkg: '@nocobase/plugin-file-storage-s3-pro'
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::


# מנוע אחסון: S3 (Pro)

## מבוא

בהתבסס על תוסף ניהול הקבצים, נוספה תמיכה בסוגי אחסון קבצים התואמים לפרוטוקול S3. כל שירות אחסון אובייקטים התומך בפרוטוקול S3 יכול להשתלב בקלות, כגון Amazon S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2 ועוד, ובכך לשפר עוד יותר את התאימות והגמישות של שירותי האחסון.

## תכונות

1. העלאה מצד הלקוח: תהליך העלאת הקבצים אינו עובר דרך שרת NocoBase, אלא מתחבר ישירות לשירות אחסון הקבצים, ומספק חווית העלאה יעילה ומהירה יותר.
    
2. גישה פרטית: בעת גישה לקבצים, כל כתובות ה-URL הן כתובות מורשות זמניות חתומות, מה שמבטיח את האבטחה והתוקף של גישת הקבצים.

## תרחישי שימוש

1. **ניהול אוסף קבצים**: נהלו ואחסנו באופן מרכזי את כל הקבצים שהועלו, עם תמיכה בסוגי קבצים ושיטות אחסון שונות, לנוחות הסיווג והאחזור.
    
2. **אחסון שדות קבצים מצורפים**: משמש לאחסון נתונים של קבצים מצורפים שהועלו בטפסים או ברשומות, עם תמיכה בקישור לרשומות נתונים ספציפיות.
  

## הגדרות תוסף

1. הפעילו את ה-`תוסף` `plugin-file-storage-s3-pro`.
    
2. לחצו על "Setting -> FileManager" כדי להיכנס להגדרות מנהל הקבצים.

3. לחצו על כפתור "Add new" ובחרו "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4. לאחר הופעת החלון הקופץ, תראו טופס עם שדות רבים למילוי. תוכלו לעיין בתיעוד הבא כדי לקבל את פרטי הפרמטרים הרלוונטיים עבור שירות הקבצים המתאים ולמלא אותם נכון בטופס.

![](https://static-docs.nocobase.com/20250413190828536.png)

## הגדרות ספק שירות

### Amazon S3

#### יצירת Bucket

1. פתחו את https://ap-southeast-1.console.aws.amazon.com/s3/home כדי להיכנס לקונסולת S3.
    
2. לחצו על כפתור "Create bucket" בצד ימין.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. מלאו את שם ה-Bucket (שם דלי האחסון). שדות אחרים יכולים להישאר בהגדרות ברירת המחדל שלהם. גללו לתחתית העמוד ולחצו על כפתור **"**Create**"** כדי להשלים את היצירה.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### הגדרות CORS

1. עברו לרשימת ה-Buckets, מצאו ולחצו על ה-Bucket שיצרתם זה עתה כדי להיכנס לדף הפרטים שלו.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. לחצו על לשונית "Permission" (הרשאות), ולאחר מכן גללו מטה כדי למצוא את קטע הגדרות ה-CORS.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. הזינו את התצורה הבאה (ניתן להתאים אותה אישית) ושמרו.
    
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

#### קבלת AccessKey ו-SecretAccessKey

1. לחצו על כפתור "Security credentials" (אישורי אבטחה) בפינה הימנית העליונה של העמוד.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. גללו מטה, מצאו את קטע "Access Keys" (מפתחות גישה), ולחצו על כפתור "Create Access Key" (יצירת מפתח גישה).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. לחצו על "הסכמה" (זוהי הדגמה עם חשבון ראשי; מומלץ להשתמש ב-IAM בסביבת ייצור).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. שמרו את ה-Access key וה-Secret access key המוצגים בעמוד.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### קבלת והגדרת פרמטרים

1. ה-AccessKey ID וה-AccessKey Secret הם הערכים שקיבלתם בשלב הקודם. אנא מלאו אותם במדויק.
    
2. עברו ללשונית ה-properties (מאפיינים) בדף פרטי ה-Bucket, שם תוכלו לקבל את שם ה-Bucket ופרטי ה-Region (אזור).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### גישה ציבורית (אופציונלי)

זוהי הגדרה אופציונלית. הגדירו אותה כאשר אתם צריכים להפוך קבצים שהועלו לציבוריים לחלוטין.

1. עברו ללשונית Permissions (הרשאות), גללו מטה ל-Object Ownership (בעלות על אובייקטים), לחצו על עריכה, והפעילו ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. גללו ל-Block public access (חסימת גישה ציבורית), לחצו על עריכה, והגדירו לאפשר שליטת ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. סמנו את Public access (גישה ציבורית) ב-NocoBase.

#### הגדרות תמונות ממוזערות (אופציונלי)

הגדרה זו היא אופציונלית ומשמשת לאופטימיזציה של גודל או אפקט תצוגה מקדימה של תמונות. **שימו לב, פתרון פריסה זה עשוי לגרור עלויות נוספות. עבור עמלות ספציפיות, אנא עיינו בתנאים הרלוונטיים של AWS.**

1. בקרו ב-[Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. לחצו על כפתור `Launch in the AWS Console` בתחתית העמוד כדי להתחיל בפריסת הפתרון.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. עקבו אחר ההנחיות כדי להשלים את ההגדרות. שימו לב במיוחד לאפשרויות הבאות:
   1. בעת יצירת ה-stack, עליכם לציין שם של Bucket ב-Amazon S3 המכיל את תמונות המקור. אנא הזינו את שם ה-Bucket שיצרתם קודם לכן.
   2. אם בחרתם לפרוס את ממשק המשתמש של ההדגמה, תוכלו לבדוק את תכונות עיבוד התמונה דרך ממשק זה לאחר הפריסה. בקונסולת AWS CloudFormation, בחרו את ה-stack שלכם, עברו ללשונית "Outputs" (פלט), מצאו את הערך המתאים למפתח DemoUrl, ולחצו על הקישור כדי לפתוח את ממשק ההדגמה.
   3. פתרון זה משתמש בספריית Node.js `sharp` לעיבוד תמונה יעיל. תוכלו להוריד את קוד המקור ממאגר GitHub ולהתאים אותו אישית לפי הצורך.
   
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. לאחר השלמת ההגדרות, המתינו שמצב הפריסה ישתנה ל-`CREATE_COMPLETE`.

5. בהגדרות NocoBase, ישנם מספר דגשים שכדאי לשים לב אליהם:
   1. `Thumbnail rule`: מלאו פרמטרים הקשורים לעיבוד תמונה, לדוגמה, `?width=100`. לפרטים נוספים, עיינו ב-[תיעוד AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint`: מלאו את הערך של Outputs -> ApiEndpoint לאחר הפריסה.
   3. `Full access URL style`: יש לסמן **Ignore** (התעלם) (מכיוון ששם ה-Bucket כבר מולא במהלך ההגדרה, הוא אינו נחוץ יותר לגישה).
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### דוגמת הגדרה

![](https://static-docs.nocobase.com/20250414152344959.png)

### Aliyun OSS

#### יצירת Bucket

1. פתחו את קונסולת OSS בכתובת https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. לחצו על "Buckets" בתפריט השמאלי, ולאחר מכן לחצו על כפתור "Create Bucket" כדי להתחיל ביצירת Bucket.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. מלאו את הפרטים הרלוונטיים ל-Bucket ולבסוף לחצו על כפתור Create.
    
    1. שם ה-Bucket צריך להתאים לצרכים העסקיים שלכם; השם יכול להיות שרירותי.
        
    2. בחרו את ה-Region (אזור) הקרוב ביותר למשתמשים שלכם.
        
    3. הגדרות אחרות יכולות להישאר כברירת מחדל או להיות מוגדרות בהתאם לדרישותיכם.    

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### הגדרות CORS

1. עברו לדף הפרטים של ה-Bucket שיצרתם בשלב הקודם.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. לחצו על "Content Security -> CORS" בתפריט האמצעי.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. לחצו על כפתור "Create Rule" (יצירת כלל), מלאו את התוכן הרלוונטי, גללו מטה ולחצו על "OK". תוכלו לעיין בצילום המסך למטה או לבצע הגדרות מפורטות יותר.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### קבלת AccessKey ו-SecretAccessKey

1. לחצו על "AccessKey" מתחת לתמונת הפרופיל שלכם בפינה הימנית העליונה.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. לצורך הדגמה, אנו יוצרים AccessKey באמצעות החשבון הראשי. בסביבת ייצור, מומלץ להשתמש ב-RAM ליצירה. תוכלו לעיין ב-https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair
    
3. לחצו על כפתור "Create AccessKey" (יצירת מפתח גישה).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. בצעו אימות חשבון.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. שמרו את ה-Access key וה-Secret access key המוצגים בעמוד.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### קבלת והגדרת פרמטרים

1. ה-AccessKey ID וה-AccessKey Secret הם הערכים שהתקבלו בשלב הקודם.
    
2. עברו לדף פרטי ה-Bucket כדי לקבל את שם ה-Bucket.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. גללו מטה כדי לקבל את ה-Region (הסיומת ".aliyuncs.com" אינה נחוצה).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. קבלו את כתובת ה-endpoint, וכאשר אתם ממלאים אותה ב-NocoBase, יש להוסיף את הקידומת `https://`.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### הגדרות תמונות ממוזערות (אופציונלי)

הגדרה זו היא אופציונלית ומשמשת רק כאשר אתם צריכים לבצע אופטימיזציה לגודל או לאפקט התצוגה המקדימה של תמונות.

1. מלאו את הפרמטרים הרלוונטיים ל-`Thumbnail rule`. להגדרות פרמטרים ספציפיות, עיינו ב-[פרמטרים לעיבוד תמונה](https://www.alibabacloud.com/help/en/object-storage-service/latest/process-images).

2. `Full upload URL style` ו-`Full access URL style` יכולים להישאר זהים.

#### דוגמת הגדרה

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### יצירת Bucket

1. לחצו על תפריט Buckets בצד שמאל -> לחצו על Create Bucket (יצירת Bucket), כדי לעבור לדף היצירה.
2. לאחר מילוי שם ה-Bucket, לחצו על כפתור השמירה.
#### קבלת AccessKey ו-SecretAccessKey

1. עברו ל-Access Keys (מפתחות גישה) -> לחצו על כפתור Create access key (יצירת מפתח גישה), כדי לעבור לדף היצירה.

![](https://static-docs.nocobase.com/20250106111922957.png)

2. לחצו על כפתור השמירה.

![](https://static-docs.nocobase.com/20250106111850639.png)

1. שמרו את ה-Access Key וה-Secret Key מהחלון הקופץ לשימוש בהגדרות עתידיות.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### הגדרת פרמטרים

1. עברו לדף NocoBase -> File manager (מנהל קבצים).

2. לחצו על כפתור Add new (הוסף חדש) ובחרו S3 Pro.

3. מלאו את הטופס:
   - **AccessKey ID** ו-**AccessKey Secret** הם הטקסטים שנשמרו בשלב הקודם.
   - **Region**: ל-MinIO בפריסה עצמית אין מושג של Region (אזור), ולכן ניתן להגדיר אותו כ-"auto".
   - **Endpoint**: מלאו את שם הדומיין או כתובת ה-IP של שירות הפריסה שלכם.
   - יש להגדיר את Full access URL style כ-Path-Style.

#### דוגמת הגדרה

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

תוכלו לעיין בהגדרות של שירותי הקבצים שהוזכרו לעיל, שכן ההיגיון דומה.

#### דוגמת הגדרה

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

תוכלו לעיין בהגדרות של שירותי הקבצים שהוזכרו לעיל, שכן ההיגיון דומה.

#### דוגמת הגדרה

![](https://static-docs.nocobase.com/20250414154500264.png)