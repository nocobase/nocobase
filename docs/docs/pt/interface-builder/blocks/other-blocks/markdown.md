:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Bloco Markdown

## Introdução

O bloco Markdown pode ser usado sem a necessidade de vincular a uma **fonte de dados**. Ele utiliza a sintaxe Markdown para definir o conteúdo do texto e é ideal para exibir texto formatado.

## Adicionar Bloco

Você pode adicionar um bloco Markdown a uma página ou a um pop-up.

![20251026230916](https://static-docs.nocobase.com/20251026230916.png)

Você também pode adicionar um bloco Markdown inline (inline-block) dentro de blocos de Formulário e de Detalhes.

![20251026231002](https://static-docs.nocobase.com/20251026231002.png)

## Motor de Template

Ele utiliza o **[motor de template Liquid](https://liquidjs.com/tags/overview.html)** para oferecer recursos de renderização de template poderosos e flexíveis, permitindo que o conteúdo seja gerado dinamicamente e exibido de forma personalizada. Com o motor de template, você pode:

- **Interpolação Dinâmica**: Use placeholders no template para referenciar variáveis, por exemplo, `{{ ctx.user.userName }}` é automaticamente substituído pelo nome de usuário correspondente.
- **Renderização Condicional**: Suporta declarações condicionais (`{% if %}...{% else %}`), exibindo conteúdo diferente com base em diferentes estados dos dados.
- **Looping**: Use `{% for item in list %}...{% endfor %}` para iterar sobre arrays ou **coleções** e gerar listas, tabelas ou módulos repetitivos.
- **Filtros Integrados**: Oferece um conjunto rico de filtros (como `upcase`, `downcase`, `date`, `truncate`, etc.) para formatar e processar dados.
- **Extensibilidade**: Suporta variáveis e funções personalizadas, tornando a lógica do template reutilizável e de fácil manutenção.
- **Segurança e Isolamento**: A renderização do template é executada em um ambiente sandbox, evitando a execução direta de código perigoso e aumentando a segurança.

Com o motor de template Liquid, desenvolvedores e criadores de conteúdo podem **facilmente obter exibição de conteúdo dinâmico, geração de documentos personalizados e renderização de templates para estruturas de dados complexas**, melhorando significativamente a eficiência e a flexibilidade.

## Usando Variáveis

O Markdown em uma página suporta variáveis de sistema comuns (como usuário atual, papel atual, etc.).

![20251029203252](https://static-docs.nocobase.com/20251029203252.png)

Já o Markdown em um pop-up de ação de linha de bloco (ou subpágina) suporta mais variáveis de contexto de dados (como registro atual, registro atual do pop-up, etc.).

![20251029203400](https://static-docs.nocobase.com/20251029203400.png)

## Código QR

Códigos QR podem ser configurados no Markdown.

![20251026230019](https://static-docs.nocobase.com/20251026230019.png)

```html
<qr-code value="https://www.nocobase.com/" type="svg"></qr-code>
```