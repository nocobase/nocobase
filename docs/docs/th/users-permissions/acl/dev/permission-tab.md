:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# การขยายแท็บการตั้งค่าสิทธิ์

ด้านล่างนี้ เราจะใช้รายการตั้งค่า "เมนูสำหรับมือถือ" เป็นตัวอย่าง เพื่อแสดงวิธีขยายแท็บการตั้งค่าสิทธิ์ใหม่ครับ/ค่ะ ผลลัพธ์ที่ได้จะแสดงในรูปภาพด้านล่างนี้ครับ/ค่ะ

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

โค้ดมีดังนี้ครับ/ค่ะ

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

อันดับแรก เราต้องได้รับ instance ของปลั๊กอิน `PluginACLClient` ก่อนครับ/ค่ะ (ดู [วิธีอื่น ๆ ในการรับ instance ของปลั๊กอิน](/plugin-development/client/plugin#get-plugin-instance) เพิ่มเติม) จากนั้น เราจะใช้เมธอด `settingsUI.addPermissionsTab` เพื่อเพิ่มแท็บการตั้งค่าสิทธิ์ใหม่ครับ/ค่ะ ในตัวอย่างนี้ เราได้เพิ่มแท็บการตั้งค่าสิทธิ์ที่ชื่อว่า "เมนูสำหรับมือถือ" ครับ/ค่ะ

ค่าของ property `settingsUI` คือ instance ของคลาสที่ชื่อว่า `ACLSettingsUI` ครับ/ค่ะ และข้อมูลประเภท (type information) ของคลาสนี้มีดังนี้ครับ/ค่ะ

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
   * the key of the currently active tab panel
   */
  activeKey: string;
  /**
   * the currently selected role
   */
  role: Role;
  /**
   * translation function
   */
  t: TFunction;
  /**
   * used to constrain the size of the container in the Tab
   */
  TabLayout: React.FC;
}
```