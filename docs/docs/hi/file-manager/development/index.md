:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# एक्सटेंशन डेवलपमेंट

## स्टोरेज इंजन का विस्तार करना

### सर्वर साइड

1. **`StorageType` का विस्तार करें**
   
   एक नई क्लास बनाएं और `make()` तथा `delete()` मेथड्स को लागू करें। ज़रूरत पड़ने पर `getFileURL()`, `getFileStream()` और `getFileData()` जैसे hooks को override करें।

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

4. **नया प्रकार रजिस्टर करें**  
   प्लगइन के `beforeLoad` या `load` लाइफसाइकिल में नई स्टोरेज इम्प्लीमेंटेशन जोड़ें:

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

रजिस्ट्रेशन के बाद स्टोरेज कॉन्फ़िगरेशन `storages` रिसोर्स में बिल्ट-इन टाइप्स की तरह दिखाई देगा। `StorageType.defaults()` द्वारा दी गई कॉन्फ़िगरेशन का उपयोग फॉर्म्स को ऑटो-फिल करने या डिफ़ॉल्ट रिकॉर्ड्स को इनिशियलाइज़ करने के लिए किया जा सकता है।

<!--
### क्लाइंट-साइड कॉन्फ़िगरेशन और मैनेजमेंट इंटरफ़ेस
क्लाइंट साइड पर आपको फ़ाइल मैनेजर को बताना होगा कि कॉन्फ़िगरेशन फॉर्म कैसे रेंडर करना है और क्या कोई कस्टम अपलोड लॉजिक है। प्रत्येक स्टोरेज टाइप ऑब्जेक्ट में निम्नलिखित प्रॉपर्टीज़ होती हैं:
-->

## फ्रंटएंड फ़ाइल टाइप्स का विस्तार

अपलोड की गई फ़ाइलों के लिए, आप फ्रंटएंड इंटरफ़ेस में फ़ाइल टाइप के आधार पर अलग-अलग प्रीव्यू दिखा सकते हैं। फ़ाइल मैनेजर के अटैचमेंट फ़ील्ड में ब्राउज़र-आधारित प्रीव्यू (iframe में एम्बेडेड) होता है, जो अधिकांश फ़ॉर्मैट्स (जैसे इमेज, वीडियो, ऑडियो और PDF) को सीधे ब्राउज़र में प्रीव्यू करने का समर्थन करता है। जब फ़ाइल फ़ॉर्मैट ब्राउज़र द्वारा समर्थित नहीं होता या विशेष प्रीव्यू इंटरैक्शन चाहिए, तो आप फ़ाइल टाइप-आधारित प्रीव्यू कंपोनेंट को विस्तारित कर सकते हैं।

### उदाहरण

उदाहरण के लिए, यदि आप Office फ़ाइलों के लिए कस्टम ऑनलाइन प्रीव्यू जोड़ना चाहते हैं, तो आप निम्न कोड का उपयोग कर सकते हैं:

```tsx
import React, { useMemo } from 'react';
import { Plugin, matchMimetype } from '@nocobase/client';
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';

class MyPlugin extends Plugin {
  load() {
    filePreviewTypes.add({
      match(file) {
        return matchMimetype(file, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      },
      Previewer({ file }) {
        const url = useMemo(() => {
          const src =
            file.url.startsWith('https://') || file.url.startsWith('http://')
              ? file.url
              : `${location.origin}/${file.url.replace(/^\//, '')}`;
          const u = new URL('https://view.officeapps.live.com/op/embed.aspx');
          u.searchParams.set('src', src);
          return u.href;
        }, [file.url]);
        return <iframe src={url} width="100%" height="600px" style={{ border: 'none' }} />;
      },
    });
  }
}
```

यहाँ `filePreviewTypes` `@nocobase/plugin-file-manager/client` द्वारा दिया गया एंट्री ऑब्जेक्ट है, जिसका उपयोग फ़ाइल प्रीव्यू को बढ़ाने के लिए किया जाता है। `add` मेथड से फ़ाइल टाइप विवरण ऑब्जेक्ट जोड़ें।

हर फ़ाइल टाइप को यह जाँचने के लिए `match()` मेथड लागू करनी होगी कि वह आवश्यकताओं को पूरा करती है या नहीं। उदाहरण में `matchMimetype` का उपयोग फ़ाइल के `mimetype` एट्रिब्यूट को जाँचने के लिए किया गया है। यदि यह `docx` टाइप से मेल खाता है, तो उसे हैंडल किया जाता है। यदि मेल नहीं खाता, तो बिल्ट-इन टाइप हैंडलिंग उपयोग होगी।

टाइप विवरण ऑब्जेक्ट पर `Previewer` प्रॉपर्टी प्रीव्यू के लिए उपयोग किया जाने वाला कंपोनेंट है। जब फ़ाइल टाइप मैच होता है, तो यह कंपोनेंट प्रीव्यू डायलॉग में रेंडर होता है। आप कोई भी React व्यू (जैसे iframe, प्लेयर, या चार्ट) रिटर्न कर सकते हैं।

### API

```ts
export interface FilePreviewerProps {
  file: any;
  index: number;
  list: any[];
}

export interface FilePreviewType {
  match(file: any): boolean;
  getThumbnailURL?: (file: any) => string | null;
  Previewer?: React.ComponentType<FilePreviewerProps>;
}

export class FilePreviewTypes {
  add(type: FilePreviewType): void;
}
```

#### `filePreviewTypes`

`filePreviewTypes` एक global instance है जिसे `@nocobase/plugin-file-manager/client` से import किया जाता है:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

फ़ाइल टाइप रजिस्ट्री में नया फ़ाइल टाइप विवरण ऑब्जेक्ट रजिस्टर करता है। विवरण ऑब्जेक्ट का टाइप `FilePreviewType` है।

#### `FilePreviewType`

##### `match()`

फ़ाइल फ़ॉर्मैट मिलान मेथड।

इनपुट पैरामीटर `file` अपलोड की गई फ़ाइल का डेटा ऑब्जेक्ट होता है, जिसमें टाइप जाँच के लिए प्रासंगिक प्रॉपर्टीज़ होती हैं:

* `mimetype`: mimetype विवरण
* `extname`: फ़ाइल एक्सटेंशन, जिसमें "." शामिल है
* `path`: फ़ाइल का रिलेटिव स्टोरेज पाथ
* `url`: फ़ाइल URL

`boolean` वैल्यू रिटर्न करता है जो मिलान को दर्शाती है।

##### `getThumbnailURL`

फ़ाइल सूची में उपयोग होने वाला थंबनेल URL लौटाता है। यदि रिटर्न वैल्यू खाली है, तो बिल्ट-इन प्लेसहोल्डर इमेज उपयोग होगी।

##### `Previewer`

फ़ाइलों के प्रीव्यू के लिए React कंपोनेंट।

आने वाले Props:

* `file`: वर्तमान फ़ाइल ऑब्जेक्ट (string URL या `url`/`preview` वाला ऑब्जेक्ट हो सकता है)
* `index`: सूची में फ़ाइल का इंडेक्स
* `list`: फ़ाइल सूची

