:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 권한 설정 탭 확장하기

아래에서는 '모바일 메뉴' 설정 항목을 예시로 들어, 새로운 권한 설정 탭을 확장하는 방법을 보여드립니다. 결과는 다음 이미지와 같습니다:

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

코드는 다음과 같습니다:

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

먼저, `PluginACLClient` 플러그인의 인스턴스를 가져와야 합니다 ([플러그인 인스턴스를 얻는 다른 방법](/plugin-development/client/plugin#get-plugin-instance)). `settingsUI.addPermissionsTab` 메서드를 사용하여 새로운 권한 설정 탭을 추가합니다. 이 예시에서는 '모바일 메뉴'라는 이름의 권한 설정 탭을 추가했습니다.

`settingsUI` 속성의 값은 `ACLSettingsUI`라는 이름의 클래스 인스턴스이며, 해당 타입 정보는 다음과 같습니다:

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
   * 현재 활성화된 탭 패널의 키
   */
  activeKey: string;
  /**
   * 현재 선택된 역할
   */
  role: Role;
  /**
   * 번역 함수
   */
  t: TFunction;
  /**
   * 탭 내 컨테이너의 크기를 제한하는 데 사용됩니다.
   */
  TabLayout: React.FC;
}
```