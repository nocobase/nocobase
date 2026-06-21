# Validação de Campos
Para garantir a precisão, segurança e consistência das **coleções** de dados, o NocoBase oferece a funcionalidade de validação de campos. Este recurso é dividido em duas partes principais: configuração de regras e aplicação de regras.

## Configuração de Regras

![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

Os campos do sistema NocoBase integram as regras do [Joi](https://joi.dev/api/), com suporte conforme detalhado abaixo:

### Tipo String
Os tipos de string do Joi correspondem aos seguintes tipos de campo no NocoBase: Texto de Linha Única, Texto Longo, Telefone, E-mail, URL, Senha e UUID.
#### Regras Comuns
- Comprimento mínimo
- Comprimento máximo
- Comprimento
- Padrão (Regex)
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

### Tipo Numérico
Os tipos numéricos do Joi correspondem aos seguintes tipos de campo no NocoBase: Inteiro, Número e Porcentagem.
#### Regras Comuns
- Maior que
- Menor que
- Valor máximo
- Valor mínimo
- Múltiplo

#### Inteiro
Além das regras comuns, os campos do tipo inteiro também suportam [validação de inteiro](https://joi.dev/api/?v=17.13.3#numberinteger) e [validação de inteiro não seguro](https://joi.dev/api/?v=17.13.3#numberunsafeenabled).

![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### Número e Porcentagem
Além das regras comuns, os campos de número e porcentagem também suportam [validação de precisão](https://joi.dev/api/?v=17.13.3#numberinteger).

![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### Tipo Data
Os tipos de data do Joi correspondem aos seguintes tipos de campo no NocoBase: Data (com fuso horário), Data (sem fuso horário), Somente Data e Timestamp Unix.

Regras de validação suportadas:
- Maior que
- Menor que
- Valor máximo
- Valor mínimo
- Formato de timestamp
- Obrigatório

### Campos de Relacionamento
Campos de relacionamento suportam apenas a validação de campo obrigatório. É importante notar que a validação de campo obrigatório para campos de relacionamento atualmente não é suportada em cenários de subformulário ou sub-tabela.

![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## Aplicação das Regras de Validação
Após configurar as regras para os campos, as regras de validação correspondentes serão acionadas ao adicionar ou modificar dados.

![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

Quando o campo é usado em um formulário, as regras de validação do campo também aparecem nas configurações de validação do campo. Essas regras ficam em **Regras de validação de campo no lado do servidor** e são exibidas ali como somente leitura. Se precisar alterá-las, edite o campo em Fonte de dados → Configuração da coleção.

Você ainda pode adicionar regras extras para o campo do formulário atual em **Regras de validação no lado do cliente**. Essas regras se aplicam apenas ao componente de campo atual. O resultado final da validação combina **Regras de validação de campo no lado do servidor** e **Regras de validação no lado do cliente**.

As regras de validação também se aplicam a componentes de sub-tabela e sub-formulário:

![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

É importante notar que, em cenários de subformulário ou sub-tabela, a validação de campo obrigatório para campos de relacionamento não é aplicada.

![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Diferenças entre Regras de Validação de Campo no Lado do Servidor e no Lado do Cliente
As regras de validação de campo no lado do servidor e no lado do cliente são configuradas em locais diferentes e têm escopos diferentes.

### Diferenças no Método de Configuração
- **Regras de validação de campo no lado do servidor**: Você define as regras do campo em Fonte de dados → Configuração da coleção. Essas regras são as regras base do campo.
- **Regras de validação no lado do cliente**: Você configura regras extras nas configurações de um campo de formulário. Essas regras afetam apenas o componente de campo atual.

![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)

### Diferenças no Momento de Acionamento da Validação
- **Regras de validação de campo no lado do servidor**: Acionam validação no frontend quando o campo é usado em um formulário e também validam antes da gravação dos dados. Elas também se aplicam a cenários que criam ou atualizam dados, como fluxos de trabalho e importações de dados.
- **Regras de validação no lado do cliente**: Acionam validação no frontend apenas no campo de formulário atual.
- **Exibição das regras**: As regras de validação de campo no lado do servidor são exibidas como regras herdadas e somente leitura. As regras de validação no lado do cliente são exibidas separadamente e podem ser editadas ali.
- **Mensagens de erro**: As regras de validação no lado do cliente suportam mensagens de erro personalizadas, enquanto as regras de validação de campo no lado do servidor atualmente não oferecem suporte a mensagens de erro personalizadas.
