import {
  ActionProps,
  useCollection,
  useCollectionRecordData,
  useDataBlockRequest,
  useDataBlockResource,
} from '@nocobase/client';
import { App as AntdApp } from 'antd';

export function useDeleteActionProps(): ActionProps {
  const { message } = AntdApp.useApp();
  const record = useCollectionRecordData();
  const resource = useDataBlockResource();
  const { runAsync } = useDataBlockRequest();
  const collection = useCollection();
  return {
    confirm: {
      title: 'Delete',
      content: 'Are you sure you want to delete it?',
    },
    async onClick() {
      if (!collection) {
        throw new Error('collection does not exist');
      }
      await resource.destroy({
        filterByTk: record[collection.filterTargetKey],
      });
      await runAsync();
      message.success('Deleted!');
    },
  };
}
