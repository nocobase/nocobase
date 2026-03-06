:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/location) देखें।
:::

# ctx.location

वर्तमान रूट (route) स्थान की जानकारी, जो React Router के `location` ऑब्जेक्ट के समकक्ष है। इसका उपयोग आमतौर पर `ctx.router` और `ctx.route` के साथ वर्तमान पथ (path), क्वेरी स्ट्रिंग, हैश (hash) और रूट के माध्यम से भेजे गए स्टेट (state) को पढ़ने के लिए किया जाता है।

##适用场景 (उपयोग के मामले)

| परिदृश्य | विवरण |
|------|------|
| **JSBlock / JSField** | वर्तमान पथ, क्वेरी पैरामीटर या हैश के आधार पर कंडीशनल रेंडरिंग या लॉजिक ब्रांचिंग करने के लिए। |
| **लिंकेज नियम / इवेंट फ्लो** | लिंकेज फ़िल्टरिंग के लिए URL क्वेरी पैरामीटर पढ़ने, या `location.state` के आधार पर स्रोत (source) का पता लगाने के लिए। |
| **रूट नेविगेशन के बाद की प्रोसेसिंग** | लक्ष्य पेज पर `ctx.location.state` का उपयोग करके पिछले पेज से `ctx.router.navigate` के माध्यम से भेजे गए डेटा को प्राप्त करने के लिए। |

> **नोट:** `ctx.location` केवल उन RunJS वातावरणों में उपलब्ध है जहाँ रूटिंग संदर्भ (routing context) मौजूद हो (जैसे पेज के भीतर JSBlock, इवेंट फ्लो आदि); शुद्ध बैकएंड या बिना रूटिंग वाले संदर्भों (जैसे वर्कफ़्लो) में यह खाली (null) हो सकता है।

## टाइप परिभाषा

```ts
location: Location;
```

`Location`, `react-router-dom` से आता है, जो React Router के `useLocation()` के रिटर्न वैल्यू के समान है।

## सामान्य फ़ील्ड

| फ़ील्ड | प्रकार | विवरण |
|------|------|------|
| `pathname` | `string` | वर्तमान पथ, जो `/` से शुरू होता है (जैसे `/admin/users`) |
| `search` | `string` | क्वेरी स्ट्रिंग, जो `?` से शुरू होती है (जैसे `?page=1&status=active`) |
| `hash` | `string` | हैश फ्रैगमेंट, जो `#` से शुरू होता है (जैसे `#section-1`) |
| `state` | `any` | `ctx.router.navigate(path, { state })` के माध्यम से भेजा गया कोई भी डेटा, जो URL में दिखाई नहीं देता है। |
| `key` | `string` | इस लोकेशन का विशिष्ट पहचानकर्ता (unique identifier); शुरुआती पेज के लिए यह `"default"` होता है। |

## ctx.router और ctx.urlSearchParams के साथ संबंध

| उपयोग | अनुशंसित उपयोग |
|------|----------|
| **पथ, हैश, स्टेट पढ़ें** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **क्वेरी पैरामीटर पढ़ें (ऑब्जेक्ट के रूप में)** | `ctx.urlSearchParams`, जो सीधे पार्स किया गया ऑब्जेक्ट प्रदान करता है। |
| **सर्च स्ट्रिंग को पार्स करें** | `new URLSearchParams(ctx.location.search)` या सीधे `ctx.urlSearchParams` का उपयोग करें। |

`ctx.urlSearchParams` को `ctx.location.search` से पार्स किया जाता है। यदि आपको केवल क्वेरी पैरामीटर की आवश्यकता है, तो `ctx.urlSearchParams` का उपयोग करना अधिक सुविधाजनक है।

## उदाहरण

### पथ के आधार पर ब्रांचिंग

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('वर्तमान में उपयोगकर्ता प्रबंधन पेज पर हैं');
}
```

### क्वेरी पैरामीटर पार्स करना

```ts
// तरीका 1: ctx.urlSearchParams का उपयोग करना (अनुशंसित)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// तरीका 2: सर्च को पार्स करने के लिए URLSearchParams का उपयोग करना
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### रूट नेविगेशन के माध्यम से भेजे गए स्टेट को प्राप्त करना

```ts
// पिछले पेज से नेविगेट करते समय: ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('डैशबोर्ड से नेविगेट करके आए हैं');
}
```

### हैश के माध्यम से एंकर (Anchor) का पता लगाना

```ts
const hash = ctx.location.hash; // जैसे "#edit"
if (hash === '#edit') {
  // संपादन क्षेत्र (edit area) पर स्क्रॉल करें या संबंधित लॉजिक चलाएँ
}
```

## संबंधित

- [ctx.router](./router.md): रूट नेविगेशन; `ctx.router.navigate` से प्राप्त `state` को लक्ष्य पेज पर `ctx.location.state` के माध्यम से प्राप्त किया जा सकता है।
- [ctx.route](./route.md): वर्तमान रूट मिलान जानकारी (पैरामीटर, कॉन्फ़िगरेशन आदि), जिसे अक्सर `ctx.location` के साथ उपयोग किया जाता है।