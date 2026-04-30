# Uso de Variáveis em Templates Markdown

Bem-vindos a este tutorial! Nesta seção, vamos passo a passo aprender como usar Markdown e o engine de templates Handlebars para exibir conteúdo dinâmico. Em «O Uso Mágico do Bloco Markdown», você já conhece a sintaxe básica, formas de criação e preenchimento com variáveis. Agora vamos nos aprofundar em usos avançados de variáveis em templates.

## 1 Introdução ao Engine de Templates [Handlebars](https://docs-cn.nocobase.com/handbook/template-handlebars)

Após criar um bloco Markdown, nas configurações no canto superior direito você verá a opção «Engine de templates», por padrão Handlebars. O Handlbars te ajuda a renderizar dinamicamente o conteúdo da página com base em condições, fazendo o Markdown também responder a mudanças.

![Diagrama do engine de templates](https://static-docs.nocobase.com/20250304011925.png)

### 1.1 O Que o Handlebars Faz

Embora o Markdown nativo só suporte conteúdo estático, com o Handlebars você pode alternar dinamicamente o texto e o estilo exibidos com base em condições (como status, números ou opções). Assim, mesmo em cenários de negócio voláteis, sua página exibe sempre as informações corretas.

## 2 Cenários Práticos

Agora vamos ver alguns cenários úteis e implementar suas funcionalidades passo a passo.

### 2.1 Tratar Status de Pedidos

Em um Demo Online, frequentemente precisamos exibir mensagens diferentes conforme o status do pedido. Suponha que sua tabela de pedidos tenha um campo de status com os seguintes valores:

![Campo de status do pedido](https://static-docs.nocobase.com/20250304091420.png)

Aqui o conteúdo correspondente aos 4 status:


| Rótulo da opção  | Valor | Conteúdo a exibir                                                |
| ---------------- | ----- | ---------------------------------------------------------------- |
| Pending Approval | 1     | Pedido enviado, aguardando aprovação interna.                    |
| Pending Payment  | 2     | Aguardando pagamento do cliente. Acompanhe o status do pedido.   |
| Paid             | 3     | Pagamento confirmado, prossiga para o tratamento posterior. O consultor designado entrará em contato em até 1 hora. |
| Rejected         | 4     | Pedido não aprovado. Se necessário, revise e reenvie.            |

Na página, conseguimos capturar o valor do status do pedido, e então exibir mensagens diferentes dinamicamente. Vamos detalhar como usar a sintaxe if, else e else if para implementar isso.

#### 2.1.1 Sintaxe if

Use a condição if para exibir conteúdo quando a condição é satisfeita. Por exemplo:

```
{{#if condição}}
  <p>resultado a exibir</p>
{{/if}}
```

A «condição» deve seguir a sintaxe Handlebars (eq, gt, lt, etc.). Tente este exemplo simples:

```
{{#if (eq 1 1)}}
  <p>Resultado: 1 = 1</p>
{{/if}}
```

Veja o efeito na imagem:

![Exemplo if 1](https://static-docs.nocobase.com/20250305115416.png)
![Exemplo if 2](https://static-docs.nocobase.com/20250305115434.png)

#### 2.1.2 Sintaxe else

Quando a condição não é satisfeita, use else para indicar conteúdo alternativo. Por exemplo:

```
{{#if (eq 1 2)}}
  <p>Resultado: 1 = 2</p>
{{else}}
  <p>Resultado: 1 ≠ 2</p>
{{/if}}
```

Efeito:

![Exemplo else](https://static-docs.nocobase.com/20250305115524.png)

#### 2.1.3 Avaliações de múltiplas condições

Se você quer avaliar várias condições, use else if. Exemplo:

```
{{#if (eq 1 7)}}
  <p>Resultado: 1 = 7</p>
{{else if (eq 1 5)}}
  <p>Resultado: 1 = 5</p>
{{else if (eq 1 4)}}
  <p>Resultado: 1 = 4</p>
{{else}}
  <p>Resultado: 1 ≠ 7 ≠ 5 ≠ 3</p>
{{/if}}
```

Imagem correspondente:

![Múltiplas condições](https://static-docs.nocobase.com/20250305115719.png)

### 2.2 Demonstração de Efeito

Após configurar o status do pedido, a página alterna a exibição dinamicamente conforme o status. Veja:

![Efeito dinâmico do status do pedido](https://static-docs.nocobase.com/202503040942-handlebar1.gif)

O código da página é o seguinte:

```
{{#if order.status}}
  <div>
    {{#if (eq order.status "1")}}
      <span style="color: orange;">⏳ Pending Approval</span>
      <p>Pedido enviado, aguardando aprovação interna.</p>
    {{else if (eq order.status "2")}}
      <span style="color: #1890ff;">💳 Pending Payment</span>
      <p>Aguardando pagamento do cliente. Acompanhe o status do pedido.</p>
    {{else if (eq order.status "3")}}
      <span style="color: #52c41a;">✔ Paid</span>
      <p>Pagamento confirmado, prossiga para o tratamento posterior. O consultor designado entrará em contato em até 1 hora.</p>
    {{else if (eq order.status "4")}}
      <span style="color: #f5222d;">✖ Rejected</span>
      <p>Pedido não aprovado. Se necessário, revise e reenvie.</p>
    {{/if}}
  </div>
{{else}}
  <p class="empty-state">Nenhum pedido pendente.</p>
{{/if}}
```

Tente alternar o status do pedido e ver se o conteúdo da página atualiza, validando seu código.

### 2.3 Exibir Detalhes do Pedido

Além da exibição de status, exibir os detalhes do pedido (como lista de produtos) é uma necessidade comum. A seguir, usamos a sintaxe each para implementar isso.

#### 2.3.1 Apresentação básica da sintaxe each

each é usado para iterar uma lista. Por exemplo, para um array [1,2,3]:

```
{{#each lista}}
  <p>Resultado: {{this}}</p>
  <p>Índice: {{@index}}</p>
{{/each}}
```

No loop, `{{this}}` representa o elemento atual e `{{@index}}` o índice atual.

#### 2.3.2 Exemplo de detalhes de produtos

Se você precisa exibir todas as informações de produto de um pedido, pode usar:

```
{{#each $nRecord.order_items}}
    <p>{{@index}}</p>
    <p>{{this.id}}</p>
    <p>{{this.price}}</p>
    <p>{{this.quantity}}</p>
    <p>{{this.product.name}}</p>
---
{{/each}}
```

Se descobrir que os dados não aparecem na página, garanta que o campo de itens do pedido está sendo exibido corretamente; do contrário, o sistema considera esses dados redundantes e não consulta.
![20250305122543_handlebar_each](https://static-docs.nocobase.com/20250305122543_handlebar_each.gif)

Você pode notar que o nome do objeto produto (product.name) não é exibido — pelo mesmo motivo de antes, precisamos exibir também o objeto produto.
![20250305122543_each2](https://static-docs.nocobase.com/20250305122543_each2.gif)

Após exibir, definimos uma regra de vinculação para esconder esse campo de relacionamento.
![20250305122543_hidden_each](https://static-docs.nocobase.com/20250305122543_hidden_each.gif)

### 2.4 Resultado Final: Lista de Produtos do Pedido

Após esses passos, você terá implementado um template completo de lista de produtos do pedido. Veja o código:

```
### Lista de produtos do pedido

{{#if $nRecord.order_items}}
  <div class="cart-summary">Total: {{$nRecord.order_items.length}} item(s), Preço total: ¥{{$nRecord.total}}</div>
  
  <table>
    <thead>
      <tr>
        <th>Nº</th>
        <th>Nome do produto</th>
        <th>Preço unit.</th>
        <th>Quantidade</th>
        <th>Subtotal</th>
      </tr>
    </thead>
    <tbody>
      {{#each $nRecord.order_items}}
        <tr style="{{#if this.out_of_stock}}color: red;{{/if}}">
          <td>{{@index}}</td>
          <td>{{this.product.name}}</td>
          <td>¥{{this.price}}</td>
          <td>{{this.quantity}}</td>
          <td>¥{{multiply this.price this.quantity}}</td>
          <td>
            {{#if this.out_of_stock}}
              <span>Sem estoque</span>
            {{else if this.low_stock}}
              <span style="color:orange;">Estoque baixo</span>
            {{/if}}
          </td>
        </tr>
      {{/each}}
    </tbody>
  </table>
{{else}}
  <p>Pedido vazio</p>
{{/if}}
```

Ao executar, você verá:

![Efeito da lista de produtos do pedido](https://static-docs.nocobase.com/20250305124125.png)

Para mostrar melhor a flexibilidade do Handlebars, adicionamos os campos «sem estoque» (out_of_stock) e «estoque baixo» (low_stock) nos detalhes do pedido:

- Quando out_of_stock é true, exibe «Sem estoque» e a linha do produto vira vermelha.
- Quando low_stock é true, à direita aparece «Estoque baixo» em laranja.

![Efeito extra: sem estoque e estoque baixo](https://static-docs.nocobase.com/20250305130258.png)

## 3 Resumo e Sugestões

Com a explicação acima, você aprendeu a usar o Handlebars para renderizar dinamicamente templates Markdown, incluindo as sintaxes if/else e each. No desenvolvimento prático, para lógicas mais complexas, recomenda-se combinar com regras de vinculação, campos de cálculo, workflow ou nó de script para aumentar a flexibilidade e extensibilidade.

Esperamos que você consiga, com prática, dominar essas técnicas e aplicá-las com flexibilidade nos seus projetos. Continue se esforçando, explore mais possibilidades!

---

Se encontrar qualquer problema durante o processo, sinta-se à vontade para conversar na [comunidade NocoBase](https://forum.nocobase.com) ou consultar a [documentação oficial](https://docs-cn.nocobase.com). Esperamos que este guia possa ajudar você a implementar a revisão de cadastro de usuário conforme suas necessidades reais e estender flexivelmente. Bom uso e sucesso no projeto!
