
:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::


# Kubernetes डिप्लॉयमेंट

यह लेख आपको Kubernetes (K8S) वातावरण में NocoBase को क्लस्टर मोड में तेज़ी से डिप्लॉय करने में मार्गदर्शन देने के लिए है। यह मानता है कि आप K8S वातावरण से परिचित हैं और [तैयारियां](./preparations.md) में दिए गए चरणों को पूरा कर चुके हैं।

:::info{title="टिप"}
K8S डिप्लॉयमेंट प्रक्रिया को तेज़ी से सत्यापित करने के लिए, इस लेख में ऑपरेटिंग वातावरण एक सिंगल-नोड K3S क्लस्टर (ऑपरेटिंग सिस्टम: Ubuntu) है। यह गाइड मानक K8S क्लस्टर में भी लागू होती है। यदि आपको मानक K8S क्लस्टर में डिप्लॉय करते समय इस लेख से भिन्न कोई स्थिति मिलती है, तो कृपया हमें बताएं।
:::

## क्लस्टर वातावरण

यदि आपके पास पहले से ही Kubernetes क्लस्टर वातावरण है, तो आप इस चरण को छोड़ सकते हैं।

Debian / Ubuntu स्थापित एक सर्वर तैयार करें और उस पर सिंगल-नोड मोड में K3S क्लस्टर चलाएं। K3S के बारे में अधिक जानने के लिए, आप [K3S की आधिकारिक वेबसाइट](https://docs.k3s.io/zh/) पर जा सकते हैं।

चरण इस प्रकार हैं:

1.  SSH के माध्यम से सर्वर में लॉग इन करें।
2.  सर्वर पर आधिकारिक स्क्रिप्ट का उपयोग करके K3S क्लस्टर मास्टर नोड स्थापित करें।

```bash
# इंस्टॉलेशन के बाद, डिफ़ॉल्ट kubeconfig फ़ाइल /etc/rancher/k3s/k3s.yaml है
curl -sfL https://get.k3s.io | sh -
```

```bash
# कॉन्फ़िगरेशन सही है या नहीं, सत्यापित करें
kubectl get node
```

## क्लस्टर एप्लिकेशन डिप्लॉयमेंट

Kubernetes क्लस्टर में NocoBase एप्लिकेशन को क्लस्टर मोड में डिप्लॉय करें।

### पर्यावरण चर

आमतौर पर, पर्यावरण चर को एप्लिकेशन डिप्लॉयमेंट कॉन्फ़िगरेशन फ़ाइल से अलग किया जाना चाहिए। यह लेख ConfigMap को एक उदाहरण के रूप में उपयोग करता है। वास्तविक उत्पादन वातावरण में, आप संवेदनशील जानकारी को और अलग करने के लिए Secrets का उपयोग कर सकते हैं।

चरण इस प्रकार हैं:

1.  `nocobase-cm.yaml` फ़ाइल बनाएं।

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  TZ: Asia/Shanghai
  # नीचे दिए गए डेटाबेस और Redis कॉन्फ़िगरेशन "K8S मिडिलवेयर डिप्लॉयमेंट" दस्तावेज़ में क्लस्टर में PostgreSQL सेवा और Redis सेवा का उपयोग करते हैं।
  # यदि आपके वातावरण में पहले से ही डेटाबेस और Redis सेवाएं मौजूद हैं, तो नीचे दिए गए संबंधित डेटाबेस और Redis कॉन्फ़िगरेशन को संशोधित करें।
  CACHE_DEFAULT_STORE: redis
  # वातावरण में मौजूद या स्वयं द्वारा डिप्लॉय की गई Redis सेवा का उपयोग करें
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # वातावरण में मौजूद या स्वयं द्वारा डिप्लॉय की गई PostgreSQL सेवा का उपयोग करें
  DB_DATABASE: nocobase
  DB_DIALECT: postgres
  DB_HOST: "postgres-0.postgres-service"
  DB_PASSWORD: nocobase123
  DB_PORT: "5432"
  DB_UNDERSCORED: "true"
  DB_USER: nocobase
  # सेवा प्लेटफ़ॉर्म उपयोगकर्ता नाम
  NOCOBASE_PKG_USERNAME: "<आपका उपयोगकर्ता>"
  # सेवा प्लेटफ़ॉर्म पासवर्ड
  NOCOBASE_PKG_PASSWORD: "<आपका पासवर्ड>"

  # ... अन्य पर्यावरण चर
```

2.  `kubectl` कमांड चलाकर ConfigMap को डिप्लॉय करें।

```bash
kubectl apply -f nocobase-cm.yaml
```

### साझा स्टोरेज

क्लस्टर मोड में डिप्लॉय किए गए NocoBase एप्लिकेशन के विभिन्न नोड्स को एक ही स्टोरेज डायरेक्टरी (`storage`) को माउंट करने की आवश्यकता होती है। इसके लिए, आपको एक परसिस्टेंट वॉल्यूम (Persistent Volume) बनाना होगा जो कई नोड्स से रीड-राइट एक्सेस (ReadWriteMany) का समर्थन करता हो। आमतौर पर, आपको क्लाउड सेवा प्रदाता के प्लेटफ़ॉर्म पर एक क्लाउड डिस्क बनाना होगा और उसे PV के रूप में बाइंड करना होगा, या आप NFS जैसे अन्य तरीकों का उपयोग करके साझा स्टोरेज डायरेक्टरी को माउंट कर सकते हैं।

### एप्लिकेशन डिप्लॉयमेंट

पहली बार डिप्लॉयमेंट के लिए, एक नोड से शुरू करें। पूरा होने के बाद, आप कई नोड्स को स्केल करके शुरू कर सकते हैं।

1.  `nocobase-apps.yaml` फ़ाइल बनाएं।

```yaml
# एक PVC बनाएं। नीचे डिप्लॉयमेंट द्वारा डिप्लॉय किए गए कई पॉड इस PVC के माध्यम से एक ही परसिस्टेंट स्टोरेज डायरेक्टरी को माउंट करेंगे।
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
  storageClassName: "" # उदाहरण के लिए मास्टर नोड की NFS सेवा का उपयोग किया गया है, इसलिए डिफ़ॉल्ट StorageClass का उपयोग करने से बचने के लिए इसे स्पष्ट रूप से खाली सेट किया गया है।
---
# एप्लिकेशन की सर्विस, जो Ingress से बाइंड होने के बाद क्लस्टर के बाहर सेवाएं प्रदान करती है।
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
# एप्लिकेशन का डिप्लॉयमेंट, जो कई एप्लिकेशन कंटेनर डिप्लॉय कर सकता है।
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # पहली बार डिप्लॉयमेंट के लिए केवल एक नोड।
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
          # पर्यावरण चर पहले डिप्लॉय किए गए ConfigMap से लोड करें।
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # सेवा के लिए संसाधन अनुरोध और सीमाएं घोषित करें।
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # लाइवनैस प्रोब कमांड। क्लस्टर इसका उपयोग यह निर्धारित करने के लिए करता है कि पॉड को रीस्टार्ट करने की आवश्यकता है या नहीं।
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # रेडीनेस प्रोब कमांड। क्लस्टर इसका उपयोग यह निर्धारित करने के लिए करता है कि सर्विस ट्रैफ़िक को पॉड में निर्देशित करना है या नहीं।
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # PVC के माध्यम से परसिस्टेंट स्टोरेज माउंट करें।
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2.  `kubectl` कमांड चलाकर NocoBase एप्लिकेशन सर्विस को डिप्लॉय करें।

```bash
kubectl apply -f nocobase-apps.yaml
```

3.  NocoBase एप्लिकेशन सर्विस की स्थिति सत्यापित करें।

```bash
# NocoBase सर्विस के पॉड की स्थिति देखें
kubectl get pods -l app=nocobase
```

उदाहरण आउटपुट इस प्रकार है। `STATUS` का `Running` होना इंगित करता है कि सेवा सफलतापूर्वक शुरू हो गई है:

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4.  पहली बार शुरू होने पर, आपको एडमिन इंटरफ़ेस में मैन्युअल रूप से निम्नलिखित प्लगइन सक्षम करने होंगे:

-   `@nocobase/plugin-sync-adapter-redis`
-   `@nocobase/plugin-lock-adapter-redis`

उसके बाद, आप स्केल अप कर सकते हैं। उदाहरण के लिए, 4 नोड्स तक स्केल करने के लिए:

```bash
kubectl scale deployment nocobase --replicas=4
```

## एप्लिकेशन में बदलाव

एप्लिकेशन में बदलाव निम्नलिखित स्थितियों को संदर्भित करते हैं:

-   एप्लिकेशन संस्करण का अपग्रेड
-   नए प्लगइन स्थापित करना
-   प्लगइन सक्रिय करना

NocoBase अभी तक उपरोक्त परिदृश्यों में क्लस्टर के कई इंस्टेंसों में बदलावों के स्वचालित सिंक्रनाइज़ेशन का समर्थन नहीं करता है। इसलिए, आपको नीचे दिए गए चरणों का पालन करके उन्हें मैन्युअल रूप से संभालना होगा। ये चरण केवल एप्लिकेशन सर्विस में बदलावों से संबंधित हैं। कोई भी बदलाव करने से पहले, कृपया अपने डेटाबेस और परसिस्टेंट स्टोरेज का स्वयं बैकअप लें।

### एप्लिकेशन संस्करण का रोलिंग अपग्रेड

1.  `kubectl set image` कमांड चलाकर डिप्लॉयमेंट के कंटेनर इमेज संस्करण को बदलें।

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2.  रोलिंग अपडेट की स्थिति जांचें।

    ```bash
    # डिप्लॉयमेंट की समग्र रोलिंग अपडेट प्रगति देखें
    kubectl rollout status deployment/nocobase

    # प्रत्येक पॉड की स्थिति देखें
    kubectl get pods -l app=nocobase
    ```

यदि आपको एप्लिकेशन संस्करण अपग्रेड प्रक्रिया के दौरान या बाद में कोई समस्या आती है और आपको संस्करण को रोलबैक करने की आवश्यकता है, तो कंटेनर इमेज संस्करण को रोलबैक करने के लिए निम्नलिखित कमांड चलाएं:

```bash
kubectl rollout undo deployment/nocobase
```

### एप्लिकेशन का सहज रीस्टार्ट

नए प्लगइन स्थापित या सक्रिय करने के बाद, आपको एप्लिकेशन कॉन्फ़िगरेशन या स्थिति को रीफ़्रेश करने की आवश्यकता होती है। आप प्रत्येक पॉड को सहजता से रीस्टार्ट करने के लिए निम्नलिखित कमांड का उपयोग कर सकते हैं।

1.  `kubectl rollout restart` कमांड चलाएं।

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2.  रोलिंग रीस्टार्ट की स्थिति जांचें।

    ```bash
    # डिप्लॉयमेंट की समग्र रीस्टार्ट प्रगति देखें
    kubectl rollout status deployment/nocobase

    # प्रत्येक पॉड की स्थिति देखें
    kubectl get pods -l app=nocobase
    ```

## एप्लिकेशन गेटवे

जब Kubernetes क्लस्टर में डिप्लॉय किए गए एप्लिकेशन को बाहर से एक्सेस किया जाना हो, तो आपको एप्लिकेशन की सर्विस के साथ एक Ingress को बाइंड करने की आवश्यकता होती है। इस लेख में उपयोग किया गया क्लस्टर वातावरण K3S है, जिसमें Traefik डिफ़ॉल्ट Ingress कंट्रोलर घटक के रूप में स्थापित होता है।

### Traefik IngressRoute

चरण इस प्रकार हैं:

1.  `nocobase-ingress.yaml` फ़ाइल बनाएं।

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # यहां, 'nocobase.local' को क्लस्टर के IP को इंगित करने वाले एक वास्तविक डोमेन नाम से बदला जाना चाहिए।
        # यदि आपके पास सत्यापन के लिए कोई डोमेन नहीं है, तो आप क्लस्टर के IP को इंगित करने वाले nocobase.local के लिए एक रिकॉर्ड जोड़ने के लिए अपनी स्थानीय होस्ट फ़ाइल को संशोधित कर सकते हैं।
        # फिर आप अपने ब्राउज़र में http://nocobase.local खोलकर क्लस्टर में NocoBase एप्लिकेशन को एक्सेस कर सकते हैं।
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # यह वह सर्विस है जिसे ऊपर "एप्लिकेशन डिप्लॉयमेंट" अनुभाग में nocobase एप्लिकेशन को डिप्लॉय करते समय बनाया गया था।
            - name: nocobase
              port: 13000
    ```

2.  `kubectl` कमांड चलाकर NocoBase एप्लिकेशन के Ingress को डिप्लॉय करें।

    ```bash
    kubectl apply -f nocobase-ingress.yaml
    ```

### Ingress-Nginx

अधिकांश Kubernetes क्लस्टर Ingress-Nginx को Ingress कंट्रोलर घटक के रूप में उपयोग करते हैं। नीचे Ingress-Nginx पर आधारित एक `nocobase-ingress.yaml` फ़ाइल दी गई है:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # यहां, 'nocobase.local' को क्लस्टर के IP को इंगित करने वाले एक वास्तविक डोमेन नाम से बदला जाना चाहिए।
    # यदि आपके पास सत्यापन के लिए कोई डोमेन नहीं है, तो आप क्लस्टर के IP को इंगित करने वाले nocobase.local के लिए एक रिकॉर्ड जोड़ने के लिए अपनी स्थानीय होस्ट फ़ाइल को संशोधित कर सकते हैं।
    # फिर आप अपने ब्राउज़र में http://nocobase.local खोलकर क्लस्टर में NocoBase एप्लिकेशन को एक्सेस कर सकते हैं।
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## Helm Charts का उपयोग करना

हमने NocoBase एप्लिकेशन के लिए Helm Charts बनाए हैं, जिससे आप Helm CLI का उपयोग करके Kubernetes में NocoBase एप्लिकेशन सर्विस को डिप्लॉय कर सकते हैं।

### पूर्व-आवश्यकताएं

सुनिश्चित करें कि आपके ऑपरेटिंग वातावरण में `kubectl` और `helm` जैसे क्लाइंट स्थापित हैं और `kubectl` लक्ष्य क्लस्टर से सही ढंग से कनेक्ट हो सकता है।

### रिपॉजिटरी जोड़ें

NocoBase Helm Charts रिपॉजिटरी जोड़ें:

```bash
# NocoBase की Helm Charts रिपॉजिटरी जोड़ें
helm repo add nocobase https://nocobase.github.io/helm-charts

# Helm इंडेक्स अपडेट करें
helm repo update
```

### Helm डिप्लॉयमेंट

1.  `values.yaml` फ़ाइल बनाएं।

    ```yaml
    persistent:
      # NocoBase क्लस्टर साझा स्टोरेज के लिए आवश्यक आकार
      size: 10Gi
      # क्लाउड सेवा के K8S द्वारा प्रदान की गई स्टोरेज क्लास
      # "एप्लिकेशन डिप्लॉयमेंट" अनुभाग के समान, इसे स्पष्ट रूप से खाली सेट किया गया है क्योंकि यह मास्टर नोड की NFS सेवा का उपयोग करता है।
      storageClassName: ""

    configMap:
      data:
        TZ: Asia/Shanghai
        # नीचे दिए गए डेटाबेस और Redis कॉन्फ़िगरेशन "K8S मिडिलवेयर डिप्लॉयमेंट" दस्तावेज़ में क्लस्टर में PostgreSQL सेवा और Redis सेवा का उपयोग करते हैं।
        # यदि आपके वातावरण में पहले से ही डेटाबेस और Redis सेवाएं मौजूद हैं, तो नीचे दिए गए संबंधित कॉन्फ़िगरेशन को संशोधित करें।
        CACHE_DEFAULT_STORE: redis
        # वातावरण में मौजूद या स्वयं द्वारा डिप्लॉय की गई Redis सेवा का उपयोग करें।
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # वातावरण में मौजूद या स्वयं द्वारा डिप्लॉय की गई PostgreSQL सेवा का उपयोग करें।
        DB_DATABASE: nocobase
        DB_DIALECT: postgres
        DB_HOST: "postgres-0.postgres-service"
        DB_PASSWORD: nocobase123
        DB_PORT: "5432"
        DB_UNDERSCORED: "true"
        DB_USER: nocobase
        # सेवा प्लेटफ़ॉर्म उपयोगकर्ता नाम
        NOCOBASE_PKG_USERNAME: "<आपका उपयोगकर्ता>"
        # सेवा प्लेटफ़ॉर्म पासवर्ड
        NOCOBASE_PKG_PASSWORD: "<आपका पासवर्ड>"

        # ... अन्य पर्यावरण चर
    ```

2.  `helm install` कमांड चलाकर इंस्टॉलेशन शुरू करें।

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```