import { useDetailsBlockContext, useFormBlockContext } from '@nocobase/client';
import { useReactToPrint } from 'react-to-print';

export const useDetailPrintActionProps = () => {
  const context = useFormBlockContext();
  const { formBlockRef } = useDetailsBlockContext();
  const printHandler = useReactToPrint({
    content: () => context?.formBlockRef?.current || formBlockRef?.current,
    pageStyle: `@media print {
        * {
          margin: 0;
        }
        :not(.ant-formily-item-control-content-component) > div.ant-formily-layout>div:first-child {
          overflow: hidden; height: 0;
        }
      }`,
  });
  return {
    async onClick() {
      printHandler();
    },
  };
};
