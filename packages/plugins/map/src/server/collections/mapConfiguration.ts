import { CollectionOptions } from "@nocobase/client";

export default {
  name: 'mapConfiguration',
  title: '{{t("Map Configuration")}}',
  fields: [
    {
      title: 'Access key',
      comment: '访问密钥',
      name: 'accessKey',
      type: 'string'
    },
    {
      title: 'securityCode',
      comment: 'securityCode',
      name: 'securityCode',
      type: 'string'
    },
    {
      title: 'Map type',
      comment: '地图类型',
      name: 'type',
      type: 'string',
    }
  ]
} as CollectionOptions
