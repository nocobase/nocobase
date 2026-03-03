:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/modal) देखें।
:::

# ctx.modal

Ant Design Modal पर आधारित एक शॉर्टकट API, जिसका उपयोग RunJS में सक्रिय रूप से मोडल बॉक्स (सूचना संकेत, पुष्टिकरण पॉप-अप आदि) खोलने के लिए किया जाता है। इसे `ctx.viewer` / व्यू सिस्टम द्वारा कार्यान्वित किया गया है।

## उपयोग के मामले (Use Cases)

| परिदृश्य | विवरण |
|------|------|
| **JSBlock / JSField** | उपयोगकर्ता इंटरैक्शन के बाद ऑपरेशन परिणाम, त्रुटि संकेत या द्वितीयक पुष्टिकरण प्रदर्शित करने के लिए। |
| **इवेंट फ्लो / ऑपरेशन इवेंट** | सबमिशन से पहले पॉप-अप पुष्टिकरण; यदि उपयोगकर्ता रद्द करता है, तो `ctx.exit()` के माध्यम से आगामी चरणों को समाप्त करने के लिए। |
| **लिंकेज नियम (Linkage Rules)** | सत्यापन (validation) विफल होने पर उपयोगकर्ता को पॉप-अप संकेत देने के लिए। |

> **ध्यान दें:** `ctx.modal` उन RunJS परिवेशों में उपलब्ध है जहाँ व्यू संदर्भ (view context) मौजूद है (जैसे पेज के भीतर JSBlock, इवेंट फ्लो आदि); बैकएंड या बिना UI वाले संदर्भों में यह मौजूद नहीं हो सकता है। इसका उपयोग करते समय वैकल्पिक चेनिंग (optional chaining) (`ctx.modal?.confirm?.()`) का उपयोग करने का सुझाव दिया जाता है।

## टाइप परिभाषा (Type Definition)

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // उपयोगकर्ता द्वारा OK क्लिक करने पर true, रद्द करने पर false लौटाता है
};
```

`ModalConfig`, Ant Design `Modal` के स्टैटिक मेथड कॉन्फ़िगरेशन के अनुरूप है।

## सामान्य तरीके (Common Methods)

| मेथड | रिटर्न वैल्यू | विवरण |
|------|--------|------|
| `info(config)` | `Promise<void>` | सूचना संकेत मोडल |
| `success(config)` | `Promise<void>` | सफलता संकेत मोडल |
| `error(config)` | `Promise<void>` | त्रुटि संकेत मोडल |
| `warning(config)` | `Promise<void>` | चेतावनी संकेत मोडल |
| `confirm(config)` | `Promise<boolean>` | पुष्टिकरण मोडल; यदि उपयोगकर्ता OK क्लिक करता है तो `true`, और रद्द करने पर `false` लौटाता है |

## कॉन्फ़िगरेशन पैरामीटर

Ant Design `Modal` के अनुरूप, सामान्य फ़ील्ड में शामिल हैं:

| पैरामीटर | टाइप | विवरण |
|------|------|------|
| `title` | `ReactNode` | शीर्षक |
| `content` | `ReactNode` | सामग्री |
| `okText` | `string` | OK बटन का टेक्स्ट |
| `cancelText` | `string` | कैंसिल बटन का टेक्स्ट (केवल `confirm` के लिए) |
| `onOk` | `() => void \| Promise<void>` | OK क्लिक करने पर निष्पादित होता है |
| `onCancel` | `() => void` | कैंसिल क्लिक करने पर निष्पादित होता है |

## ctx.message और ctx.openView के साथ संबंध

| उपयोग | अनुशंसित उपयोग |
|------|----------|
| **हल्का अस्थायी संकेत** | `ctx.message`, स्वचालित रूप से गायब हो जाता है |
| **सूचना/सफलता/त्रुटि/चेतावनी मोडल** | `ctx.modal.info` / `success` / `error` / `warning` |
| **द्वितीयक पुष्टिकरण (उपयोगकर्ता की पसंद आवश्यक)** | `ctx.modal.confirm`, फ्लो को नियंत्रित करने के लिए `ctx.exit()` के साथ उपयोग किया जाता है |
| **जटिल इंटरैक्शन जैसे फ़ॉर्म या सूचियाँ** | कस्टम व्यू (पेज/ड्रॉअर/मोडल) खोलने के लिए `ctx.openView` |

## उदाहरण

### सरल सूचना मोडल

```ts
ctx.modal.info({
  title: 'संकेत',
  content: 'ऑपरेशन पूरा हुआ',
});
```

### पुष्टिकरण मोडल और फ्लो कंट्रोल

```ts
const confirmed = await ctx.modal.confirm({
  title: 'हटाने की पुष्टि करें',
  content: 'क्या आप वाकई इस रिकॉर्ड को हटाना चाहते हैं?',
  okText: 'पुष्टि करें',
  cancelText: 'रद्द करें',
});
if (!confirmed) {
  ctx.exit();  // उपयोगकर्ता द्वारा रद्द किए जाने पर आगामी चरणों को समाप्त करें
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### onOk के साथ पुष्टिकरण मोडल

```ts
await ctx.modal.confirm({
  title: 'सबमिशन की पुष्टि करें',
  content: 'सबमिशन के बाद बदलाव नहीं किए जा सकेंगे। क्या आप जारी रखना चाहते हैं?',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### त्रुटि संकेत

```ts
try {
  await someOperation();
  ctx.modal.success({ title: 'सफलता', content: 'ऑपरेशन पूरा हुआ' });
} catch (e) {
  ctx.modal.error({ title: 'त्रुटि', content: e.message });
}
```

## संबंधित

- [ctx.message](./message.md): हल्का अस्थायी संकेत, स्वचालित रूप से गायब हो जाता है
- [ctx.exit()](./exit.md): उपयोगकर्ता द्वारा पुष्टिकरण रद्द करने पर फ्लो को समाप्त करने के लिए आमतौर पर `if (!confirmed) ctx.exit()` के रूप में उपयोग किया जाता है
- [ctx.openView()](./open-view.md): कस्टम व्यू खोलता है, जटिल इंटरैक्शन के लिए उपयुक्त है