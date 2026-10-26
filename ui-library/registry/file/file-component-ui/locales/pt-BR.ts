import type { FileUiResource } from './en-US.js';
const messages = {
  'files.ooxmlLoadFailed':
    'Não é possível renderizar este arquivo Office Open XML.',
  'files.ooxmlLoadTimedOut':
    'A visualização não terminou de carregar em {{minutes}} minutos.',
  'files.previewRequestFailed':
    'Falha na solicitação de visualização ({{status}}).',
  uploadFailed: 'Falha no upload do arquivo.',
  fileLimitReached: 'O número máximo de arquivos foi atingido.',
  fileTooLarge: 'O arquivo excede o tamanho máximo.',
  fileTypeNotAllowed: 'O tipo de arquivo não é permitido.',
  removalFailed: 'Falha na remoção do arquivo.',
  urlNotAllowed: 'O arquivo URL não é permitido.',
  downloadFailed: 'Falha no download do arquivo.',
  invalidUrl: 'O arquivo URL está ausente ou não é permitido.',
  pdfPreviewFailed: 'Não é possível carregar a visualização do PDF.',
  pdfPreviewMarkup: 'O arquivo URL retornou HTML ou XML em vez de PDF.',
  previewFailed: 'Não foi possível carregar a visualização do arquivo.',
  'files.empty': 'Nenhum arquivo.',
  'files.preview': 'Visualização',
  'files.download': 'Baixar',
  'files.remove': 'Remover',
  'files.chooseMany': 'Escolha arquivos',
  'files.chooseOne': 'Escolha o arquivo',
  'files.retry': 'Tentar novamente',
  'files.done': 'Concluído',
  'files.uploading': 'Carregando',
  'files.failed': 'Falha',
  'files.pending': 'Pendente',
  'files.previous': 'Arquivo anterior',
  'files.next': 'Próximo arquivo',
  'files.loadingPreview': 'Carregando visualização...',
  'files.downloadFile': 'Baixar arquivo',
  'files.previewUnavailable':
    'A visualização não está disponível para este tipo de arquivo.',
  'files.imageFailed':
    'Esta imagem não pôde ser exibida. Ele pode estar corrompido ou em um formato não compatível.',
  'files.officeFailed': 'O Office Online não pôde carregar este arquivo.',
  'files.officeUrl':
    'O Office Online requer um arquivo absoluto URL acessível pela Internet.',
  'files.cancelFile': 'Cancelar {{filename}}',
  'files.status.uploading': 'Carregando',
  'files.status.pending': 'Pendente',
  'files.status.error': 'Falha',
};

const resource: FileUiResource = { fileUi: messages };
export default resource;
