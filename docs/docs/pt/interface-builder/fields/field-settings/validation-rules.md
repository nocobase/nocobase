# Configurar Regras de Validação

## Introdução

As regras de validação servem para garantir que os dados inseridos pelos usuários estejam de acordo com o que é esperado.

## Onde Configurar Regras de Validação de Campo

### Configurar Regras de Validação para Campos da Coleção

A maioria dos campos permite a configuração de regras de validação. Depois de configurar essas regras para um campo, a validação de *backend* é acionada quando os dados são enviados. Diferentes tipos de campos suportam diferentes regras de validação.

- **Campo de data**

  ![20251028225946](https://static-docs.nocobase.com/20251028225946.png)

- **Campo numérico**

  ![20251028230418](https://static-docs.nocobase.com/20251028230418.png)

- **Campo de texto**

  Além de limitar o comprimento do texto, os campos de texto também permitem o uso de expressões regulares personalizadas para uma validação mais detalhada.

  ![20251028230554](https://static-docs.nocobase.com/20251028230554.png)

### Regras de Validação no Lado do Cliente nas Configurações do Campo

As regras de validação configuradas no campo acionam a validação de *frontend*, garantindo que a entrada do usuário esteja em conformidade com as exigências.

Se o campo da coleção correspondente já tiver regras de validação, essas regras aparecerão nas configurações de validação em **Regras de validação de campo no lado do servidor**. Elas são herdadas da configuração do campo da fonte de dados e são somente leitura aqui. Se precisar alterá-las, edite o campo da coleção em Fonte de dados → Configuração da coleção.

As regras adicionadas em **Regras de validação no lado do cliente** se aplicam apenas ao componente de campo atual. Elas não alteram a configuração do campo da coleção. Quando os dois grupos existem, o NocoBase aplica as regras de campo herdadas e as regras de validação no lado do cliente em conjunto.

![20251028230105](https://static-docs.nocobase.com/20251028230105.png)

![20251028230255](https://static-docs.nocobase.com/20251028230255.png)

**Campos de texto** também suportam validação de *regex* personalizada para atender a requisitos de formato específicos.

![20251028230903](https://static-docs.nocobase.com/20251028230903.png)
