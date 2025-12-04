:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# अपना पहला ब्लॉक प्लगइन लिखें

शुरू करने से पहले, यह सलाह दी जाती है कि आप "[अपना पहला प्लगइन लिखें](../plugin-development/write-your-first-plugin.md)" पढ़ें, ताकि आप समझ सकें कि एक बुनियादी प्लगइन कैसे जल्दी से बनाया जाए। इसके बाद, हम इसमें एक साधारण ब्लॉक सुविधा जोड़कर इसका विस्तार करेंगे।

## चरण 1: ब्लॉक मॉडल फ़ाइल बनाएँ

प्लगइन डायरेक्टरी में एक नई फ़ाइल बनाएँ: `client/models/SimpleBlockModel.tsx`

## चरण 2: मॉडल सामग्री लिखें

फ़ाइल में एक बुनियादी ब्लॉक मॉडल को परिभाषित और लागू करें, जिसमें इसकी रेंडरिंग लॉजिक भी शामिल है:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by SimpleBlockModel.</p>
      </div>
    );
  }
}

SimpleBlockModel.define({
  label: tExpr('Hello block'),
});
```

## चरण 3: ब्लॉक मॉडल रजिस्टर करें

`client/models/index.ts` फ़ाइल में नए बनाए गए मॉडल को एक्सपोर्ट करें:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## चरण 4: ब्लॉक को सक्रिय करें और अनुभव करें

प्लगइन को सक्षम करने के बाद, आपको "ब्लॉक जोड़ें" ड्रॉपडाउन मेनू में नया **Hello block** विकल्प दिखाई देगा।

डेमो प्रभाव:

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## चरण 5: ब्लॉक में कॉन्फ़िगरेशन क्षमता जोड़ें

इसके बाद, हम **Flow** के माध्यम से ब्लॉक में कॉन्फ़िगर करने योग्य कार्यक्षमता जोड़ेंगे, जिससे उपयोगकर्ता इंटरफ़ेस में ब्लॉक सामग्री को संपादित कर सकें।

`SimpleBlockModel.tsx` फ़ाइल को संपादित करना जारी रखें:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

डेमो प्रभाव:

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## सारांश

इस लेख में बताया गया है कि एक साधारण ब्लॉक प्लगइन कैसे बनाया जाए, जिसमें शामिल हैं:

- ब्लॉक मॉडल को कैसे परिभाषित और लागू करें
- ब्लॉक मॉडल को कैसे रजिस्टर करें
- Flow के माध्यम से ब्लॉक में कॉन्फ़िगर करने योग्य कार्यक्षमता कैसे जोड़ें

पूर्ण सोर्स कोड संदर्भ: [सिंपल ब्लॉक उदाहरण](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)