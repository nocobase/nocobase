:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Eventos de interação personalizados

Escreva JavaScript no editor de eventos e registre interações através da instância `chart` do ECharts para criar comportamentos interativos. Por exemplo, você pode navegar para uma nova página ou abrir um modal de detalhamento (drill-down).

![clipboard-image-1761489617](https://static-docs.nocobase.com/clipboard-image-1761489617.png)

## Registrar e Desregistrar Eventos
- Registrar: `chart.on(eventName, handler)`
- Desregistrar: `chart.off(eventName, handler)` ou `chart.off(eventName)` para limpar eventos com o mesmo nome.

**Atenção:**
Por segurança, é altamente recomendado desregistrar um evento antes de registrá-lo novamente!

## Estrutura dos parâmetros do handler

![20251026222859](https://static-docs.nocobase.com/20251026222859.png)

Os campos comuns incluem `params.data` e `params.name`.

## Exemplo: Clique para destacar uma seleção
```js
chart.off('click');
chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // Destaca o ponto de dados atual
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // Desfaz o destaque dos outros
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

## Exemplo: Clique para navegar para uma página
```js
chart.off('click');
chart.on('click', (params) => {
  const order_date = params.data[0]
  
  // Opção 1: Navegação interna sem recarregar a página (recomendado), requer apenas o caminho relativo
  ctx.router.navigate(`/new-path/orders?order_date=${order_date}`)

  // Opção 2: Navegar para uma página externa, requer URL completa
  window.location.href = `https://www.host.com/new-path/orders?order_date=${order_date}`

  // Opção 3: Abrir página externa em uma nova aba, requer URL completa
  window.open(`https://www.host.com/new-path/orders?order_date=${order_date}`)
});
```

## Exemplo: Clique para abrir um modal de detalhes (drill-down)
```js
chart.off('click');
chart.on('click', (params) => {
  ctx.openView(ctx.model.uid + '-1', {
    mode: 'dialog',
    size: 'large',
    defineProperties: {}, // registra variáveis de contexto para o novo modal
  });
});
```

![clipboard-image-1761490321](https://static-docs.nocobase.com/clipboard-image-1761490321.png)

No modal recém-aberto, use as variáveis de contexto do gráfico através de `ctx.view.inputArgs.XXX`.

## Pré-visualizar e Salvar
- Clique em "Pré-visualizar" para carregar e executar o código do evento.
- Clique em "Salvar" para manter a configuração atual do evento.
- Clique em "Cancelar" para reverter ao último estado salvo.

**Recomendações:**
- Sempre use `chart.off('event')` antes de vincular para evitar execuções duplicadas ou aumento do uso de memória.
- Use operações leves (por exemplo, `dispatchAction`, `setOption`) dentro dos handlers de evento para evitar o bloqueio do processo de renderização.
- Valide com as opções do gráfico e consultas de dados para garantir que os campos manipulados no evento sejam consistentes com os dados atuais.