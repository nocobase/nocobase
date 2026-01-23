
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::


# פריסת Kubernetes

מאמר זה נועד להדריך אתכם בפריסה מהירה של NocoBase במצב אשכול בסביבת K8S, בהנחה שאתם מכירים את סביבת K8S והשלמתם את השלבים ב[הכנות](./preparations.md).

:::info{title="טיפ"}
כדי לאמת במהירות את תהליך הפריסה ב-K8S, סביבת העבודה במאמר זה היא אשכול K3S עם צומת יחיד (מערכת הפעלה: Ubuntu). מדריך זה ישים גם לאשכולות K8S סטנדרטיים. אם נתקלתם בהבדלים כלשהם בעת פריסה באשכול K8S סטנדרטי, אנא יידעו אותנו.
:::

## סביבת אשכול

אם כבר יש לכם סביבת אשכול Kubernetes, תוכלו לדלג על שלב זה.

הכינו שרת עם Debian / Ubuntu מותקן והריצו עליו אשכול K3S במצב צומת יחיד. למידע נוסף על K3S, בקרו ב[אתר הרשמי של K3S](https://docs.k3s.io/).

השלבים הם כדלקמן:

1. התחברו לשרת באמצעות SSH.
2. התקינו את צומת המאסטר של אשכול K3S בשרת באמצעות הסקריפט הרשמי.

```bash
# לאחר ההתקנה, קובץ ה-kubeconfig ברירת המחדל הוא /etc/rancher/k3s/k3s.yaml
curl -sfL https://get.k3s.io | sh -
```

```bash
# ודאו שהתצורה נכונה
kubectl get node
```

## פריסת יישום אשכול

פרסו את יישום NocoBase במצב אשכול בסביבת K8S.

### משתני סביבה

בדרך כלל, יש להפריד משתני סביבה מקובץ התצורה של פריסת היישום. מאמר זה משתמש ב-ConfigMap כדוגמה. בסביבת ייצור אמיתית, ניתן להוסיף Secrets כדי להפריד מידע רגיש עוד יותר.

השלבים הם כדלקמן:

1. צרו קובץ `nocobase-cm.yaml`.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  # הגדירו את אזור הזמן שלכם, לדוגמה: Asia/Jerusalem, UTC
  TZ: Asia/Jerusalem
  # תצורות מסד הנתונים ו-Redis שלהלן משתמשות בשירותי PostgreSQL ו-Redis באשכול, כפי שמתואר במסמך "פריסת תווכה ב-K8S".
  # אם בסביבת היעד שלכם כבר קיימים שירותי מסד נתונים ו-Redis, עדכנו את התצורות המתאימות שלהלן.
  CACHE_DEFAULT_STORE: redis
  # השתמשו בשירות Redis קיים או כזה שפרסתם בעצמכם.
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # השתמשו בשירות PostgreSQL קיים או כזה שפרסתם בעצמכם.
  DB_DATABASE: nocobase
  DB_DIALECT: postgres
  DB_HOST: "postgres-0.postgres-service"
  DB_PASSWORD: nocobase123
  DB_PORT: "5432"
  DB_UNDERSCORED: "true"
  DB_USER: nocobase
  # שם משתמש לפלטפורמת השירות
  NOCOBASE_PKG_USERNAME: "<your user>"
  # סיסמת פלטפורמת השירות
  NOCOBASE_PKG_PASSWORD: "<your password>"

  # ... משתני סביבה נוספים
```

2. הריצו את פקודת `kubectl` כדי לפרוס את ה-ConfigMap.

```bash
kubectl apply -f nocobase-cm.yaml
```

### אחסון משותף

צמתים שונים של יישום NocoBase הפרוס במצב אשכול צריכים לטעון את אותה ספריית אחסון (`storage`). לשם כך, עליכם ליצור Persistent Volume (PV) התומך בגישת קריאה-כתיבה מצמתים מרובים (ReadWriteMany). בדרך כלל, תידרשו ליצור דיסק ענן בפלטפורמת ספק הענן שלכם ולקשור אותו כ-PV, או שתוכלו לטעון ספריית אחסון משותפת בשיטות אחרות כמו NFS.

### פריסת יישום

בפריסה ראשונית של היישום, התחילו עם צומת אחד. לאחר מכן, תוכלו להרחיב ולהפעיל צמתים נוספים.

1. צרו קובץ `nocobase-apps.yaml`.

```yaml
# צרו PVC. מספר ה-Pods שייפרסו על ידי ה-Deployment שלהלן יטענו את אותה ספריית אחסון מתמשכת דרך PVC זה.
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: nocobase-pvc
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 10Gi
  storageClassName: "" # הדוגמה משתמשת בשירות NFS של צומת המאסטר ולכן מצוינת במפורש כריקה, כדי למנוע שימוש ב-StorageClass ברירת המחדל.
---
# ה-Service של היישום, המספק שירותים מחוץ לאשכול לאחר קישור ל-Ingress.
apiVersion: v1
kind: Service
metadata:
  name: nocobase
spec:
  ports:
    - name: nocobase
      port: 13000
      targetPort: 13000
  selector:
    app: nocobase
  type: ClusterIP
# ה-Deployment של היישום, שיכול לפרוס מספר קונטיינרים של יישומים.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # פריסה ראשונית עם צומת אחד בלבד.
  selector:
    matchLabels:
      app: nocobase
  template:
    metadata:
      labels:
        app: nocobase
    spec:
      containers:
        - name: nocobase
          image: nocobase/nocobase:1.6
          ports:
            - containerPort: 13000
          # טעינת משתני סביבה מה-ConfigMap שנפרס קודם לכן.
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # הצהירו על דרישות ועל מגבלות המשאבים עבור השירות.
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # פקודת בדיקת חיים (liveness probe). האשכול משתמש בפקודה זו כדי לקבוע אם יש צורך להפעיל מחדש את ה-Pod.
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # פקודת בדיקת מוכנות (readiness probe). האשכול משתמש בפקודה זו כדי לקבוע אם להפנות תעבורת Service אל ה-Pod.
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # טעינת אחסון מתמשך באמצעות PVC.
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2. הריצו את פקודת `kubectl` כדי לפרוס את שירות יישום NocoBase.

```bash
kubectl apply -f nocobase-apps.yaml
```

3. ודאו את מצב שירות יישום NocoBase.

```bash
# בדקו את מצב ה-Pod של שירות NocoBase
kubectl get pods -l app=nocobase
```

פלט לדוגמה הוא כדלקמן. כאשר `STATUS` הוא `Running`, הדבר מציין שהשירות הופעל בהצלחה:

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4. בהפעלה ראשונית של היישום, עליכם להפעיל ידנית את ה**תוספים** הבאים בממשק הניהול:

- @nocobase/plugin-sync-adapter-redis
- @nocobase/plugin-lock-adapter-redis

לאחר מכן, תוכלו להרחיב את האשכול. לדוגמה, הרחבה ל-4 צמתים:

```bash
kubectl scale deployment nocobase --replicas=4
```

## שינויים ביישום

שינויים ביישום מתייחסים למצבים הבאים:

- שדרוג גרסת היישום
- התקנת **תוספים** חדשים
- הפעלת **תוספים**

NocoBase אינו תומך כרגע בסנכרון אוטומטי של שינויים בין מופעים מרובים באשכול עבור התרחישים הנ"ל. לכן, עליכם לטפל בהם ידנית על פי השלבים הבאים. השלבים הבאים מתייחסים רק לשינויים בשירות היישום. לפני ביצוע שינויים כלשהם, אנא גבו בעצמכם את מסד הנתונים ואת האחסון המתמשך.

### שדרוג גרסת יישום מתגלגל

1. הריצו את פקודת `kubectl set image` כדי לשנות את גרסת אימג' הקונטיינר של ה-Deployment.

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2. בדקו את מצב העדכון המתגלגל.

    ```bash
    # בדקו את התקדמות העדכון המתגלגל הכוללת של ה-Deployment
    kubectl rollout status deployment/nocobase

    # בדקו את מצב כל Pod
    kubectl get pods -l app=nocobase
    ```

אם נתקלתם בבעיות כלשהן במהלך או לאחר שדרוג גרסת היישום וצריך לבצע חזרה לגרסה קודמת, הריצו את הפקודה הבאה כדי להחזיר את גרסת אימג' הקונטיינר:

```bash
kubectl rollout undo deployment/nocobase
```

### הפעלה מחדש חלקה של היישום

לאחר התקנה או הפעלה של **תוספים** חדשים, עליכם לרענן את תצורת היישום או את מצבו. תוכלו להשתמש בפקודה הבאה כדי להפעיל מחדש בצורה חלקה כל Pod.

1. הריצו את פקודת `kubectl rollout restart`.

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2. בדקו את מצב ההפעלה מחדש המתגלגלת.

    ```bash
    # בדקו את התקדמות ההפעלה מחדש הכוללת של ה-Deployment
    kubectl rollout status deployment/nocobase

    # בדקו את מצב כל Pod
    kubectl get pods -l app=nocobase
    ```

## שער יישומים

כדי שיישום הפרוס באשכול K8S יהיה נגיש מבחוץ, עליכם לקשור Ingress ל-Service של היישום. סביבת האשכול המשמשת במאמר זה היא K3S, ורכיב ה-Ingress Controller המותקן כברירת מחדל ב-K3S הוא Traefik.

### Traefik IngressRoute

השלבים הם כדלקמן:

1. צרו קובץ `nocobase-ingress.yaml`.

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # כאן, 'nocobase.local' צריך להיות מוחלף בשם דומיין אמיתי המצביע על כתובת ה-IP של האשכול.
        # אם אין לכם דומיין לאימות, תוכלו לשנות את קובץ ה-hosts המקומי שלכם ולהוסיף רשומה עבור nocobase.local המצביעה על כתובת ה-IP של האשכול.
        # לאחר מכן תוכלו לגשת ליישום NocoBase באשכול על ידי פתיחת http://nocobase.local בדפדפן שלכם.
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # זהו ה-Service שנוצר בעת פריסת יישום nocobase בסעיף "פריסת יישום" לעיל.
            - name: nocobase
              port: 13000
    ```

2. הריצו את פקודת `kubectl` כדי לפרוס את ה-Ingress עבור יישום NocoBase.

```bash
kubectl apply -f nocobase-ingress.yaml
```

### Ingress-Nginx

רוב אשכולות K8S משתמשים ב-Ingress-Nginx כרכיב ה-Ingress Controller. להלן קובץ `nocobase-ingress.yaml` המבוסס על Ingress-Nginx:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # כאן, 'nocobase.local' צריך להיות מוחלף בשם דומיין אמיתי המצביע על כתובת ה-IP של האשכול.
    # אם אין לכם דומיין לאימות, תוכלו לשנות את קובץ ה-hosts המקומי שלכם ולהוסיף רשומה עבור nocobase.local המצביעה על כתובת ה-IP של האשכול.
    # לאחר מכן תוכלו לגשת ליישום NocoBase באשכול על ידי פתיחת http://nocobase.local בדפדפן שלכם.
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## שימוש ב-Helm Charts

כתבנו Helm Charts עבור יישום NocoBase, המאפשרים לכם לפרוס את שירות יישום NocoBase ב-K8S באמצעות Helm CLI.

### הכנות

ודאו שקליינטים כמו `kubectl` ו-`helm` מותקנים בסביבת העבודה שלכם, וכי `kubectl` יכול להתחבר בהצלחה לאשכול היעד.

### הוספת מאגר

הוסיפו את מאגר ה-Helm Charts של NocoBase:

```bash
# הוסיפו את מאגר ה-Helm Charts של NocoBase
helm repo add nocobase https://nocobase.github.io/helm-charts

# עדכנו את אינדקס Helm
helm repo update
```

### פריסת Helm

1. צרו קובץ `values.yaml`.

    ```yaml
    persistent:
      # הגודל הנדרש לאחסון משותף באשכול NocoBase
      size: 10Gi
      # מחלקת האחסון המסופקת על ידי שירותי הענן של K8S
      # בדומה לסעיף "פריסת יישום", זה מצוין במפורש כריק מכיוון שהוא משתמש בשירות NFS של צומת המאסטר.
      storageClassName: ""

    configMap:
      data:
        # הגדירו את אזור הזמן שלכם, לדוגמה: Asia/Jerusalem, UTC
        TZ: Asia/Jerusalem
        # תצורות מסד הנתונים ו-Redis שלהלן משתמשות בשירותי PostgreSQL ו-Redis באשכול, כפי שמתואר במסמך "פריסת תווכה ב-K8S".
        # אם בסביבת היעד שלכם כבר קיימים שירותי מסד נתונים ו-Redis, עדכנו את התצורות המתאימות שלהלן.
        CACHE_DEFAULT_STORE: redis
        # השתמשו בשירות Redis קיים או כזה שפרסתם בעצמכם.
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # השתמשו בשירות PostgreSQL קיים או כזה שפרסתם בעצמכם.
        DB_DATABASE: nocobase
        DB_DIALECT: postgres
        DB_HOST: "postgres-0.postgres-service"
        DB_PASSWORD: nocobase123
        DB_PORT: "5432"
        DB_UNDERSCORED: "true"
        DB_USER: nocobase
        # שם משתמש לפלטפורמת השירות
        NOCOBASE_PKG_USERNAME: "<your user>"
        # סיסמת פלטפורמת השירות
        NOCOBASE_PKG_PASSWORD: "<your password>"

        # ... משתני סביבה נוספים
    ```

2. הריצו את פקודת `helm install` כדי להתחיל בהתקנה.

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```