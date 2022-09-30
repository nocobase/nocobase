
import {useEffect} from 'react';
import omit from 'lodash/omit';
import { useForm } from '@formily/react';
import {useActionContext,useRequest,useCollectionManager,useResourceActionContext,useResourceContext} from '@nocobase/client'

export const useValuesFromRecord = (options,data) => {
    console.log(111111111111)
    // const record = useRecord();
    const result = useRequest(() => Promise.resolve({ data }), {
      ...options,
      manual: true,
    });
    const ctx = useActionContext();
    console.log(ctx)
    useEffect(() => {
      if (ctx.visible) {
        result.run();
      }
    }, [ctx.visible]);
    console.log(result)
    return result;
  };


  export const useCancelAction = () => {
    const form = useForm();
    const ctx = useActionContext();
    return {
      async run() {
        ctx.setVisible(false);
        form.reset();
      },
    };
  };
  
  export const useUpdateCollectionActionAndRefreshCM = (options) => {
    const { refreshCM } = useCollectionManager();
    const form = useForm();
    const ctx = useActionContext();
    // const { resource, targetKey } = useResourceContext();
    // const { [targetKey]: filterByTk } = useRecord();
    return {
      async run() {
        await form.submit();
        // await resource.update({ filterByTk:'', values: omit(form.values, ['fields']) });
        ctx.setVisible(false);
        await form.reset();
        await refreshCM();
      },
    };
  }
  