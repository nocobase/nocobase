:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/message) देखें।
:::

# ctx.message

Ant Design ग्लोबल message API, जिसका उपयोग पेज के शीर्ष केंद्र (top center) में अस्थायी लाइट प्रॉम्प्ट (light prompts) प्रदर्शित करने के लिए किया जाता है। संदेश एक निश्चित समय के बाद अपने आप बंद हो जाते हैं, या उपयोगकर्ता द्वारा मैन्युअल रूप से भी बंद किए जा सकते हैं।

##适用场景 (उपयोग के मामले)

| परिदृश्य (Scenario) | विवरण |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | ऑपरेशन फीडबैक, सत्यापन (validation) प्रॉम्प्ट, कॉपी सफल होने जैसे लाइट प्रॉम्प्ट |
| **फॉर्म ऑपरेशन्स / वर्कफ़्लो** | सबमिशन सफल, सेव विफल, सत्यापन विफल आदि के लिए फीडबैक |
| **ऑपरेशन इवेंट्स (JSAction)** | क्लिक, बैच ऑपरेशन पूरा होने आदि के लिए तत्काल फीडबैक |

## टाइप परिभाषा (Type Definition)

```ts
message: MessageInstance;
```

`MessageInstance` एक Ant Design message इंटरफ़ेस है, जो निम्नलिखित मेथड प्रदान करता है।

## सामान्य मेथड

| मेथड | विवरण |
|------|------|
| `success(content, duration?)` | सफलता संदेश प्रदर्शित करें |
| `error(content, duration?)` | त्रुटि संदेश प्रदर्शित करें |
| `warning(content, duration?)` | चेतावनी संदेश प्रदर्शित करें |
| `info(content, duration?)` | सूचना संदेश प्रदर्शित करें |
| `loading(content, duration?)` | लोडिंग संदेश प्रदर्शित करें (इसे मैन्युअल रूप से बंद करना होगा) |
| `open(config)` | कस्टम कॉन्फ़िगरेशन का उपयोग करके संदेश खोलें |
| `destroy()` | वर्तमान में प्रदर्शित सभी संदेशों को बंद करें |

**पैरामीटर्स:**

- `content` (`string` \| `ConfigOptions`): संदेश की सामग्री या कॉन्फ़िगरेशन ऑब्जेक्ट
- `duration` (`number`, वैकल्पिक): ऑटो-क्लोज विलंब (सेकंड), डिफॉल्ट 3 सेकंड है; ऑटो-क्लोज को अक्षम करने के लिए 0 सेट करें

**ConfigOptions** (जब `content` एक ऑब्जेक्ट हो):

```ts
interface ConfigOptions {
  content: React.ReactNode;  // संदेश की सामग्री
  duration?: number;        // ऑटो-क्लोज विलंब (सेकंड)
  onClose?: () => void;    // बंद होने पर कॉल-बैक
  icon?: React.ReactNode;  // कस्टम आइकन
}
```

## उदाहरण

### बुनियादी उपयोग (Basic Usage)

```ts
ctx.message.success('ऑपरेशन सफल रहा');
ctx.message.error('ऑपरेशन विफल रहा');
ctx.message.warning('कृपया पहले डेटा चुनें');
ctx.message.info('प्रक्रिया जारी है...');
```

### ctx.t के साथ अंतर्राष्ट्रीयकरण (Internationalization)

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### लोडिंग और मैन्युअल रूप से बंद करना

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// एसिंक्रोनस ऑपरेशन निष्पादित करें
await saveData();
hide();  // लोडिंग को मैन्युअल रूप से बंद करें
ctx.message.success(ctx.t('Saved'));
```

### open के साथ कस्टम कॉन्फ़िगरेशन का उपयोग करना

```ts
ctx.message.open({
  type: 'success',
  content: 'कस्टम सफलता संदेश',
  duration: 5,
  onClose: () => console.log('message closed'),
});
```

### सभी संदेशों को बंद करना

```ts
ctx.message.destroy();
```

## ctx.message और ctx.notification के बीच अंतर

| विशेषता | ctx.message | ctx.notification |
|------|--------------|------------------|
| **स्थान (Position)** | पेज का शीर्ष केंद्र | ऊपरी दायां कोना |
| **उद्देश्य** | अस्थायी लाइट प्रॉम्प्ट, अपने आप गायब हो जाता है | नोटिफिकेशन पैनल, इसमें शीर्षक और विवरण हो सकता है, लंबे समय तक प्रदर्शन के लिए उपयुक्त |
| **विशिष्ट परिदृश्य** | ऑपरेशन फीडबैक, सत्यापन प्रॉम्प्ट, कॉपी सफल होना | कार्य पूरा होने की सूचना, सिस्टम संदेश, लंबी सामग्री जिसे उपयोगकर्ता के ध्यान की आवश्यकता हो |

## संबंधित

- [ctx.notification](./notification.md) - ऊपरी दाएं कोने में नोटिफिकेशन, लंबे समय तक प्रदर्शन के लिए उपयुक्त
- [ctx.modal](./modal.md) - मोडल पुष्टिकरण, ब्लॉकिंग इंटरैक्शन
- [ctx.t()](./t.md) - अंतर्राष्ट्रीयकरण, अक्सर message के साथ उपयोग किया जाता है