:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Usar variáveis de contexto

Com as variáveis de contexto, você pode reutilizar informações da página atual, do usuário, do tempo e dos filtros para renderizar gráficos e permitir a interligação baseada no contexto.

## Onde usar
- Na consulta de dados em modo Builder: selecione variáveis para as condições de filtro.
![clipboard-image-1761486073](https://static-docs.nocobase.com/clipboard-image-1761486073.png)

- Na consulta de dados em modo SQL: escolha variáveis e insira expressões (por exemplo, `{{ ctx.user.id }}`).
![clipboard-image-1761486145](https://static-docs.nocobase.com/clipboard-image-1761486145.png)

- Nas opções de gráfico em modo Custom: escreva expressões JS diretamente.
![clipboard-image-1761486604](https://static-docs.nocobase.com/clipboard-image-1761486604.png)

- Em eventos de interação (por exemplo, clique para abrir um modal de detalhamento e passar dados): escreva expressões JS diretamente.
![clipboard-image-1761486683](https://static-docs.nocobase.com/clipboard-image-1761486683.png)

**Atenção:**
- Não use aspas simples ou duplas em `{{ ... }}`; o sistema fará a vinculação de forma segura com base no tipo da variável (string, número, data/hora, NULL).
- Quando uma variável for `NULL` ou indefinida, trate os valores nulos explicitamente em SQL usando `COALESCE(...)` ou `IS NULL`.