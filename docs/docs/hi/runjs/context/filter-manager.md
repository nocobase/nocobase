:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/filter-manager) देखें।
:::

# ctx.filterManager

फ़िल्टर कनेक्शन मैनेजर (Filter Connection Manager), फ़िल्टर फ़ॉर्म (FilterForm) और डेटा ब्लॉक (तालिका, सूची, चार्ट आदि) के बीच फ़िल्टर जुड़ाव (associations) को प्रबंधित करने के लिए उपयोग किया जाता है। यह `BlockGridModel` द्वारा प्रदान किया जाता है और केवल इसके संदर्भ (context) में (जैसे, फ़िल्टर फ़ॉर्म ब्लॉक, डेटा ब्लॉक) उपलब्ध होता है।

## उपयोग के मामले (Use Cases)

| परिदृश्य | विवरण |
|------|------|
| **फ़िल्टर फ़ॉर्म ब्लॉक** | फ़िल्टर आइटम और लक्ष्य ब्लॉक के बीच कनेक्शन कॉन्फ़िगरेशन प्रबंधित करता है; फ़िल्टर बदलने पर लक्ष्य डेटा को रीफ़्रेश करता है। |
| **डेटा ब्लॉक (तालिका/सूची)** | एक फ़िल्टर लक्ष्य के रूप में कार्य करता है, `bindToTarget` के माध्यम से फ़िल्टर शर्तों को बाइंड करता है। |
| **लिंकेज नियम / कस्टम FilterModel** | लक्ष्य रीफ़्रेश को ट्रिगर करने के लिए `doFilter` या `doReset` के भीतर `refreshTargetsByFilter` को कॉल करता है। |
| **कनेक्शन फ़ील्ड कॉन्फ़िगरेशन** | फ़िल्टर और लक्ष्यों के बीच फ़ील्ड मैपिंग बनाए रखने के लिए `getConnectFieldsConfig` और `saveConnectFieldsConfig` का उपयोग करता है। |

> **ध्यान दें:** `ctx.filterManager` केवल उन RunJS संदर्भों में उपलब्ध है जिनमें `BlockGridModel` होता है (जैसे, फ़िल्टर फ़ॉर्म वाले पेज के भीतर); सामान्य JSBlocks या स्वतंत्र पेजों में यह `undefined` होता है। उपयोग करने से पहले ऑप्शनल चेनिंग (optional chaining) का उपयोग करने की सलाह दी जाती है।

## टाइप परिभाषाएं (Type Definitions)

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // फ़िल्टर मॉडल UID
  targetId: string;   // लक्ष्य डेटा ब्लॉक मॉडल UID
  filterPaths?: string[];  // लक्ष्य ब्लॉक के फ़ील्ड पाथ
  operator?: string;  // फ़िल्टर ऑपरेटर
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## सामान्य विधियाँ (Common Methods)

| विधि | विवरण |
|------|------|
| `getFilterConfigs()` | वर्तमान के सभी फ़िल्टर कनेक्शन कॉन्फ़िगरेशन प्राप्त करता है। |
| `getConnectFieldsConfig(filterId)` | किसी विशिष्ट फ़िल्टर के लिए कनेक्शन फ़ील्ड कॉन्फ़िगरेशन प्राप्त करता है। |
| `saveConnectFieldsConfig(filterId, config)` | फ़िल्टर के लिए कनेक्शन फ़ील्ड कॉन्फ़िगरेशन सहेजता है। |
| `addFilterConfig(config)` | फ़िल्टर कॉन्फ़िगरेशन जोड़ता है (filterId + targetId + filterPaths)। |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | filterId, targetId, या दोनों के द्वारा फ़िल्टर कॉन्फ़िगरेशन हटाता है। |
| `bindToTarget(targetId)` | फ़िल्टर कॉन्फ़िगरेशन को लक्ष्य ब्लॉक से बाइंड करता है, जिससे फ़िल्टर लागू करने के लिए इसके resource को ट्रिगर किया जाता है। |
| `unbindFromTarget(targetId)` | लक्ष्य ब्लॉक से फ़िल्टर बाइंडिंग हटाता है। |
| `refreshTargetsByFilter(filterId | filterId[])` | फ़िल्टर के आधार पर संबंधित लक्ष्य ब्लॉक डेटा को रीफ़्रेश करता है। |

## मुख्य अवधारणाएं (Core Concepts)

- **FilterModel**: फ़िल्टर शर्तें प्रदान करने वाला एक मॉडल (जैसे, FilterFormItemModel), जिसे वर्तमान फ़िल्टर मान वापस करने के लिए `getFilterValue()` को लागू करना होगा।
- **TargetModel**: वह डेटा ब्लॉक जिसे फ़िल्टर किया जा रहा है; इसके `resource` को `addFilterGroup`, `removeFilterGroup`, और `refresh` का समर्थन करना चाहिए।

## उदाहरण

### फ़िल्टर कॉन्फ़िगरेशन जोड़ें

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### लक्ष्य ब्लॉक रीफ़्रेश करें

```ts
// फ़िल्टर फ़ॉर्म के doFilter / doReset में
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// कई फ़िल्टर से जुड़े लक्ष्यों को रीफ़्रेश करें
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### कनेक्शन फ़ील्ड कॉन्फ़िगरेशन

```ts
// कनेक्शन कॉन्फ़िगरेशन प्राप्त करें
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// कनेक्शन कॉन्फ़िगरेशन सहेजें
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### कॉन्फ़िगरेशन हटाएं

```ts
// किसी विशिष्ट फ़िल्टर के लिए सभी कॉन्फ़िगरेशन हटाएं
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// किसी विशिष्ट लक्ष्य के लिए सभी फ़िल्टर कॉन्फ़िगरेशन हटाएं
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## संबंधित

- [ctx.resource](./resource.md): लक्ष्य ब्लॉक के resource को फ़िल्टर इंटरफ़ेस का समर्थन करना चाहिए।
- [ctx.model](./model.md): filterId / targetId के लिए वर्तमान मॉडल का UID प्राप्त करने के लिए उपयोग किया जाता है।