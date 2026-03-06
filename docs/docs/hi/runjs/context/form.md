:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/form) देखें।
:::

# ctx.form

वर्तमान ब्लॉक के भीतर Ant Design Form इंस्टेंस, जिसका उपयोग फ़ॉर्म फ़ील्ड को पढ़ने/लिखने, सत्यापन (validation) और सबमिशन को ट्रिगर करने के लिए किया जाता है। यह `ctx.blockModel?.form` के बराबर है और फ़ॉर्म ब्लॉक (Form, EditForm, सब-फ़ॉर्म आदि) के तहत सीधे उपयोग किया जा सकता है।

##适用场景 (उपयोग के मामले)

| परिदृश्य | विवरण |
|------|------|
| **JSField** | लिंकेज लागू करने के लिए अन्य फ़ॉर्म फ़ील्ड को पढ़ना/लिखना, या अन्य फ़ील्ड मानों के आधार पर गणना या सत्यापन करना। |
| **JSItem** | टेबल के भीतर लिंकेज प्राप्त करने के लिए सब-टेबल आइटम में उसी पंक्ति (row) या अन्य फ़ील्ड को पढ़ना/लिखना। |
| **JSColumn** | रेंडरिंग के लिए टेबल कॉलम में उस पंक्ति या संबंधित फ़ील्ड मानों को पढ़ना। |
| **फ़ॉर्म ऑपरेशन / इवेंट फ्लो** | सबमिशन से पहले सत्यापन, फ़ील्ड को बल्क में अपडेट करना, फ़ॉर्म रीसेट करना आदि। |

> **ध्यान दें:** `ctx.form` केवल फ़ॉर्म ब्लॉक (Form, EditForm, सब-फ़ॉर्म आदि) से संबंधित RunJS संदर्भों (contexts) में उपलब्ध है; गैर-फ़ॉर्म परिदृश्यों (जैसे स्वतंत्र JSBlock, टेबल ब्लॉक) में यह मौजूद नहीं हो सकता है, उपयोग से पहले शून्य मान की जांच (null check) करने की सलाह दी जाती है: `ctx.form?.getFieldsValue()`।

## 类型定义 (टाइप परिभाषा)

```ts
form: FormInstance<any>;
```

`FormInstance` Ant Design Form का इंस्टेंस प्रकार है, इसके सामान्य तरीके नीचे दिए गए हैं।

## 常用方法 (सामान्य तरीके)

### फ़ॉर्म मान पढ़ना

```ts
// वर्तमान में पंजीकृत फ़ील्ड के मान पढ़ें (डिफ़ॉल्ट रूप से केवल रेंडर किए गए फ़ील्ड शामिल होते हैं)
const values = ctx.form.getFieldsValue();

// सभी फ़ील्ड के मान पढ़ें (इसमें पंजीकृत लेकिन रेंडर न किए गए फ़ील्ड शामिल हैं, जैसे छिपे हुए या कोलैप्स सेक्शन के भीतर)
const allValues = ctx.form.getFieldsValue(true);

// एक एकल फ़ील्ड पढ़ें
const email = ctx.form.getFieldValue('email');

// नेस्टेड फ़ील्ड पढ़ें (जैसे सब-टेबल में)
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### फ़ॉर्म मान लिखना

```ts
// बल्क अपडेट (आमतौर पर लिंकेज के लिए उपयोग किया जाता है)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// एक एकल फ़ील्ड अपडेट करें
ctx.form.setFieldValue('remark', 'अपडेट किया गया रिमार्क');
```

### सत्यापन और सबमिशन

```ts
// फ़ॉर्म सत्यापन ट्रिगर करें
await ctx.form.validateFields();

// फ़ॉर्म सबमिशन ट्रिगर करें
ctx.form.submit();
```

### रीसेट करना

```ts
// सभी फ़ील्ड रीसेट करें
ctx.form.resetFields();

// केवल विशिष्ट फ़ील्ड रीसेट करें
ctx.form.resetFields(['status', 'remark']);
```

## 与相关 context 的关系 (संबंधित संदर्भों के साथ संबंध)

### ctx.getValue / ctx.setValue

| परिदृश्य | अनुशंसित उपयोग |
|------|----------|
| **वर्तमान फ़ील्ड को पढ़ना/लिखना** | `ctx.getValue()` / `ctx.setValue(v)` |
| **अन्य फ़ील्ड को पढ़ना/लिखना** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

वर्तमान JS फ़ील्ड के भीतर, स्वयं फ़ील्ड को पढ़ने/लिखने के लिए `getValue`/`setValue` को प्राथमिकता दें; जब आपको अन्य फ़ील्ड तक पहुँचने की आवश्यकता हो तो `ctx.form` का उपयोग करें।

### ctx.blockModel

| आवश्यकता | अनुशंसित उपयोग |
|------|----------|
| **फ़ॉर्म फ़ील्ड पढ़ना/लिखना** | `ctx.form` (`ctx.blockModel?.form` के बराबर, अधिक सुविधाजनक) |
| **पैरेंट ब्लॉक तक पहुँच** | `ctx.blockModel` (इसमें `collection`, `resource` आदि शामिल हैं) |

### ctx.getVar('ctx.formValues')

फ़ॉर्म मान `await ctx.getVar('ctx.formValues')` के माध्यम से प्राप्त किए जाने चाहिए और सीधे `ctx.formValues` के रूप में प्रदर्शित नहीं होते हैं। फ़ॉर्म संदर्भ में, वास्तविक समय में नवीनतम मान पढ़ने के लिए `ctx.form.getFieldsValue()` का उपयोग करना बेहतर है।

## 注意事项 (महत्वपूर्ण बातें)

- `getFieldsValue()` डिफ़ॉल्ट रूप से केवल रेंडर किए गए फ़ील्ड लौटाता है; रेंडर न किए गए फ़ील्ड (जैसे कोलैप्स सेक्शन या शर्तों द्वारा छिपे हुए फ़ील्ड) को शामिल करने के लिए `true` पास करें: `getFieldsValue(true)`।
- सब-टेबल जैसे नेस्टेड फ़ील्ड के पाथ (path) ऐरे होते हैं, जैसे `['orders', 0, 'amount']`; आप वर्तमान फ़ील्ड का पाथ प्राप्त करने और उसी पंक्ति के अन्य कॉलम के लिए पाथ बनाने के लिए `ctx.namePath` का उपयोग कर सकते हैं।
- `validateFields()` एक त्रुटि ऑब्जेक्ट थ्रो करता है, जिसमें `errorFields` जैसी जानकारी होती है; सबमिशन से पहले सत्यापन विफल होने पर आप बाद के चरणों को रोकने के लिए `ctx.exit()` का उपयोग कर सकते हैं।
- वर्कफ़्लो या लिंकेज नियमों जैसे एसिंक्रोनस परिदृश्यों में, `ctx.form` अभी तैयार नहीं हो सकता है, इसलिए वैकल्पिक चेनिंग (optional chaining) या शून्य मान की जांच का उपयोग करने की सलाह दी जाती है।

## 示例 (उदाहरण)

### फ़ील्ड लिंकेज: प्रकार के आधार पर अलग-अलग सामग्री दिखाएं

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### अन्य फ़ील्ड के आधार पर वर्तमान फ़ील्ड की गणना करें

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### सब-टेबल के भीतर उसी पंक्ति के अन्य कॉलम को पढ़ना/लिखना

```ts
// ctx.namePath फ़ॉर्म में वर्तमान फ़ील्ड का पाथ है, जैसे ['orders', 0, 'amount']
// उसी पंक्ति के status को पढ़ें: ['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### सबमिशन से पहले सत्यापन

```ts
try {
  await ctx.form.validateFields();
  // सत्यापन सफल, सबमिशन लॉजिक के साथ जारी रखें
} catch (e) {
  ctx.message.error('कृपया फ़ॉर्म फ़ील्ड की जाँच करें');
  ctx.exit();
}
```

### पुष्टि के बाद सबमिट करें

```ts
const confirmed = await ctx.modal.confirm({
  title: 'सबमिशन की पुष्टि करें',
  content: 'सबमिशन के बाद आप इसे संशोधित नहीं कर पाएंगे। क्या आप जारी रखना चाहते हैं?',
  okText: 'पुष्टि करें',
  cancelText: 'रद्द करें',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // यदि उपयोगकर्ता रद्द करता है तो समाप्त करें
}
```

## 相关 (संबंधित)

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md): वर्तमान फ़ील्ड मान पढ़ें और लिखें
- [ctx.blockModel](./block-model.md): पैरेंट ब्लॉक मॉडल, `ctx.form` `ctx.blockModel?.form` के बराबर है
- [ctx.modal](./modal.md): पुष्टिकरण डायलॉग, अक्सर `ctx.form.validateFields()` और `ctx.form.submit()` के साथ उपयोग किया जाता है
- [ctx.exit()](./exit.md): सत्यापन विफलता या उपयोगकर्ता द्वारा रद्द किए जाने पर प्रक्रिया को समाप्त करें
- `ctx.namePath`: फ़ॉर्म में वर्तमान फ़ील्ड का पाथ (ऐरे), नेस्टेड फ़ील्ड में `getFieldValue` / `setFieldValue` के लिए नाम बनाने के लिए उपयोग किया जाता है