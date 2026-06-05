:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

## Problemas Comuns e Soluções

### 1. Colunas e células vazias em modelos Excel desaparecem na renderização

**Problema:** Em modelos Excel, se uma célula não tiver conteúdo ou formatação, ela pode ser removida durante a renderização, fazendo com que essas células fiquem ausentes no documento final.

**Soluções:**

- **Preencher com cor de fundo:** Aplique uma cor de fundo às células vazias na área desejada para garantir que elas permaneçam visíveis durante o processo de renderização.
- **Inserir espaços:** Insira um caractere de espaço nas células vazias para manter a estrutura da célula, mesmo sem conteúdo real.
- **Definir bordas:** Adicione estilos de borda à tabela para realçar os limites das células e evitar que elas desapareçam durante a renderização.

**Exemplo:**

No modelo Excel, defina um fundo cinza claro para todas as células alvo e insira espaços nas células vazias.

### 2. Células mescladas não são renderizadas corretamente

**Problema:** Ao usar a funcionalidade de loop para gerar tabelas, células mescladas no modelo podem causar resultados de renderização anormais, como a perda do efeito de mesclagem ou o desalinhamento dos dados.

**Soluções:**

- **Evite usar células mescladas:** Tente evitar o uso de células mescladas em tabelas geradas por loop para garantir a renderização correta dos dados.
- **Use "Centralizar entre Seleção":** Se você precisar que o texto seja centralizado horizontalmente em várias células, use o recurso "Centralizar entre Seleção" em vez de mesclar células.
- **Limite as posições das células mescladas:** Se as células mescladas forem necessárias, mescle-as apenas acima ou à direita da tabela, evitando mesclá-las abaixo ou à esquerda para evitar a perda dos efeitos de mesclagem durante a renderização.

### 3. Conteúdo abaixo da área de renderização de loop causa problemas de formatação

**Problema:** Em modelos Excel, se houver outro conteúdo (por exemplo, um resumo do pedido, observações) abaixo de uma área de loop que cresce dinamicamente com base nos itens de dados (por exemplo, detalhes do pedido), durante a renderização, as linhas de dados geradas pelo loop se expandirão para baixo, sobrescrevendo ou empurrando o conteúdo estático abaixo, causando problemas de formatação e sobreposição de conteúdo no documento final.

**Soluções:**

  * **Ajuste o layout, coloque a área de loop na parte inferior:** Este é o método mais recomendado. Coloque a área da tabela que precisa de renderização de loop na parte inferior de toda a planilha. Mova todas as informações que estavam originalmente abaixo dela (resumo, assinaturas, etc.) para acima da área de loop. Dessa forma, os dados do loop podem se expandir livremente para baixo sem afetar nenhum outro elemento.
  * **Reserve linhas em branco suficientes:** Se o conteúdo precisar ser colocado abaixo da área de loop, estime o número máximo de linhas que o loop pode gerar e insira manualmente linhas em branco suficientes como um buffer entre a área de loop e o conteúdo abaixo. No entanto, este método apresenta riscos: se os dados reais excederem o número de linhas estimado, o problema ocorrerá novamente.
  * **Use modelos do Word:** Se os requisitos de layout forem complexos e não puderem ser resolvidos ajustando a estrutura do Excel, considere usar documentos do Word como modelos. As tabelas no Word automaticamente empurram o conteúdo para baixo quando as linhas aumentam, sem problemas de sobreposição de conteúdo, tornando-o mais adequado para a geração de documentos dinâmicos.

**Exemplo:**

**Abordagem incorreta:** Colocar as informações de "Resumo do Pedido" imediatamente abaixo da tabela de "Detalhes do Pedido" que está em loop.
![20250820080712](https://static-docs.nocobase.com/20250820080712.png)

**Abordagem correta 1 (Ajustar layout):** Mova as informações de "Resumo do Pedido" para cima da tabela de "Detalhes do Pedido", fazendo com que a área de loop seja o elemento inferior da página.
![20250820082226](https://static-docs.nocobase.com/20250820082226.png)

**Abordagem correta 2 (Reservar linhas em branco):** Reserve muitas linhas em branco entre "Detalhes do Pedido" e "Resumo do Pedido" para garantir que o conteúdo do loop tenha espaço suficiente para expansão.
![20250820081510](https://static-docs.nocobase.com/20250820081510.png)

**Abordagem correta 3**: Use modelos do Word.

### 4. Mensagens de erro aparecem durante a renderização do modelo

**Problema:** Durante a renderização do modelo, o sistema exibe mensagens de erro, causando falha na renderização.

**Causas Possíveis:**

- **Erros de placeholder:** Os nomes dos placeholders não correspondem aos campos do conjunto de dados ou contêm erros de sintaxe.
- **Dados ausentes:** O conjunto de dados não possui os campos referenciados no modelo.
- **Uso inadequado do formatador:** Os parâmetros do formatador estão incorretos ou os tipos de formatação não são suportados.

**Soluções:**

- **Verifique os placeholders:** Certifique-se de que os nomes dos placeholders no modelo correspondam aos nomes dos campos no conjunto de dados e que a sintaxe esteja correta.
- **Valide o conjunto de dados:** Confirme se o conjunto de dados contém todos os campos referenciados no modelo com os formatos de dados apropriados.
- **Ajuste os formatadores:** Verifique os métodos de uso do formatador, certifique-se de que os parâmetros estão corretos e use os tipos de formatação suportados.

**Exemplo:**

**Modelo incorreto:**
```
Order ID: {d.orderId}
Order Date: {d.orderDate:format('YYYY/MM/DD')}
Total Amount: {d.totalAmount:format('0.00')}
```

**Conjunto de dados:**
```json
{
  "orderId": "A123456789",
  "orderDate": "2025-01-01T10:00:00Z"
  // Campo totalAmount ausente
}
```

**Solução:** Adicione o campo `totalAmount` ao conjunto de dados ou remova a referência a `totalAmount` do modelo.