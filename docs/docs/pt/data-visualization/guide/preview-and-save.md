:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Visualizar e Salvar

-   **Visualizar:** Renderiza temporariamente as alterações feitas no painel de configuração no gráfico da página para que você possa verificar o resultado.
-   **Salvar:** Salva permanentemente as alterações do painel de configuração no banco de dados.

## Onde encontrar

![clipboard-image-1761479218](https://static-docs.nocobase.com/clipboard-image-1761479218.png)

-   No modo de configuração visual (Básico), as alterações são aplicadas automaticamente à visualização por padrão.
-   Nos modos SQL e Custom, você pode clicar no botão **Visualizar** à direita para aplicar as alterações à visualização.
-   Um botão **Visualizar** unificado está disponível na parte inferior de todo o painel de configuração.

## Comportamento da visualização

-   A configuração é exibida temporariamente na página, mas não é gravada no banco de dados. Após uma atualização da página ou cancelamento da operação, o resultado da visualização não é mantido.
-   **Debounce** integrado: se várias atualizações forem acionadas em um curto período, apenas a última será executada para evitar requisições frequentes.
-   Clicar em **Visualizar** novamente sobrescreve o resultado da visualização anterior.

## Mensagens de erro

-   Erros de consulta ou falhas de validação: são exibidos na área **Ver dados**.
-   Erros de configuração do gráfico (mapeamento Básico ausente, exceções de JS Custom): são exibidos na área do gráfico ou no console, mantendo a página operável.
-   Para reduzir erros, confirme os nomes das colunas e os tipos de dados em **Ver dados** antes de fazer o mapeamento de campos ou escrever código Custom.

## Salvar e Cancelar

-   **Salvar:** Grava as alterações atuais na configuração do bloco e as aplica imediatamente à página.
-   **Cancelar:** Descarta as alterações não salvas e reverte para o estado salvo anteriormente.
-   **Escopo do salvamento:**
    -   Consulta de dados: Parâmetros do Builder; no modo SQL, o texto SQL também é salvo.
    -   Opções do gráfico: Tipo Básico, mapeamento de campos e propriedades; texto JS Custom.
    -   Eventos de interação: Texto JS e lógica de vinculação dos eventos.
-   Após salvar, o bloco entra em vigor para todos os visitantes (sujeito às permissões da página).

## Fluxo de trabalho recomendado

-   Configure a consulta de dados → Execute a consulta → Verifique os nomes e tipos das colunas em **Ver dados** → Configure as opções do gráfico para mapear os campos principais → Visualize para validar → Salve para aplicar.