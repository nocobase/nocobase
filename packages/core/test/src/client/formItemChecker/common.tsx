export interface CommonFormItemCheckerOptions {
  label: string;
  container?: HTMLElement;
  newValue?: string;
  oldValue?: string;
}

export interface GetFormItemElementOptions {
  container?: HTMLElement;
  Component: string;
  label: string;
}

export function getFormItemElement({ container = document.body, Component, label }: GetFormItemElementOptions) {
  const formItem = container.querySelector(`div[aria-label="block-item-${Component}-${label}"]`);
  expect(formItem).toBeInTheDocument();

  return formItem;
}
