---
pkg: "@nocobase/plugin-data-source-external-oracle"
---
:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::


# बाहरी डेटा स्रोत - Oracle

## परिचय

आप बाहरी Oracle डेटाबेस को डेटा स्रोत के रूप में उपयोग कर सकते हैं। यह Oracle के संस्करण 11g और उससे ऊपर का समर्थन करता है।

## इंस्टॉलेशन

### Oracle क्लाइंट इंस्टॉल करें

यदि Oracle सर्वर का संस्करण 12.1 से कम है, तो आपको Oracle क्लाइंट इंस्टॉल करना होगा।

![Oracle क्लाइंट इंस्टॉलेशन](https://static-docs.nocobase.com/20241204164359.png)

Linux के लिए उदाहरण:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

यदि क्लाइंट ऊपर बताए गए तरीके से इंस्टॉल नहीं किया गया है, तो आपको क्लाइंट का पाथ (path) प्रदान करना होगा (अधिक जानकारी के लिए, [node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html) दस्तावेज़ देखें)।

![Oracle क्लाइंट पाथ कॉन्फ़िगरेशन](https://static-docs.nocobase.com/20241204165940.png)

### प्लगइन इंस्टॉल करें

देखें

## उपयोग

[डेटा स्रोत / बाहरी डेटाबेस](/data-sources/data-source-manager/external-database) अनुभाग में विस्तृत निर्देश देखें।