:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# MySQL में फ़ेडरेटेड इंजन कैसे सक्षम करें

MySQL डेटाबेस में फ़ेडरेटेड मॉड्यूल डिफ़ॉल्ट रूप से सक्षम नहीं होता है। इसे सक्षम करने के लिए, आपको `my.cnf` कॉन्फ़िगरेशन को संशोधित करना होगा। यदि आप डॉकर (Docker) संस्करण का उपयोग कर रहे हैं, तो आप वॉल्यूम (volumes) के माध्यम से इसे विस्तारित कर सकते हैं:

```yml
mysql:
  image: mysql:8.1.0
  volumes:
    - ./storage/mysql-conf:/etc/mysql/conf.d
  environment:
    MYSQL_DATABASE: nocobase
    MYSQL_USER: nocobase
    MYSQL_PASSWORD: nocobase
    MYSQL_ROOT_PASSWORD: nocobase
  restart: always
  networks:
    - nocobase
```

एक नई `./storage/mysql-conf/federated.cnf` फ़ाइल बनाएँ:

```ini
[mysqld]
federated
```

MySQL को रीस्टार्ट करें:

```bash
docker compose up -d mysql
```

जाँचें कि क्या फ़ेडरेटेड सक्रिय हो गया है:

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)