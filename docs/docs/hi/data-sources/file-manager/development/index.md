:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# एक्सटेंशन डेवलपमेंट

## फ़्रंटएंड फ़ाइल प्रकारों का विस्तार करना

अपलोड की गई फ़ाइलों के लिए, क्लाइंट UI विभिन्न फ़ाइल प्रकारों के आधार पर अलग-अलग प्रीव्यू दिखा सकता है। फ़ाइल मैनेजर का अटैचमेंट फ़ील्ड एक बिल्ट-इन ब्राउज़र-आधारित (iframe में एम्बेडेड) फ़ाइल प्रीव्यू का उपयोग करता है, जो अधिकांश फ़ाइल प्रकारों (जैसे इमेज, वीडियो, ऑडियो और PDF) को सीधे ब्राउज़र में प्रीव्यू करने में सहायता करता है। जब कोई फ़ाइल प्रकार ब्राउज़र प्रीव्यू के लिए समर्थित नहीं होता है या किसी विशेष इंटरैक्शन की आवश्यकता होती है, तो आप फ़ाइल प्रकार के आधार पर अतिरिक्त प्रीव्यू कंपोनेंट्स का विस्तार कर सकते हैं।

### उदाहरण

उदाहरण के लिए, यदि आप इमेज फ़ाइलों के लिए एक कैरोसेल कंपोनेंट का विस्तार करना चाहते हैं, तो आप निम्नलिखित कोड का उपयोग कर सकते हैं:

```ts
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

`attachmentFileTypes` `@nocobase/client` पैकेज द्वारा प्रदान किया गया एक एंट्री ऑब्जेक्ट है जिसका उपयोग फ़ाइल प्रकारों का विस्तार करने के लिए किया जाता है। आप इसके `add` मेथड का उपयोग करके एक फ़ाइल प्रकार डिस्क्रिप्टर का विस्तार कर सकते हैं।

प्रत्येक फ़ाइल प्रकार को यह जांचने के लिए एक `match()` मेथड लागू करना होगा कि क्या फ़ाइल प्रकार आवश्यकताओं को पूरा करता है। उदाहरण में, फ़ाइल के `mimetype` एट्रीब्यूट की जांच करने के लिए `mime-match` पैकेज का उपयोग किया जाता है। यदि यह `image/*` से मेल खाता है, तो इसे संसाधित किए जाने वाले फ़ाइल प्रकार के रूप में माना जाता है। यदि यह मेल नहीं खाता है, तो यह बिल्ट-इन प्रकार पर वापस आ जाएगा।

टाइप डिस्क्रिप्टर पर `Previewer` प्रॉपर्टी प्रीव्यू के लिए उपयोग किया जाने वाला कंपोनेंट है। जब फ़ाइल प्रकार मेल खाता है, तो इस कंपोनेंट को प्रीव्यू के लिए रेंडर किया जाएगा। आमतौर पर, एक मोडल कंपोनेंट (जैसे `<Modal />`) को आधार कंटेनर के रूप में उपयोग करने की सलाह दी जाती है, और फिर प्रीव्यू तथा इंटरैक्टिव कंटेंट को उस कंपोनेंट के भीतर रखकर प्रीव्यू कार्यक्षमता को लागू किया जाता है।

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

`attachmentFileTypes` एक ग्लोबल इंस्टेंस है जिसे `@nocobase/client` पैकेज से इम्पोर्ट किया जाता है:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

फ़ाइल प्रकार रजिस्ट्री में एक नया फ़ाइल प्रकार डिस्क्रिप्टर रजिस्टर करता है। डिस्क्रिप्टर का प्रकार `AttachmentFileType` है।

#### `AttachmentFileType`

##### `match()`

फ़ाइल फ़ॉर्मेट्स को मैच करने का एक मेथड।

पास किया गया `file` पैरामीटर अपलोड की गई फ़ाइल का एक डेटा ऑब्जेक्ट है, जिसमें टाइप चेकिंग के लिए उपयोग की जा सकने वाली संबंधित प्रॉपर्टीज़ शामिल हैं:

*   `mimetype`: फ़ाइल का mimetype।
*   `extname`: फ़ाइल एक्सटेंशन, जिसमें `.` भी शामिल है।
*   `path`: फ़ाइल का रिलेटिव स्टोरेज पाथ।
*   `url`: फ़ाइल का URL।

यह एक `boolean` मान देता है जो बताता है कि फ़ाइल मेल खाती है या नहीं।

##### `Previewer`

फ़ाइल का प्रीव्यू करने के लिए एक React कंपोनेंट।

प्रॉप्स:

*   `index`: अटैचमेंट लिस्ट में फ़ाइल का इंडेक्स।
*   `list`: अटैचमेंट की लिस्ट।
*   `onSwitchIndex`: इसके इंडेक्स द्वारा प्रीव्यू की गई फ़ाइल को स्विच करने का एक फ़ंक्शन।

`onSwitchIndex` फ़ंक्शन को `list` में से किसी भी इंडेक्स के साथ कॉल किया जा सकता है ताकि किसी अन्य फ़ाइल पर स्विच किया जा सके। इसे `null` के साथ कॉल करने पर प्रीव्यू कंपोनेंट सीधे बंद हो जाता है।

```ts
onSwitchIndex(null);
```