import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  storage: {
    title: 'Armazenamento de arquivos',
    navDescription:
      'Onde os arquivos enviados são armazenados e quais recursos os armazenam',
    description:
      'Onde os arquivos enviados são armazenados, o tamanho máximo de um arquivo e quais recursos armazenam arquivos. O armazenamento é definido na configuração da aplicação (`drive`) e entra em vigor após uma nova implantação; esta página mostra as configurações em vigor e verifica se o armazenamento pode realmente ser lido e gravado.',
    checkAction: 'Verificar armazenamento',
    loading: 'Carregando o armazenamento de arquivos…',
    loadFailed: 'Não foi possível carregar o armazenamento de arquivos.',
    retry: 'Tentar novamente',
    tabs: { disks: 'Armazenamento', usages: 'Recursos' },
    hints: {
      title_one: '{{count}} aviso',
      title_many: '{{count}} avisos',
      title_other: '{{count}} avisos',
      incomplete:
        'O disco {{disk}} não está totalmente configurado ({{problems}}): não causa problemas enquanto não é usado e falha quando é escolhido.',
      localDefault:
        'O armazenamento padrão é um disco local: a aplicação só pode ser executada como uma única instância. Use armazenamento compartilhado para várias instâncias.',
      seeCluster: 'Consulte Cluster e distribuído.',
    },
    columns: {
      name: 'Nome',
      type: 'Tipo · local',
      visibility: 'Visibilidade',
      maxFileSize: 'Tamanho máximo do arquivo',
      usages: 'Recursos',
      status: 'Status',
      feature: 'Recurso',
      collection: 'Tabela de arquivos',
      disk: 'Armazenado em',
      download: 'Download',
      files: 'Arquivos',
      setting: 'Configuração',
      value: 'Valor atual',
      source: 'Origem',
    },
    default: 'Padrão',
    details: 'Detalhes',
    usageCount_one: '{{count}} recurso',
    usageCount_many: '{{count}} recursos',
    usageCount_other: '{{count}} recursos',
    drivers: {
      fs: 'Disco local',
      s3: 'Armazenamento compatível com S3',
      oss: 'Alibaba Cloud OSS',
      custom: 'Driver personalizado',
    },
    location: {
      inApp: '{{path}} (no diretório da aplicação)',
      outsideApp: 'Fora do diretório da aplicação',
      bucketMissing: 'bucket não definido',
      unknown: 'Definido no código',
    },
    visibility: {
      private: 'Privado',
      public: 'Público',
      privateLong: 'Privado: baixado somente pela aplicação',
      publicLong: 'Público: qualquer pessoa com a URL pode baixar',
      unknown: 'Definido pelo driver',
    },
    urls: {
      application: 'Servido pela aplicação (stream)',
      public: 'URL pública',
      signed: 'URL assinada que expira',
    },
    sizeMb: '{{size}} MB',
    status: {
      ok: 'Leitura e gravação OK',
      failed: 'Falha na verificação',
      incomplete: 'Configuração incompleta',
      unchecked: 'Não verificado',
      checkedAgo: 'Verificado {{time}}',
    },
    problems: {
      LOCATION_MISSING: 'location está vazio',
      BUCKET_MISSING: 'bucket está vazio',
      REGION_MISSING: 'region está vazio',
      CREDENTIALS_MISSING: 'credenciais ausentes',
      NOT_LOADED: 'não carregado pela aplicação',
    },
    sources: {
      code: 'Código',
      config: 'Configuração',
      default: 'Valor padrão',
    },
    settings: {
      driver: 'Tipo',
      location: 'Local',
      visibility: 'Visibilidade',
      maxFileSize: 'Tamanho máximo do arquivo',
      urls: 'Links de download',
    },
    backToList: 'Armazenamento de arquivos',
    defaultSubtitle: 'Novos envios são armazenados aqui por padrão.',
    notDefaultSubtitle: 'Usado apenas pelos recursos que o indicam.',
    notFound: 'O disco {{disk}} não está configurado.',
    howToChange: 'Como alterar',
    howToChangeNote:
      'Alibaba Cloud OSS (`oss`) e drivers personalizados também são suportados. Faça uma nova implantação após a alteração e aumente o limite do corpo da requisição do proxy reverso para pelo menos o tamanho máximo do arquivo.',
    check: {
      title: 'Verificação',
      run: 'Verificar',
      rerun: 'Verificar novamente',
      running: 'Verificando…',
      failed: 'Não foi possível executar a verificação.',
      never:
        'Este disco ainda não foi verificado nesta instância desde que ela foi iniciada.',
      scope:
        'Apenas um arquivo temporário no diretório `nocobase-check/` do disco é gravado, lido e excluído; os arquivos de negócio não são tocados. Com várias instâncias, apenas esta instância é verificada.',
      steps: {
        write: 'Gravar um arquivo temporário',
        read: 'Ler de volta e comparar',
        url: 'Criar um link de download',
        delete: 'Excluir o arquivo temporário',
      },
      details: {
        bytes: '{{bytes}} bytes conferem',
        APPLICATION: 'Servido pela aplicação',
        PUBLIC: 'URL pública criada',
        SIGNED: 'URL assinada criada',
        deleted: 'Excluído',
        skipped: 'Ignorado',
      },
      reasons: {
        CONFIG_INCOMPLETE: 'Configuração incompleta: {{detail}}',
        DISK_UNAVAILABLE: 'Não foi possível abrir o disco',
        WRITE_FAILED: 'Falha na gravação',
        READ_FAILED: 'Falha na leitura',
        CONTENT_MISMATCH: 'O conteúdo lido é diferente',
        URL_FAILED: 'Não foi possível criar um link',
        DELETE_FAILED: 'Falha na exclusão',
        unknown: 'Falhou',
      },
    },
    usedBy: 'Recursos que usam este disco',
    noUsagesOnDisk: 'Nenhum recurso armazena arquivos neste disco.',
    download: {
      authenticated: 'Login e permissão',
      public: 'Link público',
    },
    diskDefault: 'Padrão ({{disk}})',
    diskConfig: '{{path}} → {{disk}}',
    diskConfigDefault: '{{path}} → Padrão ({{disk}})',
    plugin: 'Plugin {{plugin}}',
    application: 'Aplicação',
    filesValue: '{{files}} arquivos · {{size}}',
    filesUnavailable: 'Não foi possível contar',
    empty: {
      title: 'Nenhum recurso armazena arquivos ainda',
      description:
        'As tabelas de arquivos são criadas por plugins ou pelo código da aplicação. Quando um plugin com anexos é instalado (como projetos, bases de conhecimento ou agentes), ele aparece aqui sem configuração adicional.',
      defaultDisk:
        'As configurações de armazenamento continuam valendo: tabelas de arquivos adicionadas depois armazenam arquivos em {{disk}} por padrão.',
    },
    notes: {
      title: 'Observações',
      firstUse:
        'O armazenamento é conectado no primeiro uso, então uma inicialização bem-sucedida não prova que ele pode ser lido e gravado. A verificação grava, lê e exclui um arquivo temporário para confirmar.',
      changeDefault:
        'Alterar o armazenamento padrão afeta apenas os envios posteriores; os arquivos existentes continuam sendo lidos do armazenamento indicado em seus registros e não são movidos.',
      deleteRecords: 'Excluir um registro não exclui o arquivo dele do disco.',
      publicLinks:
        'Um link público pode ser aberto por qualquer pessoa que o conheça, sem login. Arquivos sensíveis devem ser servidos pelas rotas autenticadas do próprio plugin.',
      noBrowser:
        'Não há um navegador de arquivos global: os arquivos pertencem aos seus recursos e são visualizados conforme as permissões de cada recurso.',
      readOnly:
        'Os recursos são declarados pelo código do plugin ou da aplicação (tabela de arquivos, disco, método de download). Esta lista é somente leitura; não é possível criar tabelas de arquivos aqui.',
    },
  },
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

export default ptBR;
