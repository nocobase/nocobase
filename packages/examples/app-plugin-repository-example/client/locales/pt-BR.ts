import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  closeDialog: 'Fechar',
  sortTitle: 'Classificar exemplos',
  sortIntro:
    'Execute exemplos de classificação somente leitura usando o cliente Repositório HTTP. Os snippets do construtor acompanham as solicitações serializadas reais; tabelas preservam a ordem de resposta do servidor. As consultas retornam no máximo 10 raízes e reutilizam o CRM existente e as sementes de relacionamento.',
  sortLimits:
    'Use nomes de campos lógicos. Muitos caminhos requerem agregações; to-one inclui não aceita classificação local. O cursor requer eixos escalares diretos não anuláveis ​​e um desempate exclusivo; distinto aceita apenas classificação escalar direta com um desempate exclusivo. Texto e JSON não podem ser classificados.',
  sortRequest: 'Solicitação real · JSON AST',
  sortResultHint:
    'As linhas mantêm a ordem do servidor. Os valores de relação são selecionados explicitamente; as visualizações de registros podem ser mais curtas que as contagens agregadas.',
  sortExpectedError: 'Erro de validação esperado',
  sortUnexpectedSuccess:
    'Esta consulta inválida foi bem-sucedida inesperadamente.',
  sort_default_title: 'Ordem de chave primária padrão',
  sort_default_description:
    'Omitir classificação: os clientes são retornados por chave primária crescente.',
  sort_asc_title: 'Preço do produto ascendente',
  sort_asc_description:
    'Retorna uma única expressão ascendente para unitPriceCents; os preços são centavos inteiros.',
  sort_desc_title: 'Preço do produto descendo',
  sort_desc_description:
    'Retorna uma única expressão descendente para unitPriceCents; os preços são centavos inteiros.',
  sort_multi_title: 'Múltiplos campos e desempates automáticos',
  sort_multi_description:
    'Quantidade decrescente e, em seguida, preço instantâneo ascendente. Pares iguais usam ordem crescente de ID anexado; demo-item-3 e demo-item-7 demonstram o empate.',
  'sort_nulls-first_title': 'Valores NULL primeiro',
  'sort_nulls-first_description':
    'AssigneeId anulável ascendente com NULLs primeiro. As tarefas não atribuídas permanecem visíveis e o ID rompe os vínculos.',
  'sort_nulls-last_title': 'Valores NULL duram',
  'sort_nulls-last_description':
    'AssigneeId anulável ascendente com NULLs por último. O posicionamento explícito evita padrões NULL específicos do banco de dados.',
  'sort_to-one_title': 'Classificar por meio de uma relação para um',
  'sort_to-one_description':
    'Nome do destinatário decrescente, faltando os destinatários por último. Um include separado retorna o nome usado para classificação.',
  sort_count_title: 'Contagem de relações e seleção filtrada',
  sort_count_description:
    'Classificação por todos os pedidos, incluindo contagem 0.paidCount seleciona apenas pedidos pagos; seu filtro não afeta a classificação raiz.',
  sort_include_title: 'Ordem de inclusão independente',
  sort_include_description:
    'Os clientes sobem por ID enquanto os pedidos de cada cliente descem por número. O limite de dois registros se aplica por cliente.',
  sort_duplicate_title: 'Rejeitado: destino de classificação duplicado',
  sort_duplicate_description:
    'O mesmo campo não pode aparecer duas vezes, mesmo com direções diferentes. Execute para inspecionar INVALID_SORT.',
  'sort_to-many_title': 'Rejeitado: caminho de campo direto para muitos',
  'sort_to-many_description':
    'items.quantity possui vários valores por produto. Use uma agregação de relação explícita.',
  sort_sum_title: 'Classificação SUM de relação',
  sort_sum_description:
    'Classifique os produtos pela SOMA da quantidade do item, descendo primeiro com NULLs. As relações vazias são classificadas como 0, embora a SUM selecionada seja NULL. Métricas e linhas de itens são selecionadas explicitamente.',
  sort_avg_title: 'Relação classificação AVG',
  sort_avg_description:
    'Classifique os produtos por AVG de quantidade de itens, descendo primeiro com NULLs. Relações vazias são classificadas como NULL. Métricas e linhas de itens são selecionadas explicitamente.',
  sort_min_title: 'Classificação MIN da relação',
  sort_min_description:
    'Classifique os produtos por MIN da quantidade do item, descendo primeiro com NULLs. Relações vazias são classificadas como NULL. Métricas e linhas de itens são selecionadas explicitamente.',
  sort_max_title: 'Classificação MAX da relação',
  sort_max_description:
    'Classifique os produtos por MAX da quantidade do item, descendo primeiro com NULLs. Relações vazias são classificadas como NULL. Métricas e linhas de itens são selecionadas explicitamente.',
  selectCombineTitle: 'Selecione combinar',
  selectCombineIntro:
    'Retorna listas de registros nomeados e agregações escalares da mesma relação com select.combine. Cada exemplo executa uma solicitação findMany do Repositório somente leitura.',
  combineScopeHint:
    'Mostra os primeiros 10 registros raiz por ID. Os limites de relacionamento se aplicam por pai e por filial. Execute as migrações e sementes do aplicativo se não existirem registros de exemplo.',
  combineRequest: 'Solicitação · selecione AST',
  combineTable: 'Tabela de dados',
  combineJson: 'JSON bruto',
  combineNoRelated: 'Nenhum registro relacionado',
  combineTableHint:
    'As colunas usam caminhos de campo de resposta. As ramificações de registros aparecem como tabelas aninhadas; NULL difere de listas zero e vazias.',
  combineRun: 'Executar consulta',
  combineResult: 'Resultado da consulta',
  combineResultHint:
    'Resposta real: ramificações nomeadas residem dentro de cada objeto de relação.',
  combineEmpty:
    'Sem registros raiz. Execute as migrações e sementes do aplicativo ou crie registros de exemplo.',
  combine_preview_title: 'Pré-visualização do pedido e filiais independentes',
  combine_preview_description:
    'Um pedido em visualização, contagem completa de pedidos, contagem paga e registros cancelados. O limite de visualização não limita ramificações irmãs. Os clientes sem pedidos mantêm listas vazias e contagem zero.',
  combine_statistics_title: 'Registros de itens e agregações múltiplas',
  combine_statistics_description:
    'Duas linhas de item ao lado de COUNT, SUM amount e preços unitários do instantâneo AVG/MIN/MAX em centavos. AVG não é ponderado; uma relação vazia retorna contagem 0 e nula para as outras agregações.',
  combine_nested_title: 'Pedidos, itens e produtos aninhados',
  combine_nested_description:
    'Cada cliente obtém uma visualização e contagem do pedido. Cada pedido visualizado combina uma visualização do item, contagem e soma da quantidade; os registros do item também incluem o nome do produto.',
  combine_scoped_title: 'Filtro compartilhado e filtros locais de filial',
  combine_scoped_description:
    'O filtro de tarefa de rascunho se aplica a todas as filiais. COUNT(assigneeId) conta cessionários não nulos; não atribuído adiciona assigneeId = null. A visualização de uma linha não altera nenhuma contagem.',
  combine_tags_title: 'Combinações de tags muitos para muitos',
  combine_tags_description:
    'Retorne as tags vinculadas de cada projeto, contagem total e contagem de documentação. Os filtros de ramificação ficam dentro da relação desse projeto; tags desvinculadas são excluídas.',
  apiExamples: 'Exemplos de repositório',
  labIntro:
    'Explore uma operação de relacionamento por vez. Escolha uma relação, prepare um exemplo independente e use seu formulário e tabela. Cada carta possui seu projeto e metas; carregar esta página não escreve nada.',
  labOperations: 'Operações de relacionamento',
  labBoth: 'para um / para muitos',
  labManyOnly: 'apenas para muitos',
  labRelation: 'Tipo de relação',
  labPrepare: 'Preparar exemplo',
  labPrepareAgain: 'Prepare um novo exemplo',
  labRefresh: 'Atualizar tabela',
  labPrepareHint:
    'A preparação cria um projeto e quatro alvos privados. A nova preparação preserva exemplos anteriores. A preparação utiliza múltiplas solicitações; cada gravação individual é transacional.',
  labProject: 'Exemplo de projeto',
  labDefaultContent: '{{operation}} exemplo {{id}}',
  labSummary: 'Resumo do perfil',
  labLabel: 'Etiqueta de etiqueta',
  labTitle: 'Título da tarefa',
  labPoints: 'Pontos',
  labTarget: 'Registro de destino',
  labChoose: 'Escolha um registro',
  labNewTarget: 'Crie um novo alvo na primeira execução',
  labNoEligible:
    'Nenhum alvo elegível. Prepare um novo exemplo para tentar novamente.',
  labSetTargets: 'Mantenha esses alvos vinculados',
  labSetEmpty:
    'Desmarque tudo para enviar conjunto: []. Os destinos removidos permanecem na tabela de destinos.',
  labThroughRole: 'Função neste link (through.role)',
  labCurrentProfile: 'Perfil atual',
  labNoProfile: 'Nenhum perfil está vinculado atualmente.',
  labDeleteHint:
    'Isso exclui o registro de destino de exemplo selecionado. Não é uma desconexão; a linha abaixo permanecerá como resultado da exclusão.',
  labUpsertHint:
    'A primeira execução pode criar um destino; execuções subsequentes com o mesmo destino o atualizam. Alvos fora desta relação não são elegíveis.',
  labExecute: 'Execute {{operation}}',
  labRequest: 'Visualize a solicitação desta operação',
  labSaved: 'Gravação {{operation}} bem-sucedida.',
  labRefreshFailed:
    'A gravação foi bem-sucedida, mas a atualização da tabela falhou. Use Atualizar tabela antes de outra gravação.',
  labTargets: 'Alvos e estado de relacionamento',
  labTableHint:
    'Cada alvo é lido de forma independente: desconectar/definir manter alvos, enquanto delete os remove. Apenas os alvos desta carta estão listados.',
  labRecord: 'Registro',
  labLinked: 'Vinculado a este projeto',
  labExists: 'O destino existe',
  labDeleted: 'Alvo excluído',
  labYes: 'Sim',
  labNo: 'Não',
  labLastCall: 'Última solicitação e resposta executada',
  lab_create_title: 'Criar e vincular',
  lab_create_description:
    'Crie um alvo através da relação. O repositório preenche as chaves de relacionamento. Uma criação hasOne requer uma relação vazia neste exemplo.',
  lab_connect_title: 'Vincular um destino existente',
  lab_connect_description:
    'Escolha um alvo desvinculado preparado para esta carta. Nenhum destino é criado pelo Connect. Um destino hasOne deve estar disponível.',
  lab_disconnect_title: 'Desvincular e manter o alvo',
  lab_disconnect_description:
    'Limpe um link hasOne anulável, desanexe um destino hasMany ou remova um link de tabela de junção. O alvo permanece.',
  lab_set_title: 'Substitua o conjunto de relacionamentos',
  lab_set_description:
    'Mantenha exatamente os alvos existentes selecionados. Apenas conjunto de suporte de relações para muitos; Chaves hasMany anuláveis ​​permitem a remoção.',
  lab_update_title: 'Editar um destino vinculado',
  lab_update_description:
    'Edite um alvo dentro da relação atual. Uma atualização to-one usa seu destino atual sem um seletor.',
  lab_upsert_title: 'Atualizar ou criar escopo de relacionamento',
  lab_upsert_description:
    'Crie quando nenhum destino correspondente estiver vinculado, caso contrário, atualize-o. To-many usa um ID exclusivo estável para pesquisa e criação.',
  lab_delete_title: 'Excluir o registro de destino',
  lab_delete_description:
    'Exclua um alvo vinculado, sujeito a restrições. Use apenas os alvos dedicados preparados para esta carta; metas compartilhadas podem afetar outras relações.',
  relationMutationsTitle: 'Relacionamento escreve',
  relationMutationsIntro:
    'Execute um fluxo de trabalho de relacionamento completo do Repositório HTTP entre pertenceTo, hasOne, hasMany e pertenceToMany. Cada botão usa api.repository(name); nenhum ponto final de mutação específico do exemplo está envolvido.',
  relationBaselineTitle: 'Linha de base do relacionamento propagado',
  relationBaselineDescription:
    'Os registros determinísticos espelham a documentação de gravação de relacionamento do Repositório ao usar nomes de coleção prefixados por plug-in.',
  relationSeedHint:
    'Execute as migrações e sementes do aplicativo para criar os registros de exemplo de relacionamento.',
  relationRunTitle: 'Passo a passo completo sobre mutação',
  relationRunDescription:
    'Cria um gráfico de projeto isolado, aplica operações de relacionamento incrementais e, em seguida, substitui seu conjunto de tags. Cada mutação raiz é transacional.',
  relationRunButton: 'Execute a gravação completa do relacionamento',
  relationRunIsolation:
    'Cada execução utiliza novos IDs, portanto os exemplos anteriores permanecem disponíveis para inspeção.',
  relationResultTitle: 'Estado final do relacionamento',
  relationResultDescription:
    'O proprietário e o perfil foram atualizados, as operações da tarefa foram aplicadas no escopo da relação e o conjunto manteve apenas as tags selecionadas.',
  relationLifetimeTitle: 'Verificações de vida útil desejada',
  relationLifetimeDescription:
    'desconecta e remove links, mas mantém os alvos; delete remove o registro de destino.',
  relationTraceHint:
    'Nomes reais de repositórios, cargas úteis createOne/updateOne e respostas emitidas por esta execução.',
  relationOwnerLabel: 'pertence ao · proprietário',
  relationProfileLabel: 'hasOne · perfil',
  relationTasksLabel: 'hasMany · tarefas',
  relationTagsLabel: 'pertence a muitos · tags',
  relationTasks: 'Tarefas relacionadas',
  relationPoints: 'Pontos',
  relationAssignee: 'Responsável atribuído',
  relationDisconnectCheck:
    'desconectar: tarefa existe={{exists}}, projectId={{projectId}}',
  relationDeleteCheck: 'excluir: tarefa existe={{exists}}',
  relationSetCheck: 'conjunto: tag removida existe={{exists}}',
  findManyTitle: 'findMany: array e fluxo',
  findManyIntro:
    'Execute a mesma consulta ao Repositório em dois modos de consumo. Await resolve uma vez com o array completo; a iteração assíncrona lê registros NDJSON emoldurados à medida que chegam. A consulta, os filtros, a classificação e os limites do banco de dados permanecem os mesmos.',
  findManyArrayTitle: 'Aguarde uma matriz',
  findManyArrayDescription:
    'Aguardando findMany envia uma solicitação JSON normal e resolve com todos os registros correspondentes.',
  findManyStreamTitle: 'Iterar um fluxo',
  findManyStreamDescription:
    'Usar for await envia uma solicitação NDJSON e anexa cada registro decodificado à tabela de resultados.',
  findManyProtocol: 'Resposta HTTP',
  findManyRunArray: 'Executar consulta de array',
  findManyRunStream: 'Executar consulta de fluxo',
  findManyReceived: 'Registros recebidos',
  findManyReceivedCount: 'Registros {{count}} recebidos',
  findManyResults: 'Resultados',
  findManyRecordTitle: 'Título',
  findManyCategory: 'Categoria',
  findManyDescription: 'Descrição',
  findManyEmpty:
    'Execute esta consulta para carregar os registros de exemplo propagados.',
  atomicTitle: 'Atualizações numéricas atômicas',
  atomicIntro:
    'Atualizar números diretamente no banco de dados com incremento, decremento e multiplicação. As solicitações enviam a operação, nunca um valor calculado a partir de um instantâneo de navegador potencialmente obsoleto. Todos os usuários conectados compartilham esses contadores de exemplo.',
  atomicStock: 'Estoque em armazém',
  atomicStockHint:
    'Receber ou deduzir unidades. A dedução verifica o estoque disponível na mesma atualização, evitando estoque negativo.',
  atomicWallet: 'Saldo da conta (centavos)',
  atomicWalletHint:
    'Recarregue ou gaste centavos inteiros. A condição de equilíbrio e a subtração são avaliadas juntas no banco de dados.',
  atomicPoints: 'Pontos de recompensa',
  atomicPointsHint:
    'Adicione pontos ou duplique os pontos atuais usando multiplicação: 2. A duplicação usa o valor atual do banco de dados.',
  atomicVisits: 'Balcão de visitas',
  atomicVisitsHint:
    'Incrementar uma vez ou enviar 10 incrementos simultâneos: 1 solicitação. Outros usuários também podem alterar este contador compartilhado.',
  atomicAmount: 'Montante',
  atomic_increment: 'Aumento',
  atomic_decrement: 'Diminuir (protegido)',
  atomic_multiply: 'Duplo ×2',
  atomic_concurrent: '10 simultâneos +1',
  atomicSeedHint:
    'Execute as migrações e sementes do aplicativo para criar este contador de exemplo.',
  atomicInsufficient:
    'O contador foi removido ou seu valor atual é insuficiente. Nada foi deduzido.',
  atomicUpdated: 'O banco de dados retornou o novo valor: {{value}}.',
  atomicConcurrentResult:
    '{{count}} de 10 incrementos simultâneos foi bem-sucedido. O valor exibido é lido novamente no banco de dados.',
  atomicPartial:
    'Alguns incrementos falharam. As solicitações bem-sucedidas permanecem confirmadas; inspecione os resultados antes de tentar novamente.',
  atomicTraceHint:
    'Entradas e respostas reais do updateOne, incluindo atualizações rejeitadas. Nenhuma nova tentativa automática é executada.',
  groupByExamples: 'Mais exemplos de groupBy',
  groupByMinimumCount: 'Mínimo de linhas por grupo (novos exemplos)',
  groupByEmpty:
    'Nenhum grupo corresponde a esses filtros. Reduza a contagem mínima ou altere o status.',
  groupBy_customerRanking: 'Classificação do pedido do cliente',
  groupBy_customerRankingHint:
    'GROUP BY customerId · COUNT(*) · HAVING contagem ≥ mínimo · contagem DESC, customerId ASC. Clientes sem pedidos correspondentes não formam um grupo.',
  groupBy_customerStatus: 'Cliente × status do pedido',
  groupBy_customerStatusHint:
    'GROUP BY customerId, status. O mesmo cliente pode aparecer em vários grupos de status. HAVING se aplica a cada combinação, não ao total do cliente. Os grupos enum preservam valores exatos; a classificação usa contagem e customerId.',
  groupBy_productPrice: 'Produto × preço unitário do item',
  groupBy_productPriceHint:
    'GROUP BY productId, unitPriceCents · COUNT(*) e SUM(quantity). Os preços instantâneos de itens diferentes permanecem separados, mesmo para o mesmo produto. Classifique por quantidade DESC, productId ASC, preço ASC. Os preços são centavos; COUNT mede linhas de itens, não unidades.',
  aggregateApply: 'Aplicar',
  aggregateTitle: 'Consultas agregadas',
  aggregateIntro:
    'Estatísticas do lado do banco de dados sobre os pedidos e itens existentes: agregação, groupBy com HAVING e contagens de relacionamento por cliente. Os filtros de status se aplicam a todos os painéis; a quantidade mínima aplica-se apenas a grupos de produtos. A contagem mínima de linhas se aplica aos três exemplos groupBy adicionais.',
  aggregateAll: 'Todos os status',
  aggregateHaving: 'Quantidade mínima agrupada (HAVING)',
  aggregateMetrics: 'Agregados de itens',
  aggregate_count: 'COUNT · linhas de item',
  aggregate_quantity: 'SOMA · quantidade',
  aggregate_averagePrice: 'AVG · preço unitário (centavos)',
  aggregate_minimumPrice: 'MIN · preço unitário (centavos)',
  aggregate_maximumPrice: 'MAX · preço unitário (centavos)',
  aggregateSemantics:
    'O preço médio é a média não ponderada dos preços unitários dos itens, não o total do pedido ou o preço ponderado pela quantidade. Conjuntos vazios retornam contagem 0 e NULL para SUM/AVG/MIN/MAX. Os painéis executam consultas separadas e podem observar edições simultâneas.',
  aggregateStatuses: 'Pedidos agrupados por status · groupBy',
  aggregateCustomers: 'Agregados de relacionamento com clientes',
  aggregateCustomerHint:
    'Primeiros clientes {{count}} por ID, incluindo clientes com zero pedidos correspondentes. As contagens usam o status selecionado.',
  aggregateProducts: 'Itens agrupados por produto',
  aggregateTraceHint:
    'Chama as ações agregadas/groupBy configuradas do Repositório HTTP com ASTs JSON; contagens de clientes usam seleções de relacionamento findMany. Expanda as solicitações para inspecionar as expressões reais.',
  crm: 'Exemplo de CRM',
  ordersTitle: 'Exemplo de pedidos',
  subtitle:
    'Clientes, relacionamentos e pedidos, alimentados por APIs de repositório.',
  customer: 'Cliente',
  contact: 'Contato',
  product: 'Produto',
  order: 'Pedido',
  orderItem: 'Item do pedido',
  customers: 'Clientes',
  contacts: 'Contatos',
  products: 'Produtos',
  orders: 'Pedidos',
  items: 'Encomendar itens',
  name: 'Nome',
  company: 'Empresa',
  email: 'E-mail',
  phone: 'Telefone',
  status: 'Status',
  sku: 'SKU',
  unitPriceCents: 'Preço unitário (centavos)',
  number: 'Número do pedido',
  customerId: 'Cliente',
  orderId: 'Pedido',
  productId: 'Produto',
  quantity: 'Quantidade',
  lead: 'Cliente potencial',
  active: 'Ativo',
  inactive: 'Inativo',
  draft: 'Rascunho',
  confirmed: 'Confirmado',
  paid: 'Pago',
  cancelled: 'Cancelado',
  new: 'Novo recorde',
  edit: 'Editar',
  view: 'Ver detalhes',
  delete: 'Excluir',
  save: 'Salvar',
  cancel: 'Cancelar',
  search: 'Pesquisa por nome/número/ID',
  apply: 'Pesquisar',
  refresh: 'Atualizar',
  previous: 'Anterior',
  next: 'Próximo',
  page: 'Página {{page}}',
  count: 'Registros {{count}}',
  empty: 'Ainda não há registros. Crie o primeiro registro para começar.',
  loading: 'Carregando…',
  select: 'Selecione um registro',
  createTitle: 'Criar {{entity}}',
  editTitle: 'Editar {{entity}}',
  details: 'Detalhes do registro',
  relations: 'Registros relacionados',
  none: 'Nenhum',
  lookup: 'Procurar por ID',
  check: 'Verifique e abra',
  notFound: 'Nenhum registro com este ID.',
  found: 'O registro existe.',
  saved: 'Registro salvo.',
  deleted: 'Registro excluído.',
  confirmDelete:
    'Excluir este registro? Contatos relacionados ou itens de pedidos também serão removidos. Clientes com pedidos e produtos utilizados por itens do pedido não poderão ser excluídos.',
  confirm: 'Confirmar exclusão',
  trace: 'Chamadas de repositório',
  traceHint:
    'A última solicitação e resultado mostram o API usado por esta tela.',
  error: 'A operação falhou.',
  loadError:
    'Não é possível carregar registros. Tente novamente com Atualizar.',
  conflict:
    'Este pedido mudou desde que você o abriu. Atualize e reabra-o antes de editar.',
  choicesHint:
    'Crie primeiro clientes e produtos, depois pedidos e seus itens.',
  moneyHint:
    'Os preços são centavos inteiros. Total da linha = quantidade × preço unitário; nenhuma matemática de moeda de ponto flutuante.',
  version: 'Versão',
  addItem: 'Adicionar item',
  removeItem: 'Remover item',
  orderTotal: 'Total do pedido (centavos)',
  noItems: 'Nenhum item de pedido.',
  itemRow: 'Item {{number}}',
  lineTotal: 'Total da linha (centavos)',
  id: 'ID',
  back: 'Voltar à lista',
  close: 'Fechar detalhes',
  request: 'Solicitação',
  response: 'Resposta',
  loadingChoices: 'Carregando registros relacionados…',
};

export default ptBR;
