:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# RelationRepository

`RelationRepository` संबंध (association) प्रकारों के लिए एक `Repository` ऑब्जेक्ट है। `RelationRepository` आपको संबंध को लोड किए बिना संबंधित डेटा पर काम करने की सुविधा देता है। `RelationRepository` पर आधारित, प्रत्येक संबंध प्रकार की अपनी व्युत्पन्न (derived) इम्प्लीमेंटेशन है:

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## कंस्ट्रक्टर

**सिग्नेचर**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**पैरामीटर्स**

| पैरामीटर का नाम    | टाइप               | डिफ़ॉल्ट मान | विवरण                                                                 |
| :----------------- | :----------------- | :---------- | :-------------------------------------------------------------------- |
| `sourceCollection` | `Collection`       | -           | संबंध में रेफरेंसिंग संबंध (referencing relation) से संबंधित संग्रह। |
| `association`      | `string`           | -           | संबंध का नाम।                                                        |
| `sourceKeyValue`   | `string \| number` | -           | रेफरेंसिंग संबंध में संबंधित कुंजी (key) मान।                         |

## बेस क्लास प्रॉपर्टीज़

### `db: Database`

डेटाबेस ऑब्जेक्ट

### `sourceCollection`

संबंध में रेफरेंसिंग संबंध (referencing relation) से संबंधित संग्रह।

### `targetCollection`

संबंध में रेफरेंस्ड संबंध (referenced relation) से संबंधित संग्रह।

### `association`

सीक्वेलाइज़ (sequelize) में वर्तमान संबंध से संबंधित संबंध ऑब्जेक्ट।

### `associationField`

संग्रह में वर्तमान संबंध से संबंधित फ़ील्ड।

### `sourceKeyValue`

रेफरेंसिंग संबंध में संबंधित कुंजी (key) मान।