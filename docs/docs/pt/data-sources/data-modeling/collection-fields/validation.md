:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

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

As regras de validação também se aplicam a componentes de sub-tabela e sub-formulário:

![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

É importante notar que, em cenários de subformulário ou sub-tabela, a validação de campo obrigatório para campos de relacionamento não é aplicada.

![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Diferenças em relação à Validação de Campo no Lado do Cliente
A validação de campo no lado do cliente e no lado do servidor são aplicáveis a diferentes cenários de uso. Existem diferenças significativas na forma como são implementadas e no momento em que as regras são acionadas, por isso precisam ser gerenciadas separadamente.

### Diferenças no Método de Configuração
- **Validação no lado do cliente**: Você configura as regras diretamente nos formulários de edição (como mostrado na imagem abaixo).
- **Validação de campo no lado do servidor**: Você define as regras do campo na **fonte de dados** → Configuração da **coleção**.

![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)

### Diferenças no Momento de Acionamento da Validação
- **Validação no lado do cliente**: É acionada em tempo real enquanto você preenche os campos, exibindo mensagens de erro imediatamente.
- **Validação de campo no lado do servidor**: É realizada no lado do servidor após a submissão dos dados e antes que eles sejam armazenados. As mensagens de erro são retornadas através das respostas da API.
- **Escopo de aplicação**: A validação de campo no lado do servidor não só entra em vigor durante a submissão de formulários, mas também é acionada em todos os cenários que envolvem adição ou modificação de dados, como **fluxos de trabalho** e importação de dados.
- **Mensagens de erro**: A validação no lado do cliente suporta mensagens de erro personalizadas, enquanto a validação no lado do servidor atualmente não oferece suporte a mensagens de erro personalizadas.