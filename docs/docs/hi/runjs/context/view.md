:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/view) देखें।
:::

# ctx.view

वर्तमान में सक्रिय व्यू कंट्रोलर (डायलॉग, ड्रॉअर, पॉपओवर, एम्बेडेड क्षेत्र आदि), जिसका उपयोग व्यू-स्तर की जानकारी और संचालन (operations) तक पहुँचने के लिए किया जाता है। `FlowViewContext` द्वारा प्रदान किया गया, यह केवल `ctx.viewer` या `ctx.openView` के माध्यम से खोले गए व्यू कंटेंट के भीतर उपलब्ध है।

##适用场景 (उपयोग के मामले)

| परिदृश्य | विवरण |
|------|------|
| **डायलॉग/ड्रॉअर कंटेंट** | वर्तमान व्यू को बंद करने के लिए `content` के भीतर `ctx.view.close()` का उपयोग करें, या शीर्षक और फ़ुटर रेंडर करने के लिए `Header` और `Footer` का उपयोग करें। |
| **फ़ॉर्म सबमिशन के बाद** | सफलतापूर्वक सबमिशन के बाद व्यू को बंद करने और परिणाम वापस भेजने के लिए `ctx.view.close(result)` को कॉल करें। |
| **JSBlock / Action** | `ctx.view.type` के माध्यम से वर्तमान व्यू प्रकार का निर्धारण करें, या `ctx.view.inputArgs` से ओपनिंग पैरामीटर पढ़ें। |
| **एसोसिएशन चयन, सब-टेबल** | डेटा लोडिंग के लिए `inputArgs` से `collectionName`, `filterByTk`, `parentId` आदि पढ़ें। |

> ध्यान दें: `ctx.view` केवल उन RunJS वातावरणों में उपलब्ध है जिनमें व्यू संदर्भ (view context) होता है (जैसे `ctx.viewer.dialog()` के कंटेंट के अंदर, डायलॉग फ़ॉर्म, या एसोसिएशन चयनकर्ता के अंदर); सामान्य पेजों या बैकएंड संदर्भों में यह `undefined` होता है। इसका उपयोग करते समय ऑप्शनल चेनिंग (optional chaining) (`ctx.view?.close?.()`) का उपयोग करने की सलाह दी जाती है।

## टाइप परिभाषा (Type Definition)

```ts
type FlowView = {
  type: 'drawer' | 'popover' | 'dialog' | 'embed';
  inputArgs: Record<string, any>;
  Header: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> | null;
  Footer: React.FC<{ children?: React.ReactNode }> | null;
  close: (result?: any, force?: boolean) => void;
  update: (newConfig: any) => void;
  navigation?: ViewNavigation;
  destroy?: () => void;
  submit?: () => Promise<any>;  // वर्कफ़्लो कॉन्फ़िगरेशन व्यू में उपलब्ध
};
```

## सामान्य गुण और विधियाँ (Common Properties and Methods)

| गुण/विधि | प्रकार | विवरण |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | वर्तमान व्यू का प्रकार |
| `inputArgs` | `Record<string, any>` | व्यू खोलते समय पास किए गए पैरामीटर, नीचे देखें |
| `Header` | `React.FC \| null` | हेडर कंपोनेंट, जिसका उपयोग शीर्षक और एक्शन क्षेत्रों को रेंडर करने के लिए किया जाता है |
| `Footer` | `React.FC \| null` | फ़ुटर कंपोनेंट, जिसका उपयोग बटन आदि को रेंडर करने के लिए किया जाता है |
| `close(result?, force?)` | `void` | वर्तमान व्यू को बंद करता है; `result` को कॉल करने वाले को वापस भेजा जा सकता है |
| `update(newConfig)` | `void` | व्यू कॉन्फ़िगरेशन अपडेट करता है (जैसे चौड़ाई, शीर्षक) |
| `navigation` | `ViewNavigation \| undefined` | पेज के भीतर व्यू नेविगेशन, जिसमें टैब स्विचिंग आदि शामिल है |

> वर्तमान में केवल `dialog` और `drawer` ही `Header` और `Footer` का समर्थन करते हैं।

## inputArgs के सामान्य फ़ील्ड

विभिन्न ओपनिंग परिदृश्यों के आधार पर `inputArgs` के फ़ील्ड अलग-अलग होते हैं। सामान्य फ़ील्ड में शामिल हैं:

| फ़ील्ड | विवरण |
|------|------|
| `viewUid` | व्यू UID |
| `collectionName` | संग्रह (Collection) का नाम |
| `filterByTk` | प्राइमरी की (Primary key) फ़िल्टर (एकल रिकॉर्ड विवरण के लिए) |
| `parentId` | पैरेंट ID (एसोसिएशन परिदृश्यों के लिए) |
| `sourceId` | सोर्स रिकॉर्ड ID |
| `parentItem` | पैरेंट आइटम डेटा |
| `scene` | सीन (जैसे `create`, `edit`, `select`) |
| `onChange` | चयन या परिवर्तन के बाद कॉलबैक |
| `tabUid` | वर्तमान टैब UID (एक पेज के भीतर) |

इन्हें `ctx.getVar('ctx.view.inputArgs.xxx')` या `ctx.view.inputArgs.xxx` के माध्यम से एक्सेस करें।

## उदाहरण

### वर्तमान व्यू को बंद करना

```ts
// सफलतापूर्वक सबमिट करने के बाद डायलॉग बंद करें
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// बंद करें और परिणाम वापस भेजें
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### कंटेंट में Header / Footer का उपयोग करना

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="एडिट" extra={<Button size="small">सहायता</Button>} />
      <div>फ़ॉर्म कंटेंट...</div>
      <Footer>
        <Button onClick={() => close()}>रद्द करें</Button>
        <Button type="primary" onClick={handleSubmit}>सबमिट करें</Button>
      </Footer>
    </div>
  );
}
```

### व्यू प्रकार या inputArgs के आधार पर ब्रांचिंग

```ts
if (ctx.view?.type === 'embed') {
  // एम्बेडेड व्यू में हेडर छिपाएं
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // यूज़र चयनकर्ता परिदृश्य
}
```

## ctx.viewer और ctx.openView के साथ संबंध

| उद्देश्य | अनुशंसित उपयोग |
|------|----------|
| **नया व्यू खोलें** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` या `ctx.openView()` |
| **वर्तमान व्यू पर काम करें** | `ctx.view.close()`, `ctx.view.update()` |
| **ओपनिंग पैरामीटर प्राप्त करें** | `ctx.view.inputArgs` |

`ctx.viewer` व्यू को "खोलने" के लिए ज़िम्मेदार है, जबकि `ctx.view` "वर्तमान" व्यू इंस्टेंस का प्रतिनिधित्व करता है; `ctx.openView` का उपयोग पहले से कॉन्फ़िगर किए गए वर्कफ़्लो व्यू को खोलने के लिए किया जाता है।

## ध्यान देने योग्य बातें

- `ctx.view` केवल व्यू के अंदर उपलब्ध है; सामान्य पेजों पर यह `undefined` होता है।
- ऑप्शनल चेनिंग का उपयोग करें: `ctx.view?.close?.()` ताकि व्यू संदर्भ न होने पर त्रुटियों से बचा जा सके।
- `close(result)` से प्राप्त `result`, `ctx.viewer.open()` द्वारा लौटाए गए Promise को पास कर दिया जाता है।

## संबंधित

- [ctx.openView()](./open-view.md): पहले से कॉन्फ़िगर किए गए वर्कफ़्लो व्यू को खोलें
- [ctx.modal](./modal.md): लाइटवेट पॉपअप (जानकारी, पुष्टि आदि)

> `ctx.viewer` व्यू खोलने के लिए `dialog()`, `drawer()`, `popover()`, और `embed()` जैसे तरीके प्रदान करता है। इन तरीकों से खोले गए `content` के भीतर `ctx.view` तक पहुँचा जा सकता है।