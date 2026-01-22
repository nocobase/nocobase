:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Filtros de Página e Interligação

O filtro de página (Bloco de Filtro) permite inserir condições de filtro de forma unificada no nível da página e as mescla em consultas de gráficos, garantindo que múltiplos gráficos sejam filtrados de forma consistente e interligados.

## Visão Geral das Funcionalidades
- Adicione um "Bloco de Filtro" à página para fornecer uma entrada de filtro unificada para todos os gráficos da página atual.
- Use os botões “Filtrar”, “Redefinir” e “Recolher” para aplicar, limpar e recolher.
- Se o filtro selecionar campos associados a um gráfico, seus valores serão automaticamente mesclados na consulta do gráfico e acionarão uma atualização.
- Os filtros também podem criar campos personalizados e registrá-los em variáveis de contexto, para que possam ser referenciados em gráficos, tabelas, formulários e outros blocos de dados.

![clipboard-image-1761487702](https://static-docs.nocobase.com/clipboard-image-1761487702.png)

Para mais informações sobre o uso de filtros de página e a interligação com gráficos ou outros blocos de dados, consulte a documentação de filtros de página.

## Usar valores de filtro de página em consultas de gráficos
- Modo Construtor (recomendado)
  - Mesclagem automática: Quando a fonte de dados e a coleção correspondem, você não precisa escrever variáveis adicionais na consulta do gráfico; os filtros de página são mesclados com `$and`.
  - Seleção manual: Você também pode selecionar ativamente os valores dos “campos personalizados” do filtro de página nas condições de filtro do gráfico.

- Modo SQL (via injeção de variável)
  - Em instruções SQL, use “Escolher variável” para inserir os valores dos “campos personalizados” do filtro de página.