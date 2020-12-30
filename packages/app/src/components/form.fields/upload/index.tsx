import React, { useState } from 'react'
import { connect } from '@formily/react-schema-renderer'
import { Button, Upload as AntdUpload, Popconfirm } from 'antd'
import { toArr, isArr, isEqual, mapStyledProps } from '../shared'
import {
  LoadingOutlined,
  PlusOutlined,
  UploadOutlined,
  InboxOutlined
} from '@ant-design/icons'
const { Dragger: UploadDragger } = AntdUpload

const exts = [
  {
    ext: /\.docx?$/i,
    icon: '//img.alicdn.com/tfs/TB1n8jfr1uSBuNjy1XcXXcYjFXa-200-200.png'
  },
  {
    ext: /\.pptx?$/i,
    icon: '//img.alicdn.com/tfs/TB1ItgWr_tYBeNjy1XdXXXXyVXa-200-200.png'
  },
  {
    ext: /\.jpe?g$/i,
    icon: '//img.alicdn.com/tfs/TB1wrT5r9BYBeNjy0FeXXbnmFXa-200-200.png'
  },
  {
    ext: /\.pdf$/i,
    icon: '//img.alicdn.com/tfs/TB1GwD8r9BYBeNjy0FeXXbnmFXa-200-200.png'
  },
  {
    ext: /\.png$/i,
    icon: '//img.alicdn.com/tfs/TB1BHT5r9BYBeNjy0FeXXbnmFXa-200-200.png'
  },
  {
    ext: /\.eps$/i,
    icon: '//img.alicdn.com/tfs/TB1G_iGrVOWBuNjy0FiXXXFxVXa-200-200.png'
  },
  {
    ext: /\.ai$/i,
    icon: '//img.alicdn.com/tfs/TB1B2cVr_tYBeNjy1XdXXXXyVXa-200-200.png'
  },
  {
    ext: /\.gif$/i,
    icon: '//img.alicdn.com/tfs/TB1DTiGrVOWBuNjy0FiXXXFxVXa-200-200.png'
  },
  {
    ext: /\.svg$/i,
    icon: '//img.alicdn.com/tfs/TB1uUm9rY9YBuNjy0FgXXcxcXXa-200-200.png'
  },
  {
    ext: /\.xlsx?$/i,
    icon: '//img.alicdn.com/tfs/TB1any1r1OSBuNjy0FdXXbDnVXa-200-200.png'
  },
  {
    ext: /\.psd?$/i,
    icon: '//img.alicdn.com/tfs/TB1_nu1r1OSBuNjy0FdXXbDnVXa-200-200.png'
  },
  {
    ext: /\.(wav|aif|aiff|au|mp1|mp2|mp3|ra|rm|ram|mid|rmi)$/i,
    icon: '//img.alicdn.com/tfs/TB1jPvwr49YBuNjy0FfXXXIsVXa-200-200.png'
  },
  {
    ext: /\.(avi|wmv|mpg|mpeg|vob|dat|3gp|mp4|mkv|rm|rmvb|mov|flv)$/i,
    icon: '//img.alicdn.com/tfs/TB1FrT5r9BYBeNjy0FeXXbnmFXa-200-200.png'
  },
  {
    ext: /\.(zip|rar|arj|z|gz|iso|jar|ace|tar|uue|dmg|pkg|lzh|cab)$/i,
    icon: '//img.alicdn.com/tfs/TB10jmfr29TBuNjy0FcXXbeiFXa-200-200.png'
  },
  {
    ext: /\.[^.]+$/i,
    icon: '//img.alicdn.com/tfs/TB10.R4r3mTBuNjy1XbXXaMrVXa-200-200.png'
  }
]

const testOpts = (ext, options) => {
  if (options && isArr(options.include)) {
    return options.include.some(url => ext.test(url))
  }

  if (options && isArr(options.exclude)) {
    return !options.exclude.some(url => ext.test(url))
  }

  return true
}

export const testUrl = (url, options) => {
  for (let i = 0; i < exts.length; i++) {
    if (exts[i].ext.test(url) && testOpts(exts[i].ext, options)) {
      return false;
    }
  }

  return true;
}

export const getImageByUrl = (url, options) => {
  for (let i = 0; i < exts.length; i++) {
    if (exts[i].ext.test(url) && testOpts(exts[i].ext, options)) {
      return exts[i].icon || url
    }
  }

  return url
}

function toFileObject(item) {
  console.log(item);
  if (typeof item !== 'object') {
    return {
      id: item,
    }
  }
  if (item.id && item.uid && item.url) {
    return item;
  }
  if (item.response && item.response.data) {
    return toFileObject(item.response.data);
  }
  return {
    id: item.id,
    uid: `${item.id}`,
    name: item.title,
    url: item.url,
    status: 'done',
  };
}

function toFileList(value: any) {
  if (!value) {
    return [];
  }
  if (!Array.isArray(value) && typeof value === 'object') {
    value = [value];
  }
  return value.map(toFileObject);
}

export const Upload = connect({
  getProps: mapStyledProps
})((props) => {
  const { value, onChange } = props;
  const [fileList, setFileList] = useState(toFileList(value));
  const uploadProps = {
    name: 'file',
    action: `${process.env.API}/attachments:upload`,
    onChange({ file, fileList }) {
      if (['done', 'removed'].indexOf(file.status) !== -1) {
        const values = toFileList(fileList);
        console.log(values);
        setFileList(values);
        onChange(values.map(item => item.id));
      }
    },
  };
  return (
    <div>
      <AntdUpload
        {...uploadProps}
        fileList={fileList}
        multiple={true}
      >
        <Button><UploadOutlined /> 上传文件</Button>
      </AntdUpload>
    </div>
  )
});

export default Upload;