:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/ai-employees/features/llm-service) देखें।
:::

# LLM सेवा कॉन्फ़िगर करें

AI कर्मचारियों (AI Employees) का उपयोग करने से पहले, आपको उपलब्ध LLM सेवाओं को कॉन्फ़िगर करना होगा।

वर्तमान में OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi और Ollama स्थानीय मॉडल समर्थित हैं।

## नई सेवा बनाएँ

`System Settings -> AI Employees -> LLM service` पर जाएँ।

1. नया डायलॉग खोलने के लिए `Add New` पर क्लिक करें।
2. `Provider` चुनें।
3. `Title`, `API Key`, और `Base URL` (वैकल्पिक) भरें।
4. `Enabled Models` कॉन्फ़िगर करें:
   - `Recommended models`: आधिकारिक तौर पर अनुशंसित मॉडल का उपयोग करें।
   - `Select models`: प्रोवाइडर द्वारा दी गई सूची से मॉडल चुनें।
   - `Manual input`: मॉडल ID और डिस्प्ले नाम मैन्युअल रूप से दर्ज करें।
5. सहेजने के लिए `Submit` पर क्लिक करें।

![llm-service-create-provider-enabled-models.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-create-provider-enabled-models.png)

## सेवा सक्षम करना और क्रमबद्ध करना

LLM सेवा सूची में आप सीधे:

- `Enabled` स्विच का उपयोग करके सेवा को चालू या बंद कर सकते हैं।
- सेवाओं के क्रम को बदलने के लिए उन्हें ड्रैग (Drag) कर सकते हैं (यह मॉडल के प्रदर्शित होने के क्रम को प्रभावित करता है)।

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## उपलब्धता परीक्षण

सेवा और मॉडल की उपलब्धता की जांच करने के लिए सेवा कॉन्फ़िगरेशन डायलॉग के नीचे `Test flight` का उपयोग करें।

व्यावसायिक उपयोग में लाने से पहले परीक्षण करने की सलाह दी जाती है।