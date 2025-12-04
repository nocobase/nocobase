:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# create-nocobase-app इंस्टॉलेशन को अपग्रेड करना

:::warning अपग्रेड से पहले की तैयारी

- कृपया सबसे पहले डेटाबेस का बैकअप लेना सुनिश्चित करें।
- चल रहे NocoBase को बंद करें।

:::

## 1. चल रहे NocoBase को बंद करें

यदि यह बैकग्राउंड में चलने वाली प्रक्रिया नहीं है, तो इसे `Ctrl + C` दबाकर रोकें। प्रोडक्शन एनवायरनमेंट में, इसे बंद करने के लिए `pm2-stop` कमांड चलाएँ।

```bash
yarn nocobase pm2-stop
```

## 2. अपग्रेड कमांड चलाएँ

बस `yarn nocobase upgrade` अपग्रेड कमांड चलाएँ।

```bash
# संबंधित डायरेक्टरी में जाएँ
cd my-nocobase-app
# अपडेट कमांड चलाएँ
yarn nocobase upgrade
# स्टार्ट करें
yarn dev
```

### किसी खास वर्ज़न में अपग्रेड करना

प्रोजेक्ट की रूट डायरेक्टरी में मौजूद `package.json` फ़ाइल को संशोधित करें, और `@nocobase/cli` तथा `@nocobase/devtools` के वर्ज़न नंबर बदलें (आप केवल अपग्रेड कर सकते हैं, डाउनग्रेड नहीं)। उदाहरण के लिए:

```diff
{
  "dependencies": {
-   "@nocobase/cli": "1.5.11"
+   "@nocobase/cli": "1.6.0-beta.8"
  },
  "devDependencies": {
-   "@nocobase/devtools": "1.5.11"
+   "@nocobase/devtools": "1.6.0-beta.8"
  }
}
```

फिर अपग्रेड कमांड चलाएँ

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```