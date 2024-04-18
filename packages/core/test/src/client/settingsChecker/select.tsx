import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export interface SelectSettingOptions {
  title: string;
  beforeSelect?: () => Promise<void> | void;
  oldValue?: string;
  options?: { label: string; checker?: () => void | Promise<void> }[];
}

export async function checkSelectSetting(options: SelectSettingOptions) {
  if (options.beforeSelect) {
    await options.beforeSelect();
  }

  const formItem = screen.getByTitle(options.title);

  if (options.oldValue) {
    expect(formItem).toHaveTextContent(options.oldValue);
  }

  if (options.options) {
    // 打开下拉框
    await userEvent.click(formItem.querySelector('.ant-select-selection-item'));
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeInTheDocument();
    });

    for (const option of options.options) {
      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveTextContent(option.label);

      if (option.checker) {
        const item = [...listbox.querySelectorAll('.ant-select-item-option-content')].find(
          (item) => item.textContent === option.label,
        );
        await userEvent.click(item);

        // 等到下拉框关闭，并且值更新
        await waitFor(() => {
          expect(screen.getByTitle(options.title)).toHaveTextContent(option.label);
        });

        await option.checker();

        // 重新打开下拉框
        await userEvent.click(screen.getByTitle(options.title).querySelector('.ant-select-selection-item'));
        await waitFor(() => {
          expect(screen.queryByRole('listbox')).toBeInTheDocument();
        });
      }
    }
  }
}
