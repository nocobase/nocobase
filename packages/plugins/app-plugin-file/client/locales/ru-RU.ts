import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ruRU: LocaleResource<typeof enUS> = {
  'files.ooxmlLoadFailed': 'Не удалось отобразить этот файл Office Open XML.',
  'files.ooxmlLoadTimedOut': 'Предпросмотр не загрузился за {{minutes}} мин.',
  'files.previewRequestFailed': 'Ошибка запроса предпросмотра ({{status}}).',
  uploadFailed: 'Не удалось загрузить файл.',
  fileLimitReached: 'Достигнуто максимальное число файлов.',
  fileTooLarge: 'Файл превышает максимальный размер.',
  fileTypeNotAllowed: 'Этот тип файла не разрешён.',
  removalFailed: 'Не удалось удалить файл.',
  urlNotAllowed: 'URL файла не разрешён.',
  downloadFailed: 'Не удалось скачать файл.',
  invalidUrl: 'URL файла отсутствует или не разрешён.',
  pdfPreviewFailed: 'Не удалось загрузить предпросмотр PDF.',
  pdfPreviewMarkup: 'По URL файла вернулся HTML или XML вместо PDF.',
  previewFailed: 'Не удалось загрузить предпросмотр файла.',
  'files.empty': 'Нет файлов.',
  'files.preview': 'Предпросмотр',
  'files.download': 'Скачать',
  'files.remove': 'Удалить',
  'files.chooseMany': 'Выбрать файлы',
  'files.chooseOne': 'Выбрать файл',
  'files.retry': 'Повторить',
  'files.done': 'Готово',
  'files.uploading': 'Загрузка',
  'files.failed': 'Ошибка',
  'files.pending': 'В очереди',
  'files.previous': 'Предыдущий файл',
  'files.next': 'Следующий файл',
  'files.loadingPreview': 'Загрузка предпросмотра...',
  'files.downloadFile': 'Скачать файл',
  'files.htmlPage': 'Страница',
  'files.htmlSource': 'Исходный код',
  'files.previewUnavailable': 'Для этого типа файлов предпросмотр недоступен.',
  'files.imageFailed':
    'Не удалось показать изображение. Возможно, оно повреждено или имеет неподдерживаемый формат.',
  'files.officeFailed': 'Office Online не смог загрузить этот файл.',
  'files.officeUrl':
    'Для Office Online нужен абсолютный URL файла, доступный из интернета.',
  'files.cancelFile': 'Отменить {{filename}}',
  'files.status.uploading': 'Загрузка',
  'files.status.pending': 'В очереди',
  'files.status.error': 'Ошибка',
};

export default ruRU;
