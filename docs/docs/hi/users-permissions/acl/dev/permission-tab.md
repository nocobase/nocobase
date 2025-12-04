:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# अनुमति कॉन्फ़िगरेशन टैब का विस्तार करना

नीचे हम "मोबाइल मेनू" कॉन्फ़िगरेशन आइटम का उदाहरण लेकर यह समझेंगे कि एक नया अनुमति कॉन्फ़िगरेशन टैब कैसे बढ़ाया जाता है। इसका प्रभाव नीचे दिए गए चित्र में दिखाया गया है:

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

कोड इस प्रकार है:

```typescript
import { Plugin } from '@nocobase/client';
import PluginACLClient from '@nocobase/plugin-acl/client';

class PluginMobileClient extends Plugin {
  async load() {
    const aclInstance = this.app.pm.get(PluginACLClient);

    aclInstance?.settingsUI.addPermissionsTab(({ t, TabLayout, activeKey }) => ({
      key: 'mobile-menu',
      label: t('Mobile menu', {
        ns: 'plugin-mobile',
      }),
      children: (
        <TabLayout>
          <MenuPermissions />
        </TabLayout>
      ),
    }));
  }
}
```

सबसे पहले, हमें `PluginACLClient` प्लगइन का एक इंस्टेंस प्राप्त करना होगा ([प्लगइन इंस्टेंस प्राप्त करने के अन्य तरीके](/plugin-development/client/plugin#get-plugin-instance))। फिर, `settingsUI.addPermissionsTab` विधि का उपयोग करके, हम एक नया अनुमति कॉन्फ़िगरेशन टैब जोड़ते हैं। इस उदाहरण में, हमने "मोबाइल मेनू" नामक एक अनुमति कॉन्फ़िगरेशन टैब जोड़ा है।

`settingsUI` प्रॉपर्टी का मान `ACLSettingsUI` नामक एक क्लास का इंस्टेंस है, और इसकी टाइप जानकारी इस प्रकार है:

```typescript
import { TabsProps } from 'antd/es/tabs/index';

interface ACLSettingsUI {
  addPermissionsTab(tab: Tab | TabCallback): void;
  getPermissionsTabs(props: PermissionsTabsProps): Tab[];
}

type Tab = TabsProps['items'][0];

type TabCallback = (props: PermissionsTabsProps) => Tab;

interface PermissionsTabsProps {
  /**
   * वर्तमान में सक्रिय टैब पैनल की कुंजी
   */
  activeKey: string;
  /**
   * वर्तमान में चयनित भूमिका
   */
  role: Role;
  /**
   * अनुवाद फ़ंक्शन
   */
  t: TFunction;
  /**
   * टैब में कंटेनर के आकार को सीमित करने के लिए उपयोग किया जाता है
   */
  TabLayout: React.FC;
}
```