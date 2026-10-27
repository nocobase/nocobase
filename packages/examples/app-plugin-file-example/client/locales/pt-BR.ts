import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  officePreviewTitle: 'Visualização do escritório local',
  officePreviewDescription:
    'Carregue um arquivo DOCX, XLSX ou PPTX abaixo e selecione Visualizar. Os documentos são renderizados em seu navegador sem o Office Online ou um serviço de visualização externo. Os anexos do pedido usam a mesma visualização.',
  officePreviewLimits:
    'Nenhuma conexão com a Internet é necessária quando o aplicativo e o serviço de arquivo estão acessíveis em sua rede local. Este não é um modo totalmente desconectado. Os arquivos legados DOC, XLS, PPT e OpenDocument permanecem somente para download neste exemplo.',
  title: 'Anexos',
  description:
    'Carregue um ou vários arquivos e visualize-os no lugar. Os registros são armazenados por meio do Repositório de Arquivos API.',
  apiHint:
    'Esta página mantém o fluxo bruto do repositório: o controle de upload chama uploadOne para um único arquivo e uploadMany para um lote.',
  retention:
    'A exclusão de um registro remove apenas seus metadados; o objeto armazenado permanece no disco.',
  choose: 'Escolha arquivos',
  uploading: 'Carregando…',
  dropHint: 'ou solte os arquivos aqui',
  tooLarge: 'Arquivo excede o tamanho máximo',
  rejected: 'Tipo de arquivo não permitido',
  uploadFailed: 'Falha no upload',
  preview: 'Visualização',
  download: 'Baixar',
  remove: 'Excluir',
  unlink: 'Remover do pedido',
  empty: 'Nenhum arquivo ainda.',
  close: 'Fechar',
  previous: 'Anterior',
  next: 'Próximo',
  loading: 'Carregando…',
  previewUnsupported:
    'Este tipo de arquivo não possui visualização in-line. Baixe-o.',
  previewFailed: 'O arquivo não pôde ser carregado.',
  navGroup: 'Exemplo de arquivo',
  navAttachments: 'Anexos',
  navProfiles: 'Avatares de perfil',
  navOrders: 'Anexos de pedido',
  profilesTitle: 'Avatares de perfil (um para um)',
  profilesDescription:
    'Um perfil possui no máximo um avatar. O upload de um novo avatar substitui o arquivo anterior.',
  profilesRelationHint:
    'Relação: fileExampleProfiles.avatar é uma relação hasOne com fileExampleProfileAvatars, que mantém um profileId exclusivo.',
  noAvatar: 'Sem avatar',
  profilesNoFile: 'Nenhum arquivo de avatar conectado',
  profilesEmpty:
    'Nenhum perfil encontrado. Execute a semente de exemplo para criar registros de demonstração.',
  uploadAvatar: 'Carregar avatar',
  replaceAvatar: 'Substituir avatar',
  removeAvatar: 'Remover avatar',
  avatarHint:
    'O upload armazena o arquivo e depois o conecta através da relação de perfil; remover apenas limpa a relação.',
  ordersTitle: 'Anexos do pedido (um para muitos)',
  ordersDescription:
    'Um pedido possui qualquer número de anexos. Selecione vários arquivos de uma vez para carregá-los em lote.',
  ordersRelationHint:
    'Relação: fileExampleOrders.attachments é uma relação hasMany com fileExampleOrderAttachments por meio de orderId.',
  ordersNoFiles: 'Nenhum anexo neste pedido.',
  ordersEmpty:
    'Nenhum pedido encontrado. Execute a semente de exemplo para criar registros de demonstração.',
  ordersHint:
    'A remoção de um anexo limpa a relação de pedido. O registro do arquivo permanece disponível no Repositório de Arquivos.',
  'status.draft': 'Rascunho',
  'status.submitted': 'Enviado',
  'status.archived': 'Arquivado',
};

export default ptBR;
