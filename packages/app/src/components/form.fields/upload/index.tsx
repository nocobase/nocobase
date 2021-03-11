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
import get from 'lodash/get';
import findIndex from 'lodash/findIndex';
import Lightbox from 'react-image-lightbox';

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
  if (typeof item === 'number') {
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
  // if (item.org)
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

function toValue(item) {
  if (typeof item === 'number') {
    return {
      id: item,
    }
  }
  if (item.id && item.uid && item.url) {
    return item;
  }
  if (item.response && item.response.data) {
    return toValue(item.response.data);
  }
  if (item.originFileObj) {
    return item;
  }
  return {
    id: item.id,
    uid: `${item.id}`,
    name: item.title,
    url: item.url,
  };
}

function toValues(fileList) {
  if (!fileList) {
    return [];
  }
  if (!Array.isArray(fileList) && typeof fileList === 'object') {
    fileList = [fileList];
  }
  return fileList.map(toValue).filter(item => item.id);
}

export function getImgUrls(value) {
  const values = Array.isArray(value) ? value : [value];
  return values.filter(item => testUrl(item.url, {
    exclude: ['.png', '.jpg', '.jpeg', '.gif']
  })).map(item => toValue(item));
}

export const Upload = connect({
  getProps: mapStyledProps
})((props) => {
  const { multiple = true, value, onChange } = props;
  const [visible, setVisible] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [fileList, setFileList] = useState(toFileList(value));
  const uploadProps = {
    name: 'file',
    action: `${process.env.API}/attachments:upload`,
    onChange({ fileList }) {
      console.log(fileList);
      setFileList((fileList));
      const list = toValues(fileList);
      onChange(multiple ? list : (list.shift()||null));
    },
  };
  const images = getImgUrls(fileList);
  // console.log(images);
  return (
    <div>
      <AntdUpload
        listType={'picture-card'}
        {...uploadProps}
        fileList={fileList}
        multiple={true}
        onPreview={(file) => {
          const value = toValue(file)||{};
          const index = findIndex(images, image => image.id === value.id);
          if (index >= 0) {
            setImgIndex(index);
            setVisible(true);
          } else {
            window.open(value.url)
            // window.location.href = value.url;
          }
        }}
        // itemRender={(originNode, file, fileList) => {
        //   console.log(file);
        //   const value = toValue(file);
        //   return (
        //     <div>
        //       <img style={{marginRight: 5}} height={20} src={`${value.url}?x-oss-process=style/thumbnail`}/>
        //     </div>
        //   );
        // }}
        // onRemove={(file) => {
          
        // }}
      >
        {multiple || fileList.length < 1 && (
          <>
            <PlusOutlined />
            <div style={{marginTop: 5}}>上传</div>
          </>
        )}
      </AntdUpload>
      {visible && <Lightbox
        mainSrc={get(images, [imgIndex, 'url'])}
        nextSrc={get(images, [imgIndex + 1, 'url'])}
        prevSrc={get(images, [imgIndex - 1, 'url'])}
        onCloseRequest={() => setVisible(false)}
        onMovePrevRequest={() => {
          setImgIndex((imgIndex + images.length - 1) % images.length);
        }}
        onMoveNextRequest={() => {
          setImgIndex((imgIndex + 1) % images.length);
        }}
      />}
    </div>
  )
});

export default Upload;