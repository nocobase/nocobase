:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# FlowModel को रेंडर करना

FlowModelRenderer, FlowModel को रेंडर करने के लिए मुख्य React कंपोनेंट है। यह FlowModel इंस्टेंस को एक विज़ुअल React कंपोनेंट में बदलने का काम करता है।

## बुनियादी उपयोग

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// बुनियादी उपयोग
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

नियंत्रित फील्ड मॉडल के लिए, रेंडर करने के लिए FieldModelRenderer का उपयोग करें:

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// नियंत्रित फील्ड रेंडरिंग
<FieldModelRenderer model={fieldModel} />
```

## प्रॉप्स (Props)

### FlowModelRendererProps

| पैरामीटर | प्रकार | डिफ़ॉल्ट मान | विवरण |
|------|------|--------|------|
| `model` | `FlowModel` | - | `FlowModel` इंस्टेंस जिसे रेंडर करना है |
| `uid` | `string` | - | फ्लो मॉडल के लिए अद्वितीय पहचानकर्ता |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | रेंडरिंग विफल होने पर प्रदर्शित करने के लिए फ़ॉलबैक सामग्री |
| `showFlowSettings` | `boolean \| object` | `false` | क्या फ्लो सेटिंग्स के लिए एंट्री दिखानी है |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | फ्लो सेटिंग्स के लिए इंटरैक्शन स्टाइल |
| `hideRemoveInSettings` | `boolean` | `false` | क्या सेटिंग्स में 'हटाएँ' बटन को छिपाना है |
| `showTitle` | `boolean` | `false` | क्या बॉर्डर के ऊपर-बाएँ कोने में मॉडल का शीर्षक दिखाना है |
| `skipApplyAutoFlows` | `boolean` | `false` | क्या ऑटो फ्लो लागू करने को छोड़ना है |
| `inputArgs` | `Record<string, any>` | - | `useApplyAutoFlows` को पास किया गया अतिरिक्त संदर्भ |
| `showErrorFallback` | `boolean` | `true` | क्या सबसे बाहरी परत को `FlowErrorFallback` कंपोनेंट से रैप करना है |
| `settingsMenuLevel` | `number` | - | सेटिंग्स मेनू स्तर: 1=केवल वर्तमान मॉडल, 2=चाइल्ड मॉडल शामिल करें |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | अतिरिक्त टूलबार आइटम |

### showFlowSettings की विस्तृत कॉन्फ़िगरेशन

जब `showFlowSettings` एक ऑब्जेक्ट हो, तो निम्नलिखित कॉन्फ़िगरेशन समर्थित हैं:

```tsx pure
showFlowSettings={{
  showBackground: true,    // बैकग्राउंड दिखाएँ
  showBorder: true,        // बॉर्डर दिखाएँ
  showDragHandle: true,    // ड्रैग हैंडल दिखाएँ
  style: {},              // कस्टम टूलबार स्टाइल
  toolbarPosition: 'inside' // टूलबार की स्थिति: 'inside' | 'above' | 'below'
}}
```

## रेंडरिंग जीवनचक्र

पूरा रेंडरिंग जीवनचक्र निम्नलिखित विधियों को क्रम से कॉल करता है:

1.  **model.dispatchEvent('beforeRender')** - रेंडर से पहले का इवेंट
2.  **model.render()** - मॉडल की रेंडर विधि को निष्पादित करता है
3.  **model.onMount()** - कंपोनेंट माउंट हुक
4.  **model.onUnmount()** - कंपोनेंट अनमाउंट हुक

## उपयोग के उदाहरण

### बुनियादी रेंडरिंग

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>लोड हो रहा है...</div>}
    />
  );
}
```

### फ्लो सेटिंग्स के साथ रेंडरिंग

```tsx pure
// सेटिंग्स दिखाएँ लेकिन 'हटाएँ' बटन छिपाएँ
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// सेटिंग्स और शीर्षक दिखाएँ
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// कॉन्टेक्स्ट मेनू मोड का उपयोग करें
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### कस्टम टूलबार

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: 'कस्टम एक्शन',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('कस्टम एक्शन');
      }
    }
  ]}
/>
```

### ऑटो फ्लो को छोड़ना

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### फील्ड मॉडल रेंडरिंग

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

function FormField({ model, onChange, ...props }) {
  return (
    <FieldModelRenderer
      model={model}
      onChange={onChange}
      {...props}
    />
  );
}
```

## त्रुटि प्रबंधन

FlowModelRenderer में एक व्यापक अंतर्निहित त्रुटि प्रबंधन तंत्र है:

-   **स्वचालित त्रुटि सीमा**: डिफ़ॉल्ट रूप से `showErrorFallback={true}` सक्षम है
-   **ऑटो फ्लो त्रुटियाँ**: ऑटो फ्लो के निष्पादन के दौरान होने वाली त्रुटियों को पकड़ता और संभालता है
-   **रेंडरिंग त्रुटियाँ**: जब मॉडल रेंडरिंग विफल हो जाती है तो फ़ॉलबैक सामग्री प्रदर्शित करता है

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>रेंडरिंग विफल रही, कृपया पुनः प्रयास करें</div>}
/>
```

## प्रदर्शन अनुकूलन

### ऑटो फ्लो को छोड़ना

उन परिदृश्यों के लिए जहाँ ऑटो फ्लो की आवश्यकता नहीं है, आप प्रदर्शन को बेहतर बनाने के लिए उन्हें छोड़ सकते हैं:

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### रिएक्टिव अपडेट्स

FlowModelRenderer, रिएक्टिव अपडेट्स के लिए `@formily/reactive-react` के `observer` का उपयोग करता है, जिससे यह सुनिश्चित होता है कि मॉडल की स्थिति बदलने पर कंपोनेंट स्वचालित रूप से फिर से रेंडर हो जाए।

## ध्यान देने योग्य बातें

1.  **मॉडल सत्यापन**: सुनिश्चित करें कि पास किए गए `model` में एक वैध `render` विधि है।
2.  **जीवनचक्र प्रबंधन**: मॉडल के जीवनचक्र हुक को उचित समय पर कॉल किया जाएगा।
3.  **त्रुटि सीमा**: बेहतर उपयोगकर्ता अनुभव प्रदान करने के लिए उत्पादन वातावरण में त्रुटि सीमा को सक्षम करने की सलाह दी जाती है।
4.  **प्रदर्शन विचार**: बड़ी संख्या में मॉडल रेंडरिंग वाले परिदृश्यों के लिए, `skipApplyAutoFlows` विकल्प का उपयोग करने पर विचार करें।