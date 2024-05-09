# Action

Combines buttons and various operations together, providing a unified way to handle actions.

## Action

The trigger for the action, by default using the `Button` component from ant-design, and provides context for subsequent pop-ups or drawers.

```ts
export interface ActionProps extends ButtonProps {
  /**
   * button title
   */
  title?: string;

  /**
   * custom component, replace the default Button component
   */
  component?: string | ComponentType<any>;

  /**
   * Dynamic rendering of the opened content in conjunction with `Action.Container`.
   */
  openMode?: 'drawer' | 'modal' | 'page';
  /**
   * The size of the pop-up window, only valid when `openMode: 'modal'`
   */
  openSize?: 'small' | 'middle' | 'large';
  /**
   * Customize the position of the pop-up window
   */
  containerRefKey?: string;

  /**
   * Whether to display the popover, only valid when `openMode: 'popover'`
   */
  popover?: boolean;

  /**
   * When the button is clicked, whether a pop-up confirmation is required
   */
  confirm?: false | {
    title: string;
    content: string;
  };
}
```

### Basic Usage

- `ButtonProp`
- title

<code src="./demos/new-demos/basic.tsx"></code>

### Custom Component

- component

<code src="./demos/new-demos/custom-component.tsx"></code>

### Dynamic Props

Here, the ability of `x-use-component-props` is used. For more information, please refer to [x-use-component-props](https://docs.nocobase.com/development/client/ui-schema/what-is-ui-schema#x-component-props-and-x-use-component-props).

<code src="./demos/new-demos/dynamic-props.tsx"></code>

### Confirm

- confirm

<code src="./demos/new-demos/confirm.tsx"></code>

## Action.Link

Replace the `Button` component with an `a` tag.

<code src="./demos/new-demos/action-link.tsx"></code>

## Action.Drawer

Used to pop up a drawer on the right side.

```ts
interface ActionDrawer extends DrawerProps {}
```

### Basic Usage

- `DrawerProps`

<code src="./demos/new-demos/drawer-basic.tsx"></code>

### openSize

<code src="./demos/new-demos/drawer-openSize.tsx"></code>

### Footer

The Footer can contain buttons such as Cancel or Submit.

Its Schema `x-component` must be set to the `Action.Drawer.Footer` component.

<code src="./demos/new-demos/drawer-footer.tsx"></code>

### With Form

<code src="./demos/new-demos/drawer-with-form.tsx"></code>

## Action.Modal

```ts
interface ActionModal extends ModalProps {}
```

Its usage is similar to `Action.Drawer`, here is just one example.

<code src="./demos/new-demos/action-modal.tsx"></code>

## Action.Popover

Note that the `popover` property of Action must be set to `true`.

<code src="./demos/new-demos/action-popover.tsx"></code>

## Action.Container

When rendering content dynamically as needed, you can use `Action.Container` + Action `openMode` property to make dynamic decisions.

<code src="./demos/new-demos/action-container.tsx"></code>

## ActionBar

Generally used for the top operation buttons of a section, it automatically handles layout and rendering of [schema-initializer](/core/ui-schema/schema-initializer).

```ts
import { SpaceProps } from 'antd'

interface ActionBarProps {
  layout?: 'one-column' | 'two-columns';
  style?: CSSProperties;
  className?: string;
  spaceProps?: SpaceProps;
}
```

### one-column

One-column layout, aligned to the left.

The `x-action` in the Schema is the unique identifier for the button, which should not be duplicated with existing ones. It is used for searching and deleting in `ActionInitializer`.

<code src="./demos/new-demos/actionbar-one-column.tsx"></code>

### two-columns

Two-column layout, controlled by `x-align`.

<code src="./demos/new-demos/actionbar-two-columns.tsx"></code>

## ActionContext

Encapsulated inside the `Action` component, used for passing context.

```ts
export type OpenSize = 'small' | 'middle' | 'large';
export interface ActionContextProps {
  button?: React.JSX.Element;
  visible?: boolean;
  setVisible?: (v: boolean) => void;
  openMode?: 'drawer' | 'modal' | 'page';
  snapshot?: boolean;
  openSize?: OpenSize;
  /**
   * Customize the position of the pop-up window
   */
  containerRefKey?: string;
  formValueChanged?: boolean;
  setFormValueChanged?: (v: boolean) => void;
  fieldSchema?: Schema;
  drawerProps?: DrawerProps;
  modalProps?: ModalProps;
  submitted?: boolean;
  setSubmitted?: (v: boolean) => void;
}
```

Assuming that the Action component cannot meet the requirements, we can directly use the ActionContext component for customization.

<code src="./demos/new-demos/action-context.tsx"></code>

## ActionSchemaToolbar

Used to render a single button with [SchemaToolbar](/core/ui-schema/schema-toolbar) and [SchemaSettings](/core/ui-schema/schema-settings).

<code src="./demos/new-demos/schema-toolbar.tsx"></code>

## Hooks

### useActionContext()

Get the `ActionContext` context.

```ts
const { visible, setVisible, fieldSchema } = useActionContext();
```
