---
title: "Validação de campos"
description: "Regras de validação de campos: regras de configuração e validação baseadas em Joi, com suporte a comprimento mínimo/máximo, obrigatoriedade e outros para tipos como texto, número e data."
keywords: "validação de campos, verificação de campos,Joi,regras de validação,regras de configuração,NocoBase"
---

# Validação de campos
Para garantir a precisão, a segurança e a consistência dos dados, o NocoBase fornece um recurso de validação de campos. Esse recurso é dividido principalmente em duas partes: regras de configuração e regras de validação.

## Regras de configuração
![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

Os campos do sistema NocoBase integram regras do [Joi](https://joi.dev/api/), com o seguinte suporte:

### Tipo string
Os tipos de campo do NocoBase correspondentes ao tipo string do Joi incluem: texto de linha única, texto multilinha, número de celular, e-mail, URL, senha e UUID.
#### Regras gerais
- Comprimento mínimo
- Comprimento máximo
- Comprimento
- Expressão regular
- Obrigatório

#### E-mail
![20250819192011](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192011.png)
[Ver mais opções](https://joi.dev/api/?v=17.13.3#stringemailoptions)

#### URL
![20250819192409](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192409.png)
[Ver mais opções](https://joi.dev/api/?v=17.13.3#stringurioptions)

#### UUID
![20250819192731](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192731.png)
[Ver mais opções](https://joi.dev/api/?v=17.13.3#stringguid---aliases-uuid)

### Tipo número
Os tipos de campo do NocoBase correspondentes ao tipo número do Joi incluem: inteiro, número e porcentagem.
#### Regras gerais
- Maior que
- Menor que
- Valor máximo
- Valor mínimo
- Múltiplo inteiro

#### Inteiro
Além das regras gerais, os campos inteiros também oferecem suporte à [validação de inteiros](https://joi.dev/api/?v=17.13.3#numberinteger) e à [validação de inteiros inseguros](https://joi.dev/api/?v=17.13.3#numberunsafeenabled).
![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### Número e porcentagem
Além das regras gerais, os campos de número e porcentagem também oferecem suporte à [validação de precisão](https://joi.dev/api/?v=17.13.3#numberinteger).
![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### Tipo data
Os tipos de campo do NocoBase correspondentes ao tipo data do Joi incluem: data (com fuso horário), data (sem fuso horário), somente data e carimbo de data/hora Unix.

Regras de validação compatíveis:
- Maior que
- Menor que
- Valor máximo
- Valor mínimo
- Validação do formato do carimbo de data/hora
- Obrigatório

### Campos de relacionamento
Os campos de relacionamento oferecem suporte apenas à validação de obrigatoriedade. Observe que a validação de obrigatoriedade dos campos de relacionamento ainda não é compatível com cenários de subformulários ou subgrids.
![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## Aplicação das regras de validação
Depois de configurar as regras do campo, as regras de validação correspondentes serão acionadas ao adicionar ou modificar dados.
![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

Quando um campo é usado em um formulário, as regras de validação do campo também são exibidas nas configurações de validação do campo. Essas regras aparecem em «Regras de validação de campos do servidor» e são somente leitura nessa seção. Para modificar essas regras, volte a «Configuração da fonte de dados / tabela de dados» e edite o campo.

Você ainda pode adicionar regras extras ao campo do formulário atual em «Regras de validação do cliente». Essas regras afetam apenas o componente do campo atual. As regras de validação efetivas finais serão combinadas entre «Regras de validação de campos do servidor» e «Regras de validação do cliente».

As regras de validação também se aplicam aos componentes de subgrid e subformulário:
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Observe que, em cenários de subformulário ou subgrid, a validação de obrigatoriedade dos campos de relacionamento ainda não entra em vigor.
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Diferenças entre as regras de validação de campos do servidor e as regras de validação do cliente
As regras de validação de campos do servidor e as regras de validação do cliente são configuradas em locais diferentes e também têm escopos de aplicação distintos.

### Diferenças na configuração
- **Regras de validação de campos do servidor**: definem-se as regras do campo em «Configuração da fonte de dados / tabela de dados». Essas regras são as regras básicas do campo
- **Regras de validação do cliente**: adicionam-se regras extras nas configurações do campo do formulário. Essas regras afetam apenas o componente do campo atual
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)


### Diferenças no momento de acionamento da validação
- **Regras de validação de campos do servidor**: quando o campo é usado em um formulário, a validação no frontend é acionada, e a validação também ocorre antes da gravação dos dados. Essas regras também são aplicadas em cenários de adição ou modificação de dados, como fluxos de trabalho e importação de dados
- **Regras de validação do cliente**: a validação no frontend é acionada apenas no campo do formulário atual
- **Exibição das regras**: as regras de validação de campos do servidor são exibidas como regras herdadas e somente leitura. As regras de validação do cliente são exibidas separadamente e podem ser editadas nessa seção
- **Mensagens de erro**: as regras de validação do cliente permitem mensagens de erro personalizadas; as regras de validação de campos do servidor ainda não permitem mensagens de erro personalizadas
