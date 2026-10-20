import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  navTitle: 'Exemplo de impressão de modelo',
  title: 'Exemplo de impressão de modelo',
  description:
    'Renderize um modelo DOCX fixo com uma fatura e seus dados de cotação autorizada como DOCX ou PDF. A conversão de PDF requer o LibreOffice no servidor de aplicativos.',
  invoiceList: 'Faturas',
  invoiceCount_one: 'Fatura {{count}}',
  invoiceCount_other: 'Faturas {{count}}',
  loading: 'Carregando faturas…',
  empty: 'Nenhuma fatura está disponível no seu escopo de acesso à cotação.',
  emptyHint:
    'Execute as tarefas do banco de dados de Exemplos e faça login como sales_manager ou use uma conta que possa visualizar a cotação de vendas vinculada.',
  loadFailed: 'Não foi possível carregar faturas.',
  download: 'Baixar DOCX',
  downloading: 'Renderizando…',
  downloadFailed: 'Não foi possível processar a fatura.',
  invoice: 'Fatura',
  customer: 'Cliente',
  issuedOn: 'Emitido em',
  quote: 'Citação da fonte',
  amount: 'Total',
  downloadActions: 'Ações de download',
  downloadPdf: 'Baixar PDF',
  pdfConverterUnavailable:
    'A conversão de PDF não está disponível porque o LibreOffice não foi encontrado no servidor de aplicativos. Instale-o na mesma máquina ou contêiner que NocoBase, certifique-se de que o processo do servidor possa encontrar seu executável e reinicie o aplicativo. O download do DOCX permanece disponível.',
  installLibreOffice: 'Baixe o LibreOffice',
  retry: 'Tentar novamente',
  invoiceCount_many: 'Faturas {{count}}',
};

export default ptBR;
