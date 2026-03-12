import { getPreviewThumbnailUrl } from '../previewer/filePreviewTypes';

interface UploadFieldFile {
  uid?: string;
  id?: number | string;
  url?: string;
  filename?: string;
  name?: string;
  response?: UploadFieldFile;
}

/**
 * 判断上传字段是否继续展示追加入口。
 *
 * 单值文件关系在已有文件后应隐藏“上传”和“选择”入口，多值字段允许继续追加。
 *
 * @param multiple 是否多值
 * @param fileCount 当前文件数量
 * @returns 是否显示追加入口
 * @example
 * ```typescript
 * shouldShowUploadActionSlot(false, 1);
 * ```
 */
export const shouldShowUploadActionSlot = (multiple: boolean | undefined, fileCount: number) => {
  return !!multiple || fileCount === 0;
};

/**
 * 为上传项提取可跨“上传中对象 / 服务端对象”复用的稳定标识。
 *
 * antd UploadList 依赖 uid 作为动画 key；如果外部值回灌后 uid 变化，
 * 同一张图片会被当成“旧节点离场 + 新节点进场”，造成位置闪动。
 *
 * @param file 当前文件对象
 * @param index 当前索引
 * @returns 稳定标识
 * @example
 * ```typescript
 * getUploadFieldFileIdentity({ response: { id: 1 } }, 0);
 * ```
 */
const getUploadFieldFileIdentity = (file: UploadFieldFile, index: number) => {
  const response = file?.response;

  if (file?.id ?? response?.id) {
    return `id:${String(file?.id ?? response?.id)}`;
  }

  if (file?.url ?? response?.url) {
    return `url:${file?.url ?? response?.url}`;
  }

  if (file?.filename ?? response?.filename) {
    return `filename:${file?.filename ?? response?.filename}:${index}`;
  }

  if (file?.name ?? response?.name) {
    return `name:${file?.name ?? response?.name}:${index}`;
  }

  if (file?.uid) {
    return `uid:${file.uid}`;
  }

  return `index:${index}`;
};

/**
 * 规范化上传字段文件列表，并尽量复用上一轮 uid，避免列表项重挂载。
 *
 * @param data 当前外部值或上传组件返回的文件列表
 * @param previousFileList 上一轮渲染中的文件列表
 * @returns 规范化后的文件列表
 * @example
 * ```typescript
 * normalizeUploadFieldFileList([{ id: 1, url: '/1.png' }], [{ uid: 'u1', response: { id: 1 } }]);
 * ```
 */
export const normalizeUploadFieldFileList = (data: UploadFieldFile[], previousFileList: UploadFieldFile[] = []) => {
  const previousUidMap = new Map(
    previousFileList
      .map((file, index) => [getUploadFieldFileIdentity(file, index), file.uid] as const)
      .filter(([, uid]) => !!uid),
  );

  return data.map((file, index) => {
    const identity = getUploadFieldFileIdentity(file, index);

    return {
      ...file,
      uid: file.uid || previousUidMap.get(identity) || identity,
      thumbUrl: getPreviewThumbnailUrl(file),
    };
  });
};
