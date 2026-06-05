:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Perguntas Frequentes

## Seleção de Gráficos
### Qual gráfico devo usar?
Resposta: Escolha com base nos seus dados e objetivos:
- Tendência ou mudança: gráfico de linha ou de área
- Comparação de valores: gráfico de coluna ou de barras
- Composição: gráfico de pizza ou de rosca
- Correlação ou distribuição: gráfico de dispersão
- Hierarquia ou progresso de etapas: gráfico de funil

Para mais tipos de gráficos, consulte os [exemplos do ECharts](https://echarts.apache.org/examples).

### Quais tipos de gráficos o NocoBase suporta?
Resposta: O modo de configuração visual inclui gráficos comuns (linha, área, coluna, barras, pizza, rosca, funil, dispersão, etc.). O modo de configuração personalizada suporta todos os tipos de gráficos do ECharts.

## Problemas na Consulta de Dados
### Os modos de configuração Visual e SQL compartilham configurações?
Resposta: Não, as configurações são armazenadas de forma independente. O modo de configuração usado na sua última gravação é o que prevalece.

## Opções de Gráfico
### Como configuro os campos do gráfico?
Resposta: No modo de configuração visual, selecione os campos de dados de acordo com o tipo de gráfico. Por exemplo, gráficos de linha ou coluna exigem a configuração dos campos do eixo X e do eixo Y; gráficos de pizza exigem a configuração de um campo de categoria e um campo de valor.
Sugerimos que você execute a "Consulta" primeiro para verificar se os dados estão conforme o esperado; por padrão, os campos do gráfico são automaticamente mapeados.

## Visualização e Salvamento
### Preciso pré-visualizar as alterações manualmente?
Resposta: No modo de configuração visual, as alterações são pré-visualizadas automaticamente. Nos modos SQL e de configuração personalizada, para evitar atualizações frequentes, finalize a edição e clique em "Pré-visualizar" manualmente.

### Por que a pré-visualização é perdida ao fechar a janela?
Resposta: O efeito da pré-visualização serve apenas para visualização temporária. Após fazer alterações na configuração, salve antes de fechar; as modificações não salvas não serão mantidas.