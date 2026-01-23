:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# NocoBase में API कुंजी (Key) का उपयोग करना

यह गाइड एक व्यावहारिक "करने योग्य कार्य" (To-Dos) उदाहरण के माध्यम से बताता है कि NocoBase में डेटा प्राप्त करने के लिए API कुंजी (Key) का उपयोग कैसे करें। पूरी वर्कफ़्लो (Workflow) को समझने के लिए नीचे दिए गए चरण-दर-चरण निर्देशों का पालन करें।

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 API कुंजी (Key) को समझना

API कुंजी (Key) एक सुरक्षित टोकन है जिसका उपयोग अधिकृत उपयोगकर्ताओं से आने वाले API अनुरोधों को प्रमाणित करने के लिए किया जाता है। यह एक क्रेडेंशियल के रूप में कार्य करता है जो वेब एप्लिकेशन, मोबाइल ऐप या बैकएंड स्क्रिप्ट के माध्यम से NocoBase सिस्टम तक पहुँचते समय अनुरोध करने वाले की पहचान को सत्यापित करता है।

HTTP अनुरोध हेडर में इसका प्रारूप इस प्रकार होता है:

```txt
Authorization: Bearer {API कुंजी}
```

"Bearer" उपसर्ग (prefix) यह दर्शाता है कि इसके बाद आने वाली स्ट्रिंग एक प्रमाणित API कुंजी (Key) है जिसका उपयोग अनुरोध करने वाले की अनुमतियों को सत्यापित करने के लिए किया जाता है।

### सामान्य उपयोग के मामले

API कुंजी (Key) का उपयोग आमतौर पर निम्नलिखित परिदृश्यों में किया जाता है:

1.  **क्लाइंट एप्लिकेशन एक्सेस**: वेब ब्राउज़र और मोबाइल ऐप उपयोगकर्ता की पहचान को प्रमाणित करने के लिए API कुंजी (Key) का उपयोग करते हैं, जिससे यह सुनिश्चित होता है कि केवल अधिकृत उपयोगकर्ता ही डेटा तक पहुँच सकें।
2.  **स्वचालित कार्य निष्पादन**: बैकग्राउंड प्रक्रियाएँ और निर्धारित कार्य (scheduled tasks) अपडेट, डेटा सिंक्रनाइज़ेशन और लॉगिंग संचालन को सुरक्षित रूप से निष्पादित करने के लिए API कुंजी (Key) का उपयोग करते हैं।
3.  **विकास और परीक्षण**: डेवलपर्स डीबगिंग और परीक्षण के दौरान प्रमाणित अनुरोधों का अनुकरण करने और API प्रतिक्रियाओं को सत्यापित करने के लिए API कुंजी (Key) का उपयोग करते हैं।

API कुंजी (Key) कई सुरक्षा लाभ प्रदान करती हैं: पहचान सत्यापन, उपयोग की निगरानी, अनुरोध दर सीमित करना और खतरे की रोकथाम, जो NocoBase के स्थिर और सुरक्षित संचालन को सुनिश्चित करती हैं।

## 2 NocoBase में API कुंजी (Key) बनाना

### 2.1 प्रमाणीकरण: API कुंजी (Key) प्लगइन को सक्रिय करें

सुनिश्चित करें कि अंतर्निहित [प्रमाणीकरण: API कुंजी (Key)](/plugins/@nocobase/plugin-api-keys/) प्लगइन सक्रिय है। एक बार सक्षम होने पर, सिस्टम सेटिंग्स में एक नया API कुंजी (Key) कॉन्फ़िगरेशन पेज दिखाई देगा।

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 एक परीक्षण संग्रह (Collection) बनाएँ

प्रदर्शन उद्देश्यों के लिए, `todos` नामक एक संग्रह (Collection) बनाएँ जिसमें निम्नलिखित फ़ील्ड हों:

-   `id`
-   `शीर्षक (title)`
-   `पूरा हुआ (completed)`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

संग्रह (Collection) में कुछ नमूना रिकॉर्ड जोड़ें:

-   खाना खाओ
-   सो जाओ
-   गेम खेलो

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 एक भूमिका बनाएँ और असाइन करें

API कुंजी (Key) उपयोगकर्ता भूमिकाओं से बंधी होती हैं, और सिस्टम असाइन की गई भूमिका के आधार पर अनुरोध अनुमतियों को निर्धारित करता है। API कुंजी (Key) बनाने से पहले, आपको एक भूमिका बनानी होगी और उचित अनुमतियों को कॉन्फ़िगर करना होगा। "टू-डू API भूमिका" नामक एक भूमिका बनाएँ और उसे `todos` संग्रह (Collection) तक पूर्ण पहुँच प्रदान करें।

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

यदि API कुंजी (Key) बनाते समय "टू-डू API भूमिका" उपलब्ध नहीं है, तो सुनिश्चित करें कि वर्तमान उपयोगकर्ता को यह भूमिका असाइन की गई है:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

भूमिका असाइन करने के बाद, पेज को रीफ़्रेश करें और API कुंजी (Key) प्रबंधन पेज पर जाएँ। यह सत्यापित करने के लिए "API कुंजी (Key) जोड़ें" पर क्लिक करें कि "टू-डू API भूमिका" भूमिका चयन में दिखाई देती है।

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

बेहतर एक्सेस कंट्रोल के लिए, API कुंजी (Key) प्रबंधन और परीक्षण के लिए विशेष रूप से एक समर्पित उपयोगकर्ता खाता (उदाहरण के लिए, "टू-डू API उपयोगकर्ता") बनाने पर विचार करें। इस उपयोगकर्ता को "टू-डू API भूमिका" असाइन करें।
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 API कुंजी (Key) जनरेट करें और सहेजें

फ़ॉर्म सबमिट करने के बाद, सिस्टम नई जनरेट की गई API कुंजी (Key) के साथ एक पुष्टिकरण संदेश प्रदर्शित करेगा। **महत्वपूर्ण**: इस कुंजी (Key) को तुरंत कॉपी करें और सुरक्षित रूप से स्टोर करें, क्योंकि सुरक्षा कारणों से यह फिर से प्रदर्शित नहीं होगी।

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

API कुंजी (Key) का उदाहरण:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 महत्वपूर्ण नोट्स

-   API कुंजी (Key) की वैधता अवधि (validity period) निर्माण के समय कॉन्फ़िगर की गई समाप्ति सेटिंग द्वारा निर्धारित होती है।
-   API कुंजी (Key) का जनरेशन और सत्यापन `APP_KEY` एनवायरनमेंट वेरिएबल पर निर्भर करता है। **इस वेरिएबल को संशोधित न करें**, क्योंकि ऐसा करने से सिस्टम में सभी मौजूदा API कुंजी (Key) अमान्य हो जाएँगी।

## 3 API कुंजी (Key) प्रमाणीकरण का परीक्षण करना

### 3.1 API दस्तावेज़ प्लगइन का उपयोग करना

प्रत्येक API एंडपॉइंट के लिए अनुरोध विधियों, URL, पैरामीटर और हेडर को देखने के लिए [API दस्तावेज़](/plugins/@nocobase/plugin-api-doc/) प्लगइन खोलें।

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 बुनियादी CRUD संचालन को समझना

NocoBase डेटा हेरफेर (manipulation) के लिए मानक CRUD (बनाना, पढ़ना, अपडेट करना, हटाना) API प्रदान करता है:

-   **सूची क्वेरी (list API):**

    ```txt
    GET {baseURL}/{collectionName}:list
    अनुरोध हेडर:
    - Authorization: Bearer <API कुंजी>

    ```
-   **रिकॉर्ड बनाएँ (create API):**

    ```txt
    POST {baseURL}/{collectionName}:create

    अनुरोध हेडर:
    - Authorization: Bearer <API कुंजी>

    अनुरोध बॉडी (JSON प्रारूप में), उदाहरण के लिए:
        {
            "title": "123"
        }
    ```
-   **रिकॉर्ड अपडेट करें (update API):**

    ```txt
    POST {baseURL}/{collectionName}:update?filterByTk={id}
    अनुरोध हेडर:
    - Authorization: Bearer <API कुंजी>

    अनुरोध बॉडी (JSON प्रारूप में), उदाहरण के लिए:
        {
            "title": "123",
            "completed": true
        }
    ```
-   **रिकॉर्ड हटाएँ (delete API):**

    ```txt
    POST {baseURL}/{collectionName}:destroy?filterByTk={id}
    अनुरोध हेडर:
    - Authorization: Bearer <API कुंजी>
    ```

जहाँ:
-   `{baseURL}`: आपका NocoBase सिस्टम URL
-   `{collectionName}`: संग्रह (Collection) का नाम

उदाहरण: `localhost:13000` पर `todos` नामक संग्रह (Collection) वाले एक स्थानीय इंस्टेंस के लिए:

```txt
http://localhost:13000/api/todos:list
```

### 3.3 Postman के साथ परीक्षण करना

Postman में निम्नलिखित कॉन्फ़िगरेशन के साथ एक GET अनुरोध बनाएँ:
-   **URL**: अनुरोध एंडपॉइंट (उदाहरण के लिए, `http://localhost:13000/api/todos:list`)
-   **Headers**: `Authorization` हेडर जोड़ें, जिसका मान है:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**सफल प्रतिक्रिया:**

```json
{
    "data": [
        {
            "createdAt": "2025-03-03T09:57:36.728Z",
            "updatedAt": "2025-03-03T09:57:36.728Z",
            "completed": null,
            "createdById": 1,
            "id": 1,
            "title": "eat food",
            "updatedById": 1
        }
    ],
    "meta": {
        "count": 1,
        "page": 1,
        "pageSize": 20,
        "totalPage": 1
    }
}
```

**त्रुटि प्रतिक्रिया (अमान्य/समाप्त API कुंजी):**

```json
{
    "errors": [
        {
            "message": "Your session has expired. Please sign in again.",
            "code": "INVALID_TOKEN"
        }
    ]
}
```

**समस्या निवारण**: यदि प्रमाणीकरण विफल रहता है, तो भूमिका अनुमतियों, API कुंजी (Key) बाइंडिंग और टोकन प्रारूप को सत्यापित करें।

### 3.4 अनुरोध कोड निर्यात करें

Postman आपको विभिन्न प्रारूपों में अनुरोध निर्यात करने की अनुमति देता है। cURL कमांड का उदाहरण:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 JS ब्लॉक में API कुंजी (Key) का उपयोग करना

NocoBase 2.0 JS ब्लॉक का उपयोग करके सीधे पेजों में नेटिव JavaScript कोड लिखने का समर्थन करता है। यह उदाहरण बताता है कि API कुंजी (Key) का उपयोग करके बाहरी API डेटा कैसे प्राप्त करें।

### एक JS ब्लॉक बनाएँ

अपने NocoBase पेज में, एक JS ब्लॉक जोड़ें और करने योग्य कार्यों (to-do list) का डेटा प्राप्त करने के लिए निम्नलिखित कोड का उपयोग करें:

```javascript
// API कुंजी (Key) का उपयोग करके करने योग्य कार्यों का डेटा प्राप्त करें
async function fetchTodos() {
  try {
    // लोडिंग संदेश दिखाएँ
    ctx.message.loading('डेटा प्राप्त किया जा रहा है...');

    // HTTP अनुरोधों के लिए axios लाइब्रेरी लोड करें
    const axios = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js');

    if (!axios) {
      ctx.message.error('HTTP लाइब्रेरी लोड करने में विफल रहा');
      return;
    }

    // API कुंजी (Key) (अपनी वास्तविक API कुंजी से बदलें)
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M';

    // API अनुरोध करें
    const response = await axios.get('http://localhost:13000/api/todos:list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // परिणाम प्रदर्शित करें
    console.log('करने योग्य कार्यों की सूची:', response.data);
    ctx.message.success(`सफलतापूर्वक ${response.data.data.length} आइटम प्राप्त किए गए`);

    // आप यहाँ डेटा को प्रोसेस कर सकते हैं
    // उदाहरण के लिए: एक तालिका में प्रदर्शित करें, फ़ॉर्म फ़ील्ड अपडेट करें, आदि।

  } catch (error) {
    console.error('डेटा प्राप्त करने में त्रुटि:', error);
    ctx.message.error('डेटा प्राप्त करने में विफल रहा: ' + error.message);
  }
}

// फ़ंक्शन निष्पादित करें
fetchTodos();
```

### मुख्य बिंदु

-   **ctx.requireAsync()**: HTTP अनुरोधों के लिए बाहरी लाइब्रेरी (जैसे axios) को गतिशील रूप से लोड करता है
-   **ctx.message**: उपयोगकर्ता सूचनाएँ प्रदर्शित करता है (लोड हो रहा है, सफल, त्रुटि संदेश)
-   **API कुंजी (Key) प्रमाणीकरण**: `Authorization` अनुरोध हेडर में API कुंजी (Key) पास करें, `Bearer` उपसर्ग का उपयोग करके
-   **प्रतिक्रिया हैंडलिंग**: आवश्यकतानुसार लौटाए गए डेटा को प्रोसेस करें (प्रदर्शित करें, रूपांतरित करें, आदि)

## 5 सारांश

इस गाइड में NocoBase में API कुंजी (Key) का उपयोग करने की पूरी वर्कफ़्लो (Workflow) शामिल है:

1.  **सेटअप**: API कुंजी (Key) प्लगइन को सक्रिय करना और एक परीक्षण संग्रह (Collection) बनाना
2.  **कॉन्फ़िगरेशन**: उचित अनुमतियों के साथ भूमिकाएँ बनाना और API कुंजी (Key) जनरेट करना
3.  **परीक्षण**: Postman और API दस्तावेज़ प्लगइन का उपयोग करके API कुंजी (Key) प्रमाणीकरण को मान्य करना
4.  **एकीकरण**: JS ब्लॉक में API कुंजी (Key) का उपयोग करना

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

**अतिरिक्त संसाधन:**
-   [API कुंजी (Key) प्लगइन दस्तावेज़](/plugins/@nocobase/plugin-api-keys/)
-   [API दस्तावेज़ प्लगइन](/plugins/@nocobase/plugin-api-doc/)