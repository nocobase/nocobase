:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/multi-app/multi-app/remote).
:::

pkg: '@nocobase/plugin-app-supervisor'
---

# מצב ריבוי סביבות

## מבוא

מצב ריבוי אפליקציות בזיכרון משותף מציע יתרונות ברורים בפריסה ותחזוקה, אך ככל שמספר האפליקציות ומורכבות העסק עולים, מופע יחיד עלול להתמודד בהדרגה עם בעיות כמו תחרות על משאבים וירידה ביציבות. עבור תרחישים אלו, משתמשים יכולים לאמץ פתרון פריסה היברידית מרובת סביבות כדי לתמוך בדרישות עסקיות מורכבות יותר.

במצב זה, המערכת פורסת אפליקציית כניסה אחת כמרכז ניהול ותזמון מאוחד, ובמקביל פורסת מספר מופעי NocoBase כסביבות הרצה עצמאיות האחראיות בפועל על אירוח האפליקציות העסקיות. הסביבות מבודדות זו מזו ועובדות בשיתוף פעולה, ובכך מפזרות ביעילות את העומס ממופע יחיד ומשפרות משמעותית את היציבות, היכולת להתרחב ויכולת בידוד התקלות של המערכת.

ברמת הפריסה, סביבות שונות יכולות לרוץ בתהליכים נפרדים, להיפרס כמיכלי Docker שונים, או להתקיים כפריסות Kubernetes מרובות, מה שמאפשר התאמה גמישה לתשתיות בקנה מידה וארכיטקטורות שונות.

## פריסה

במצב פריסה היברידית מרובת סביבות:

- **אפליקציית הכניסה (Supervisor)** אחראית על ניהול מאוחד של אפליקציות ומידע על סביבות.
- **אפליקציות העבודה (Worker)** משמשות כסביבות הרצה עסקיות בפועל.
- הגדרות האפליקציה והסביבה נשמרות במטמון Redis.
- סנכרון פקודות וסטטוסים בין אפליקציית הכניסה לאפליקציות העבודה מתבצע באמצעות תקשורת Redis.

נכון לעכשיו, פונקציית יצירת סביבה עדיין אינה זמינה; יש לפרוס כל אפליקציית עבודה באופן ידני ולהגדיר את פרטי הסביבה המתאימים לפני שאפליקציית הכניסה תוכל לזהות אותה.

### תלויות ארכיטקטורה

לפני הפריסה, אנא הכינו את השירותים הבאים:

- **Redis**
  - שמירת הגדרות אפליקציה וסביבה במטמון.
  - משמש כערוץ תקשורת פקודות בין אפליקציית הכניסה לאפליקציות העבודה.

- **בסיס נתונים (Database)**
  - שירותי בסיס הנתונים אליהם צריכות להתחבר אפליקציית הכניסה ואפליקציות העבודה.

### אפליקציית כניסה (Supervisor)

אפליקציית הכניסה משמשת כמרכז ניהול מאוחד, האחראי על יצירה, הפעלה, עצירה ותזמון סביבות של אפליקציות, וכן על גישת פרוקסי לאפליקציות.

הסבר על הגדרת משתני סביבה עבור אפליקציית הכניסה:

```bash
# מצב אפליקציה
APP_MODE=supervisor
# שיטת גילוי אפליקציות
APP_DISCOVERY_ADAPTER=remote
# שיטת ניהול תהליכי אפליקציה
APP_PROCESS_ADAPTER=remote
# Redis למטמון הגדרות אפליקציה וסביבה
APP_SUPERVISOR_REDIS_URL=
# שיטת תקשורת פקודות אפליקציה
APP_COMMAND_ADPATER=redis
# Redis לתקשורת פקודות אפליקציה
APP_COMMAND_REDIS_URL=
```

### אפליקציית עבודה (Worker)

אפליקציית העבודה משמשת כסביבת הרצה עסקית בפועל, האחראית על אירוח והרצת מופעי אפליקציית NocoBase ספציפיים.

הסבר על הגדרת משתני סביבה עבור אפליקציית עבודה:

```bash
# מצב אפליקציה
APP_MODE=worker
# שיטת גילוי אפליקציות
APP_DISCOVERY_ADAPTER=remote
# שיטת ניהול תהליכי אפליקציה
APP_PROCESS_ADAPTER=local
# Redis למטמון הגדרות אפליקציה וסביבה
APP_SUPERVISOR_REDIS_URL=
# שיטת תקשורת פקודות אפליקציה
APP_COMMAND_ADPATER=redis
# Redis לתקשורת פקודות אפליקציה
APP_COMMAND_REDIS_URL=
# מזהה סביבה
ENVIRONMENT_NAME=
# URL לגישה לסביבה
ENVIRONMENT_URL=
# URL לגישת פרוקסי לסביבה
ENVIRONMENT_PROXY_URL=
```

### דוגמת Docker Compose

הדוגמה הבאה מציגה פתרון פריסה היברידית מרובת סביבות המשתמש במיכלי Docker כיחידות הרצה, ופורסת אפליקציית כניסה אחת ושתי אפליקציות עבודה בו-זמנית באמצעות Docker Compose.

```yaml
networks:
  nocobase:
    driver: bridge

services:
  redis:
    networks:
      - nocobase
    image: redis/redis-stack-server:latest
  supervisor:
    container_name: nocobase-supervisor
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_supervisor
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=supervisor
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=remote
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-supervisor:/app/nocobase/storage
    ports:
      - '14000:80'
  worker_a:
    container_name: nocobase-worker-a
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_a
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_a
      - ENVIRONMENT_URL=http://localhost:15000
      - ENVIRONMENT_PROXY_URL=http://worker_a
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-a:/app/nocobase/storage
    ports:
      - '15000:80'
  worker_b:
    container_name: nocobase-worker-b
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_b
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_b
      - ENVIRONMENT_URL=http://localhost:16000
      - ENVIRONMENT_PROXY_URL=http://worker_b
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-b:/app/nocobase/storage
    ports:
      - '16000:80'
```

## מדריך שימוש

פעולות ניהול האפליקציה הבסיסיות זהות למצב זיכרון משותף, אנא עיינו ב[מצב זיכרון משותף](./local.md). חלק זה מתמקד בתוכן הקשור להגדרת ריבוי סביבות.

### רשימת סביבות

לאחר השלמת הפריסה, היכנסו לדף "מפקח אפליקציות" (App Supervisor) באפליקציית הכניסה. בלשונית "סביבות" (Environments) ניתן לצפות ברשימת סביבות העבודה הרשומות. הרשימה כוללת מזהה סביבה, גרסת אפליקציית עבודה, כתובת URL לגישה וסטטוס. אפליקציית העבודה מדווחת על "דופק" (heartbeat) כל 2 דקות כדי להבטיח את זמינות הסביבה.

![](https://static-docs.nocobase.com/202512291830371.png)

### יצירת אפליקציה

בעת יצירת אפליקציה, ניתן לבחור סביבת הרצה אחת או יותר כדי לציין באילו אפליקציות עבודה תופץ האפליקציה. בדרך כלל, מומלץ לבחור סביבה אחת בלבד. יש לבחור מספר סביבות רק כאשר בוצע [פיצול שירותים](/cluster-mode/services-splitting) באפליקציית העבודה, ויש צורך לפרוס את אותה אפליקציה במספר סביבות הרצה לצורך חלוקת עומסים או בידוד יכולות.

![](https://static-docs.nocobase.com/202512291835086.png)

### רשימת אפליקציות

דף רשימת האפליקציות יציג את סביבת ההרצה הנוכחית ומידע על הסטטוס של כל אפליקציה. אם אפליקציה פרוסה במספר סביבות, יוצגו מספר סטטוסי הרצה. באותה אפליקציה הפרוסה במספר סביבות, הסטטוס יישאר מאוחד בתנאים רגילים, ויש לשלוט בהפעלה ובעצירה באופן מאוחד.

![](https://static-docs.nocobase.com/202512291842216.png)

### הפעלת אפליקציה

מכיוון שהפעלת אפליקציה עשויה לכלול כתיבת נתוני אתחול לבסיס הנתונים, כדי למנוע מצבי מרוץ (race conditions) בסביבות מרובות, אפליקציות הפרוסות במספר סביבות יופעלו בתור בזו אחר זו.

![](https://static-docs.nocobase.com/202512291841727.png)

### גישת פרוקסי לאפליקציה

ניתן לגשת לאפליקציות עבודה דרך נתיב המשנה `/apps/:appName/admin` של אפליקציית הכניסה באמצעות פרוקסי.

![](https://static-docs.nocobase.com/202601082154230.png)

אם האפליקציה פרוסה במספר סביבות, יש לציין סביבת יעד עבור גישת הפרוקסי.

![](https://static-docs.nocobase.com/202601082155146.png)

כברירת מחדל, כתובת הגישה לפרוקסי משתמשת בכתובת הגישה של אפליקציית העבודה, המתאימה למשתנה הסביבה `ENVIRONMENT_URL`. יש לוודא שכתובת זו נגישה בסביבת הרשת שבה נמצאת אפליקציית הכניסה. אם נדרש להשתמש בכתובת גישה שונה לפרוקסי, ניתן לדרוס אותה באמצעות משתנה הסביבה `ENVIRONMENT_PROXY_URL`.