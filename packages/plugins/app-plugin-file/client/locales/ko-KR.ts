import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  'files.ooxmlLoadFailed': '이 Office Open XML 파일을 표시할 수 없습니다.',
  'files.ooxmlLoadTimedOut':
    '미리 보기가 {{minutes}}분 안에 로드되지 않았습니다.',
  'files.previewRequestFailed': '미리 보기 요청 실패({{status}}).',
  uploadFailed: '파일을 업로드하지 못했습니다.',
  fileLimitReached: '최대 파일 수에 도달했습니다.',
  fileTooLarge: '파일이 최대 크기를 초과합니다.',
  fileTypeNotAllowed: '허용되지 않는 파일 형식입니다.',
  removalFailed: '파일을 삭제하지 못했습니다.',
  urlNotAllowed: '허용되지 않는 파일 URL입니다.',
  downloadFailed: '파일을 다운로드하지 못했습니다.',
  invalidUrl: '파일 URL이 없거나 허용되지 않습니다.',
  pdfPreviewFailed: 'PDF 미리 보기를 불러올 수 없습니다.',
  pdfPreviewMarkup: '파일 URL이 PDF 대신 HTML 또는 XML을 반환했습니다.',
  previewFailed: '파일 미리 보기를 불러올 수 없습니다.',
  'files.empty': '파일이 없습니다.',
  'files.preview': '미리 보기',
  'files.download': '다운로드',
  'files.remove': '삭제',
  'files.chooseMany': '파일 선택',
  'files.chooseOne': '파일 선택',
  'files.retry': '다시 시도',
  'files.done': '완료',
  'files.uploading': '업로드 중',
  'files.failed': '실패',
  'files.pending': '대기 중',
  'files.previous': '이전 파일',
  'files.next': '다음 파일',
  'files.loadingPreview': '미리 보기를 불러오는 중...',
  'files.downloadFile': '파일 다운로드',
  'files.htmlPage': '페이지',
  'files.htmlSource': '소스',
  'files.previewUnavailable': '이 파일 형식은 미리 볼 수 없습니다.',
  'files.imageFailed':
    '이미지를 표시할 수 없습니다. 손상되었거나 지원되지 않는 형식일 수 있습니다.',
  'files.officeFailed': 'Office Online에서 이 파일을 불러오지 못했습니다.',
  'files.officeUrl':
    'Office Online에는 인터넷에서 접근 가능한 절대 파일 URL이 필요합니다.',
  'files.cancelFile': '{{filename}} 취소',
  'files.status.uploading': '업로드 중',
  'files.status.pending': '대기 중',
  'files.status.error': '실패',
};

export default koKR;
