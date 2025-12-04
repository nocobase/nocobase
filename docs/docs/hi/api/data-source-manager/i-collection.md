:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# ICollection

`ICollection` डेटा मॉडल के लिए एक इंटरफ़ेस है, जिसमें मॉडल का नाम, फ़ील्ड और एसोसिएशन जैसी जानकारी शामिल होती है।

```typescript
export interface ICollection {
  repository: IRepository;

  updateOptions(options: any): void;

  setField(name: string, options: any): IField;

  removeField(name: string): void;

  getFields(): Array<IField>;

  getField(name: string): IField;

  [key: string]: any;
}
```

## सदस्य

### repository

`Repository` का वह इंस्टेंस जिससे `ICollection` संबंधित है।

## API

### updateOptions()

`संग्रह` की प्रॉपर्टीज़ को अपडेट करता है।

#### सिग्नेचर

- `updateOptions(options: any): void`

### setField()

`संग्रह` के लिए एक फ़ील्ड सेट करता है।

#### सिग्नेचर

- `setField(name: string, options: any): IField`

### removeField()

`संग्रह` से एक फ़ील्ड हटाता है।

#### सिग्नेचर

- `removeField(name: string): void`

### getFields()

`संग्रह` के सभी फ़ील्ड प्राप्त करता है।

#### सिग्नेचर

- `getFields(): Array<IField>`

### getField()

`संग्रह` का एक फ़ील्ड उसके नाम से प्राप्त करता है।

#### सिग्नेचर

- `getField(name: string): IField`