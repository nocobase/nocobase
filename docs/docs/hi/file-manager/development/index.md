:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# एक्सटेंशन डेवलपमेंट

## स्टोरेज इंजन का विस्तार करना

### सर्वर-साइड

1.  **`StorageType` को इनहेरिट करें**
    
    एक नई क्लास बनाएँ और `make()` और `delete()` मेथड्स को इम्प्लीमेंट करें। ज़रूरत पड़ने पर, `getFileURL()`, `getFileStream()`, `getFileData()` जैसे हुक्स को ओवरराइड भी कर सकते हैं।

उदाहरण:

```ts
// packages/my-plugin/src/server/storages/custom.ts
import { AttachmentModel, StorageModel, StorageType } from '@nocobase/plugin-file-manager';
import type { StorageEngine } from 'multer';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

export class CustomStorageType extends StorageType {
  make(): StorageEngine {
    return multer.diskStorage({
      destination: path.resolve('custom-uploads'),
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    });
  }

  async delete(records: AttachmentModel[]) {
    let deleted = 0;
    const failures: AttachmentModel[] = [];
    for (const record of records) {
      try {
        await fs.unlink(path.resolve('custom-uploads', record.path || '', record.filename));
        deleted += 1;
      } catch (error) {
        failures.push(record);
      }
    }
    return [deleted, failures];
  }
}
```

4.  **नए टाइप को रजिस्टर करें**  
    प्लगइन के `beforeLoad` या `load` लाइफ़साइकिल में नए स्टोरेज इम्प्लीमेंटेशन को इंजेक्ट करें:

```ts
// packages/my-plugin/src/server/plugin.ts
import { Plugin } from '@nocobase/server';
import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import { CustomStorageType } from './storages/custom';

export default class MyStoragePluginServer extends Plugin {
  async load() {
    const fileManager = this.app.pm.get(PluginFileManagerServer);
    fileManager.registerStorageType('custom-storage', CustomStorageType);
  }
}
```

रजिस्ट्रेशन पूरा होने के बाद, स्टोरेज कॉन्फ़िगरेशन `storages` रिसोर्स में, बिल्ट-इन टाइप्स की तरह ही दिखाई देगा। `StorageType.defaults()` द्वारा दी गई कॉन्फ़िगरेशन का उपयोग फ़ॉर्म को ऑटो-फ़िल करने या डिफ़ॉल्ट रिकॉर्ड्स को इनिशियलाइज़ करने के लिए किया जा सकता है।

### क्लाइंट-साइड कॉन्फ़िगरेशन और मैनेजमेंट इंटरफ़ेस
क्लाइंट-साइड पर, आपको फ़ाइल मैनेजर को यह बताना होगा कि कॉन्फ़िगरेशन फ़ॉर्म को कैसे रेंडर किया जाए और क्या कोई कस्टम अपलोड लॉजिक है। प्रत्येक स्टोरेज टाइप ऑब्जेक्ट में ये प्रॉपर्टीज़ होती हैं:

## फ़्रंटएंड फ़ाइल टाइप्स का विस्तार करना

अपलोड की गई फ़ाइलों के लिए, आप फ़्रंटएंड इंटरफ़ेस पर अलग-अलग फ़ाइल टाइप्स के आधार पर अलग-अलग प्रीव्यू कंटेंट दिखा सकते हैं। फ़ाइल मैनेजर के अटैचमेंट फ़ील्ड में ब्राउज़र-आधारित फ़ाइल प्रीव्यू (एक iframe में एम्बेडेड) बिल्ट-इन होता है, जो ज़्यादातर फ़ाइल फ़ॉर्मेट्स (जैसे इमेज, वीडियो, ऑडियो और PDF) को सीधे ब्राउज़र में प्रीव्यू करने में सपोर्ट करता है। जब कोई फ़ाइल फ़ॉर्मेट ब्राउज़र प्रीव्यू द्वारा सपोर्ट नहीं किया जाता है, या जब विशेष प्रीव्यू इंटरैक्शन की ज़रूरत होती है, तो आप फ़ाइल टाइप-आधारित प्रीव्यू कॉम्पोनेंट का विस्तार करके इसे प्राप्त कर सकते हैं।

### उदाहरण

उदाहरण के लिए, यदि आप इमेज फ़ाइल टाइप के लिए एक कैरोसेल स्विचिंग कॉम्पोनेंट का विस्तार करना चाहते हैं, तो आप नीचे दिए गए कोड का उपयोग कर सकते हैं:

```tsx
import React, { useCallback } from 'react';
import match from 'mime-match';
import { Plugin, attachmentFileTypes } from '@nocobase/client';

class MyPlugin extends Plugin {
  load() {
    attachmentFileTypes.add({
      match(file) {
        return match(file.mimetype, 'image/*');
      },
      Previewer({ index, list, onSwitchIndex }) {
        const onDownload = useCallback(
          (e) => {
            e.preventDefault();
            const file = list[index];
            saveAs(file.url, `${file.title}${file.extname}`);
          },
          [index, list],
        );
        return (
          <LightBox
            // discourageDownloads={true}
            mainSrc={list[index]?.url}
            nextSrc={list[(index + 1) % list.length]?.url}
            prevSrc={list[(index + list.length - 1) % list.length]?.url}
            onCloseRequest={() => onSwitchIndex(null)}
            onMovePrevRequest={() => onSwitchIndex((index + list.length - 1) % list.length)}
            onMoveNextRequest={() => onSwitchIndex((index + 1) % list.length)}
            imageTitle={list[index]?.title}
            toolbarButtons={[
              <button
                key={'preview-img'}
                style={{ fontSize: 22, background: 'none', lineHeight: 1 }}
                type="button"
                aria-label="Download"
                title="Download"
                className="ril-zoom-in ril__toolbarItemChild ril__builtinButton"
                onClick={onDownload}
              >
                <DownloadOutlined />
              </button>,
            ]}
          />
        );
      },
    });
  }
}
```

यहाँ, `attachmentFileTypes` `@nocobase/client` पैकेज में दिया गया एंट्री ऑब्जेक्ट है जिसका उपयोग फ़ाइल टाइप्स का विस्तार करने के लिए किया जाता है। इसके `add` मेथड का उपयोग करके एक फ़ाइल टाइप डिस्क्रिप्शन ऑब्जेक्ट का विस्तार करें।

प्रत्येक फ़ाइल टाइप को एक `match()` मेथड इम्प्लीमेंट करना होगा, जिसका उपयोग यह जाँचने के लिए किया जाता है कि फ़ाइल टाइप आवश्यकताओं को पूरा करता है या नहीं। उदाहरण में, `mime-match` पैकेज द्वारा प्रदान किए गए मेथड का उपयोग फ़ाइल के `mimetype` एट्रिब्यूट की जाँच करने के लिए किया जाता है। यदि यह `image/*` टाइप से मेल खाता है, तो इसे प्रोसेस किए जाने वाले फ़ाइल टाइप के रूप में माना जाता है। यदि कोई मैच नहीं मिलता है, तो यह बिल्ट-इन टाइप हैंडलिंग पर वापस आ जाएगा।

टाइप डिस्क्रिप्शन ऑब्जेक्ट पर `Previewer` प्रॉपर्टी प्रीव्यू के लिए उपयोग किया जाने वाला कॉम्पोनेंट है। जब फ़ाइल टाइप मैच करता है, तो इस कॉम्पोनेंट को प्रीव्यू के लिए रेंडर किया जाएगा। आमतौर पर, एक डायलॉग-टाइप कॉम्पोनेंट (जैसे `<Modal />`) को बेस कंटेनर के रूप में उपयोग करने की सलाह दी जाती है, और फिर प्रीव्यू और इंटरैक्टिव कंटेंट को उस कॉम्पोनेंट के अंदर रखकर प्रीव्यू फ़ंक्शनैलिटी को इम्प्लीमेंट किया जाता है।

### API

```ts
export interface FileModel {
  id: number;
  filename: string;
  path: string;
  title: string;
  url: string;
  extname: string;
  size: number;
  mimetype: string;
}

export interface PreviewerProps {
  index: number;
  list: FileModel[];
  onSwitchIndex(index): void;
}

export interface AttachmentFileType {
  match(file: any): boolean;
  Previewer?: React.ComponentType<PreviewerProps>;
}

export class AttachmentFileTypes {
  add(type: AttachmentFileType): void;
}
```

#### `attachmentFileTypes`

`attachmentFileTypes` एक ग्लोबल इंस्टेंस है, जिसे `@nocobase/client` से इम्पोर्ट किया जाता है:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

फ़ाइल टाइप रजिस्ट्री में एक नया फ़ाइल टाइप डिस्क्रिप्शन ऑब्जेक्ट रजिस्टर करता है। डिस्क्रिप्शन ऑब्जेक्ट का टाइप `AttachmentFileType` है।

#### `AttachmentFileType`

##### `match()`

फ़ाइल फ़ॉर्मेट मैचिंग मेथड।

इनपुट पैरामीटर `file` अपलोड की गई फ़ाइल का डेटा ऑब्जेक्ट है, जिसमें टाइप जाँच के लिए उपयोग की जा सकने वाली संबंधित प्रॉपर्टीज़ शामिल हैं:

*   `mimetype`: mimetype डिस्क्रिप्शन
*   `extname`: फ़ाइल एक्सटेंशन, जिसमें "." शामिल है
*   `path`: फ़ाइल का रिलेटिव स्टोरेज पाथ
*   `url`: फ़ाइल URL

रिटर्न वैल्यू `boolean` टाइप की होती है, जो यह दर्शाती है कि मैच हुआ या नहीं।

##### `Previewer`

फ़ाइलों का प्रीव्यू करने के लिए एक React कॉम्पोनेंट।

आने वाले Props पैरामीटर्स हैं:

*   `index`: अटैचमेंट लिस्ट में फ़ाइल का इंडेक्स
*   `list`: अटैचमेंट लिस्ट
*   `onSwitchIndex`: इंडेक्स स्विच करने के लिए एक मेथड

`onSwitchIndex` को लिस्ट में से कोई भी इंडेक्स वैल्यू पास की जा सकती है, जिसका उपयोग किसी अन्य फ़ाइल पर स्विच करने के लिए किया जाता है। यदि `null` को आर्ग्यूमेंट के रूप में पास किया जाता है, तो प्रीव्यू कॉम्पोनेंट सीधे बंद हो जाएगा।

```ts
onSwitchIndex(null);
```