:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/ai-employees/features/tool) देखें।
:::

# कौशल (Skills) का उपयोग करें

कौशल (Skills) यह परिभाषित करते हैं कि एक AI कर्मचारी "क्या कर सकता है"।

## कौशल संरचना (Skill Structure)

कौशल पृष्ठ को तीन श्रेणियों में बांटा गया है:

1. `General skills`: सभी AI कर्मचारियों द्वारा साझा किए जाते हैं, केवल पढ़ने के लिए (read-only)।
2. `Employee-specific skills`: वर्तमान कर्मचारी के लिए विशिष्ट, आमतौर पर केवल पढ़ने के लिए (read-only)।
3. `Custom skills`: कस्टम कौशल जिन्हें जोड़ा/हटाया जा सकता है और डिफ़ॉल्ट अनुमतियों (permissions) के साथ कॉन्फ़िगर किया जा सकता है।

![skills-three-sections-general-specific-custom.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/skills-three-sections-general-specific-custom.png)

## कौशल अनुमतियाँ (Skill Permissions)

कौशल अनुमतियों को इस प्रकार एकीकृत किया गया है:

- `Ask`: कॉल करने से पहले पुष्टि (confirmation) मांगें।
- `Allow`: सीधे कॉल करने की अनुमति दें।

सुझाव: डेटा में संशोधन करने वाले कौशल के लिए डिफ़ॉल्ट रूप से `Ask` का उपयोग करें।

![skills-permission-ask-allow-segmented.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/skills-permission-ask-allow-segmented.png)

## जोड़ना और रखरखाव

कौशल जोड़ने के लिए `Custom skills` में `Add skill` पर क्लिक करें और व्यावसायिक जोखिम के आधार पर अनुमतियाँ कॉन्फ़िगर करें।