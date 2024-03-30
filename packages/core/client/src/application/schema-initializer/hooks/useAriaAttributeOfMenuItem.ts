import { useMemo } from 'react';
import { useSchemaInitializerSubMenuContext } from '../components/SchemaInitializerSubMenu';

/**
 * @internal
 */
export const useAriaAttributeOfMenuItem = () => {
  const { isInMenu } = useSchemaInitializerSubMenuContext();
  // 在 Menu 中，每一项的 role 已经被标记为 menuitem 了，不需要再次标记；
  // 而在其他地方，每一项的根元素都是 div，需要标记为 menuitem；
  const attribute = useMemo(() => {
    if (!isInMenu) {
      return {
        role: 'menuitem',
      };
    }
    return {};
  }, [isInMenu]);

  return {
    attribute,
  };
};
