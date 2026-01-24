:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Início Rápido

Vamos configurar um gráfico do zero, utilizando as funcionalidades essenciais. Recursos opcionais serão abordados em capítulos posteriores.

Pré-requisitos:
- Uma **fonte de dados** e uma **coleção** (tabela) já configuradas, e você possui permissão de leitura.

## Adicionar um Bloco de Gráfico

No designer de página, clique em "Adicionar bloco", selecione "Gráfico" e adicione um bloco de gráfico.

![clipboard-image-1761554593](https://static-docs.nocobase.com/clipboard-image-1761554593.png)

Após adicionar, clique em "Configurar" no canto superior direito do bloco.

![clipboard-image-1761554709](https://static-docs.nocobase.com/clipboard-image-1761554709.png)

O painel de configuração do gráfico será aberto à direita. Ele contém três seções: Consulta de Dados, Opções do Gráfico e Eventos.

![clipboard-image-1761554848](https://static-docs.nocobase.com/clipboard-image-1761554848.png)

## Configurar a Consulta de Dados

No painel "Consulta de Dados", você pode configurar a **fonte de dados**, os filtros de consulta e outras opções relacionadas.

- Primeiro, selecione a **fonte de dados** e a **coleção**
  - No painel "Consulta de Dados", escolha a **fonte de dados** e a **coleção** como base para a sua consulta.
  - Se a **coleção** não estiver selecionável ou estiver vazia, verifique primeiro se ela foi criada e se o seu usuário tem as permissões necessárias.

- Configurar Medidas (Measures)
  - Selecione um ou mais campos numéricos como medidas.
  - Defina a agregação para cada medida: Soma / Contagem / Média / Máx / Mín.

- Configurar Dimensões (Dimensions)
  - Selecione um ou mais campos como dimensões de agrupamento (data, categoria, região, etc.).
  - Para campos de data/hora, você pode definir um formato (por exemplo, `YYYY-MM`, `YYYY-MM-DD`) para manter a exibição consistente.

![clipboard-image-1761555060](https://static-docs.nocobase.com/clipboard-image-1761555060.png)

Outras condições, como filtro, ordenação e paginação, são opcionais.

## Executar Consulta e Visualizar Dados

- Clique em "Executar consulta" para buscar os dados e renderizar uma prévia do gráfico diretamente na página à esquerda.
- Você pode clicar em "Ver dados" para pré-visualizar o resultado dos dados retornados; é possível alternar entre os formatos Tabela e JSON. Clique novamente para recolher a prévia dos dados.
- Se o resultado dos dados estiver vazio ou não for o esperado, retorne ao painel de consulta e verifique as permissões da **coleção**, os mapeamentos de campo para medidas/dimensões e os tipos de dados.

![clipboard-image-1761555228](https://static-docs.nocobase.com/clipboard-image-1761555228.png)

## Configurar Opções do Gráfico

No painel "Opções do Gráfico", você pode escolher o tipo de gráfico e configurar suas opções.

- Primeiro, selecione um tipo de gráfico (linha/área, coluna/barra, pizza/rosquinha, dispersão, etc.).
- Complete os mapeamentos de campo essenciais:
  - Linha/área/coluna/barra: `xField` (dimensão), `yField` (medida), `seriesField` (série, opcional)
  - Pizza/rosquinha: `Category` (dimensão categórica), `Value` (medida)
  - Dispersão: `xField`, `yField` (duas medidas ou dimensões)
  - Para mais configurações de gráfico, consulte a documentação do ECharts: [Axis](https://echarts.apache.org/handbook/en/concepts/axis)
- Após clicar em "Executar consulta", os mapeamentos de campo são preenchidos automaticamente por padrão. Se você alterar as dimensões/medidas, por favor, reconfirme os mapeamentos.

![clipboard-image-1761555586](https://static-docs.nocobase.com/clipboard-image-1761555586.png)

## Pré-visualizar e Salvar

As alterações na configuração são atualizadas automaticamente em tempo real na pré-visualização, e você pode ver o gráfico na página à esquerda. No entanto, observe que todas as modificações não são realmente salvas até que você clique no botão "Salvar".

Você também pode usar os botões na parte inferior:

- **Pré-visualizar**: As alterações de configuração atualizam a pré-visualização automaticamente, mas você também pode clicar no botão "Pré-visualizar" na parte inferior para forçar uma atualização manual.
- **Cancelar**: Se você não quiser manter as alterações de configuração atuais, pode clicar no botão "Cancelar" na parte inferior ou atualizar a página para reverter para o último estado salvo.
- **Salvar**: Clique em "Salvar" para persistir a consulta atual e a configuração do gráfico no banco de dados; isso fará com que as alterações entrem em vigor para todos os usuários.

![clipboard-image-1761555803](https://static-docs.nocobase.com/clipboard-image-1761555803.png)

## Dicas Comuns

- **Configuração mínima viável**: Selecione uma **coleção** e adicione pelo menos uma medida; é recomendado adicionar dimensões para uma exibição agrupada.
- Para dimensões de data, defina um formato apropriado (por exemplo, `YYYY-MM` para estatísticas mensais) para evitar um eixo X descontínuo ou confuso.
- **Se a consulta estiver vazia ou o gráfico não for exibido**:
  - Verifique as permissões da **coleção** e os mapeamentos de campo.
  - Use "Ver dados" para confirmar se os nomes das colunas e os tipos correspondem ao mapeamento do gráfico.
- **A pré-visualização é temporária**: Ela serve apenas para validação e ajustes. As alterações só entrarão em vigor oficialmente depois que você clicar em "Salvar".