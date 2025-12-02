:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Consultar dados no modo SQL

No painel "Consulta de dados", alterne para o modo SQL, escreva e execute a consulta, e use o resultado retornado diretamente para mapeamento e renderização de gráficos.

![20251027075805](https://static-docs.nocobase.com/20251027075805.png)

## Escrever instruções SQL
- No painel "Consulta de dados", selecione o modo SQL.
- Insira o SQL e clique em "Executar consulta".
- Suporta instruções SQL complexas, incluindo JOIN de múltiplas tabelas e VIEWs.

Exemplo: valor do pedido por mês
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

## Visualizar resultados
- Clique em "Visualizar dados" para abrir o painel de pré-visualização dos resultados.

![20251027080014](https://static-docs.nocobase.com/20251027080014.png)

Os dados suportam paginação; você pode alternar entre Tabela e JSON para verificar os nomes e tipos das colunas.
![20251027080100](https://static-docs.nocobase.com/20251027080100.png)

## Mapeamento de campos
- Nas opções do gráfico, mapeie os campos com base nas colunas do resultado da consulta.
- Por padrão, a primeira coluna é usada como dimensão (eixo X ou categoria) e a segunda coluna como medida (eixo Y ou valor). Portanto, preste atenção à ordem das colunas no SQL:

```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon, -- campo de dimensão na primeira coluna
  SUM(total_amount) AS total -- campo de medida depois
```

![clipboard-image-1761524022](https://static-docs.nocobase.com/clipboard-image-1761524022.png)

## Usar variáveis de contexto
Clique no botão "x" no canto superior direito do editor SQL para escolher variáveis de contexto.

![20251027081752](https://static-docs.nocobase.com/20251027081752.png)

Após confirmar, a expressão da variável é inserida na posição do cursor (ou substitui o texto selecionado) no texto SQL.

Por exemplo, `{{ ctx.user.createdAt }}`. Não adicione aspas extras.

![20251027081957](https://static-docs.nocobase.com/20251027081957.png)

## Mais exemplos
Para mais exemplos, consulte o [aplicativo de demonstração](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) do NocoBase.

**Recomendações:**
- Estabilize os nomes das colunas antes de mapeá-las para gráficos para evitar erros futuros.
- Durante a depuração, defina `LIMIT` para reduzir o número de linhas retornadas e acelerar a pré-visualização.

## Pré-visualizar, salvar e reverter
- Clique em "Executar consulta" para solicitar os dados e atualizar a pré-visualização do gráfico.
- Clique em "Salvar" para persistir o texto SQL atual e as configurações relacionadas no banco de dados.
- Clique em "Cancelar" para reverter para o último estado salvo e descartar as alterações não salvas.