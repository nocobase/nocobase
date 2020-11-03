import React from 'react'
import { connect } from '@formily/react-schema-renderer'
import { Button, Upload as AntdUpload } from 'antd'
import styled from 'styled-components'
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

const UploadPlaceholder = styled(props => (
  <div>
    {props.loading ? <LoadingOutlined /> : <PlusOutlined />}
    <div className={'ant-upload-text'}>上传</div>
  </div>
))``

const testOpts = (ext, options) => {
  if (options && isArr(options.include)) {
    return options.include.some(url => ext.test(url))
  }

  if (options && isArr(options.exclude)) {
    return !options.exclude.some(url => ext.test(url))
  }

  return true
}

const getImageByUrl = (url, options) => {
  for (let i = 0; i < exts.length; i++) {
    if (exts[i].ext.test(url) && testOpts(exts[i].ext, options)) {
      return exts[i].icon || url
    }
  }

  return url
}

const normalizeFileList = fileList => {
  if (fileList && fileList.length) {
    return fileList.map(file => {
      return {
        uid: file.uid,
        status: file.status,
        name: file.name,
        url: file.downloadURL || file.imgURL || file.url,
        ...file.response,
        thumbUrl: file.imgURL || getImageByUrl(file.downloadURL || file.url, {
          exclude: ['.png', '.jpg', '.jpeg', '.gif']
        })
      }
    })
  }
  return []
}

const shallowClone = val => {
  let result = isArr(val)
    ? [...val]
    : typeof val === 'object'
    ? { ...val }
    : val
  if (isArr(result)) {
    result = result.map(item => ({
      ...item,
      // 必须要有一个不重复的uid
      uid:
        item.uid ||
        Math.random()
          .toFixed(16)
          .slice(2, 10)
    }))
  }
  return result
}

export interface IUploaderState {
  value: any[]
}

// TODO 能不能直接引用 antd 里面的接口定义呢 ?
export declare type UploadListType = 'text' | 'picture' | 'picture-card'

export interface IUploaderProps {
  onChange: (value: any[]) => void
  locale: { [name: string]: any }
  value: any[]
  listType?: UploadListType
}

export const Upload = connect({
  getProps: mapStyledProps
})(
  class Uploader extends React.Component<IUploaderProps, IUploaderState> {
    public static defaultProps = {
      action:
        'https://www.easy-mock.com/mock/5b713974309d0d7d107a74a3/alifd/upload',
      listType: 'text',
      multiple: true,
      className: 'antd-uploader'
    }

    readonly state: IUploaderState

    constructor(props) {
      super(props)
      this.state = {
        value: shallowClone(toArr(props.value))
      }
    }

    public onRemoveHandler = file => {
      const { value } = this.state
      const fileList = []
      value.forEach(item => {
        if (item.uid !== file.uid) {
          fileList.push(item)
        }
      })
      this.props.onChange(fileList)
    }

    public onChangeHandler = ({ fileList }) => {
      const { onChange } = this.props
      fileList = toArr(fileList)
      if (
        fileList.every(file => {
          if (
            file.status === 'done' ||
            file.imgURL ||
            file.downloadURL ||
            file.url ||
            file.thumbUrl
          )
            return true
          if (file.response) {
            if (
              file.response.imgURL ||
              file.response.downloadURL ||
              file.response.url ||
              file.response.thumbUrl
            )
              return true
          }
          return false
        }) &&
        fileList.length
      ) {
        fileList = normalizeFileList(fileList)
        this.setState(
          {
            value: fileList
          },
          () => {
            onChange(fileList.length > 0 ? fileList : undefined)
          }
        )
      } else {
        this.setState({
          value: fileList
        })
      }
    }

    public componentDidUpdate(preProps) {
      if (this.props.value && !isEqual(this.props.value, preProps.value)) {
        this.setState({
          value: shallowClone(this.props.value)
        })
      }
    }

    public render() {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { listType, locale, onChange, value, ...others } = this.props

      if (listType.indexOf('card') > -1) {
        return (
          <AntdUpload
            {...others}
            fileList={this.state.value}
            onChange={this.onChangeHandler}
            onRemove={this.onRemoveHandler}
            listType={'picture-card'}
          >
            <UploadPlaceholder />
          </AntdUpload>
        )
      }
      if (listType.indexOf('dragger') > -1) {
        return (
          <UploadDragger
            {...others}
            fileList={this.state.value}
            onChange={this.onChangeHandler}
            onRemove={this.onRemoveHandler}
            // TODO image 类型是跟 picture 一样 ?
            listType={listType.indexOf('image') > -1 ? 'picture' : 'text'}
          >
            <p className={'ant-upload-drag-icon'}>
              <InboxOutlined />
            </p>
            <p className={'ant-upload-text'}>拖拽上传</p>
          </UploadDragger>
        )
      }
      return (
        <AntdUpload
          {...others}
          fileList={this.state.value}
          onChange={this.onChangeHandler}
          onRemove={this.onRemoveHandler}
          listType={listType}
        >
          <Button style={{ margin: '0 0 10px' }}>
            <UploadOutlined />
            {(locale && locale.uploadText) || '上传文件'}
          </Button>
        </AntdUpload>
      )
    }
  }
)

export default Upload
