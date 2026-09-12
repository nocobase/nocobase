# Capítulo 2: Modelagem de Dados — Duas Tabelas Resolvem o Sistema de Tickets

No capítulo anterior, instalamos o NocoBase e conhecemos a interface. Agora vamos construir o esqueleto do sistema de tickets — definindo o **modelo de dados**.

Neste capítulo vamos criar duas [tabelas de dados](/data-sources/data-modeling/collection): tickets e categorias, configurar [tipos de campo](/data-sources/data-modeling/collection-fields) (texto de uma linha, lista suspensa, relação [muitos-para-um](/data-sources/data-modeling/collection-fields/associations/m2o), etc.) e estabelecer relacionamentos entre as tabelas. O modelo de dados é a fundação do sistema: pense bem em quais dados armazenar e quais relações eles têm — assim, depois é fácil construir a interface e configurar permissões.


## 2.1 O Que São Tabelas e Campos

Se você já usou Excel, vai ser fácil entender tabelas:

| Conceito do Excel | Conceito do NocoBase | Descrição |
|------------|--------------|------|
| Planilha | Tabela (Collection) | Container para um tipo de dados |
| Cabeçalho de coluna | Campo (Field) | Descreve a propriedade do dado |
| Cada linha | Registro (Record) | Um dado específico |

![02-data-modeling-2026-03-11-08-32-41](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-32-41.png)

Por exemplo, a "tabela de tickets" que vamos criar é como uma planilha do Excel — cada coluna é um campo (título, status, prioridade, etc.) e cada linha é um registro de ticket.

Mas o NocoBase é muito mais poderoso que o Excel. Ele suporta vários **tipos de tabela**, cada um com capacidades próprias:

| Tipo de tabela | Cenário adequado | Exemplos |
|--------|---------|------|
| **Tabela comum** | Maioria dos dados de negócio | Tickets, pedidos, clientes |
| **Tabela em árvore** | Dados com hierarquia | Diretório de categorias, organograma |
| Tabela de calendário | Eventos por data | Reuniões, escala |
| Tabela de arquivos | Gerenciamento de anexos | Documentos, imagens |

Hoje vamos usar a **tabela comum** e a **tabela em árvore**. Os outros tipos vamos aprender quando precisar.

**Entrar no gerenciamento de fontes de dados**: clique no ícone **«Gerenciamento de fontes de dados»** no canto inferior esquerdo (ícone de banco de dados ao lado da engrenagem). Você verá a «[Fonte de dados principal](/data-sources)» — é onde criamos todas as nossas tabelas.

![02-data-modeling-2026-03-11-08-35-08](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-35-08.png)


## 2.2 Criando a Tabela Principal: Tickets

Vamos direto ao ponto: criar primeiro o coração do sistema — a tabela de tickets.

### Criar a tabela

1. Na página de gerenciamento de fontes de dados, clique em **Fonte de dados principal** para entrar

![02-data-modeling-2026-03-11-08-36-06](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-36-06.png)

2. Clique em **«Criar tabela de dados»**, escolha **«Tabela comum»**

![02-data-modeling-2026-03-11-08-38-52](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-38-52.png)

3. Nome da tabela: `tickets`, título da tabela: `Tickets`

![02-data-modeling-2026-03-11-08-40-34](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-40-34.png)

Ao criar a tabela, o sistema marca automaticamente um conjunto de **campos do sistema**, que registram metadados de cada registro:

| Campo | Descrição |
|------|------|
| ID | Chave primária, identificador único distribuído |
| Data de criação | Data em que o registro foi criado |
| Criado por | Quem criou esse registro |
| Última data de modificação | Data da última atualização |
| Última pessoa que modificou | Usuário que fez a última atualização |

Esses campos do sistema podem ficar com os valores padrão; não precisam ser gerenciados manualmente. Se algum cenário não precisar deles, você também pode desmarcar.

### Adicionar campos básicos

Tabela criada, agora vamos adicionar campos. Clique em **«Configurar campos (Configure fields)»** da tabela de tickets — você verá que os campos de sistema padrão já estão na lista.

![02-data-modeling-2026-03-11-08-58-48](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-58-48.png)

![02-data-modeling-2026-03-11-08-59-47](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-59-47.png)

Clique no botão **«Adicionar campo (Add field)»** no canto superior direito — uma lista suspensa de tipos de campo se abrirá. Selecione o tipo de campo que deseja adicionar.

![02-data-modeling-2026-03-11-09-00-22](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-00-22.png)

Vamos primeiro adicionar os campos próprios do ticket; campos de relacionamento serão adicionados depois.

**1. Título (Texto de uma linha)**

Cada ticket precisa de um título curto que resuma o problema. Clique em **«Adicionar campo»** → escolha **[«Texto de uma linha»](/data-sources/data-modeling/collection-fields/basic/input)**:

![02-data-modeling-2026-03-11-09-01-00](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-01-00.png)

- Nome do campo: `title`, título do campo: `Título`
- Clique em **«Configurar regras de validação»**, adicione uma regra **«Obrigatório»**

![02-data-modeling-2026-03-11-09-02-40](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-02-40.png)

**2. Descrição (Markdown(Vditor))**

Usado para descrever o problema em detalhes, com suporte a formatação, facilitando inserir imagens e código. Em «Adicionar campo» → categoria «Media» há três opções:

| Tipo de campo | Características |
|---------|------|
| Markdown | Markdown básico, estilos simples |
| Rich Text | Texto rico, estilos simples + upload de anexo |
| **Markdown(Vditor)** | Mais completo, suporta WYSIWYG, renderização instantânea e edição de código-fonte |

Vamos escolher **Markdown(Vditor)**.

![02-data-modeling-2026-03-11-09-09-58](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-09-58.png)

- Nome do campo: `description`, título do campo: `Descrição`

![02-data-modeling-2026-03-11-09-10-50](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-10-50.png)

**3. Status (Lista suspensa - Seleção única)**

![02-data-modeling-2026-03-11-09-12-00](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-12-00.png)
Do envio à conclusão, um ticket precisa de um status para acompanhar o progresso.

- Nome do campo: `status`, título do campo: `Status`
- Adicionar opções (cada opção precisa de «valor da opção» e «rótulo da opção», a cor é opcional):

| Valor da opção | Rótulo da opção | Cor |
|--------|---------|------|
| pending | Pendente | Orange (Crepúsculo) |
| in_progress | Em processamento | Blue (Azul aurora) |
| completed | Concluído | Green (Verde aurora) |

![02-data-modeling-2026-03-11-09-17-44](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-17-44.png)

Preencha as opções e salve primeiro. Depois clique em **«Editar (Edit)»** desse campo novamente — aí você vai poder selecionar **«Pendente»** em «Valor padrão».

![02-data-modeling-2026-03-11-09-20-28](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-20-28.png)

![02-data-modeling-2026-03-11-09-22-34](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-22-34.png)

> Na primeira criação ainda não há dados de opção, então não dá pra selecionar valor padrão — precisa salvar e voltar para configurar.

> Por que usar lista suspensa de seleção única? Porque o status são alguns valores fixos, e a [lista suspensa](/data-sources/data-modeling/collection-fields/choices/select) impede que o usuário preencha qualquer coisa, garantindo dados padronizados.

**4. Prioridade (Lista suspensa - Seleção única)**

Para diferenciar a urgência dos tickets, ajudando os atendentes a ordenar por prioridade.

- Nome do campo: `priority`, título do campo: `Prioridade`
- Adicionar opções:

| Valor da opção | Rótulo da opção | Cor |
|--------|---------|------|
| low | Baixa | |
| medium | Média | |
| high | Alta | Orange (Crepúsculo) |
| urgent | Urgente | Red (Tom de noite) |

Até aqui, a tabela de tickets tem 4 campos básicos. Mas — o ticket deveria ter uma "categoria", certo? Tipo "problema de rede" ou "falha de software"?

Se fizermos a categoria como uma lista suspensa, claro que dá. Mas você logo perceberá: as categorias podem ter subcategorias ("problema de hardware" pode ter "monitor", "teclado", "impressora") — a lista suspensa não basta.

Precisamos de **outra tabela** dedicada a gerenciar categorias. E essa tabela é melhor montada com a **tabela em árvore** do NocoBase.


## 2.3 Criando a Tabela em Árvore de Categorias: Categorias Com Hierarquia

### O que é uma tabela em árvore

A tabela em árvore é um tipo especial de tabela de dados, com **relação pai-filho** embutida — cada registro pode ter um "nó pai". Isso é perfeito para dados hierárquicos:

```
Problema de hardware       ← Categoria nível 1
├── Monitor                ← Categoria nível 2
├── Teclado e mouse
└── Impressora
Falha de software
├── Software de escritório
└── Problema de sistema
Problema de rede
Permissão de conta
```

Se você usar uma tabela comum, precisa criar manualmente um campo "categoria pai" para implementar essa relação. Mas a **tabela em árvore faz isso automaticamente para você**, e ainda suporta exibição em árvore, adição de subregistros e outras operações — bem mais fácil.

### Criar a tabela

1. Volte para o gerenciamento de fontes de dados, clique em **«Criar tabela de dados»**
2. Desta vez escolha **«Tabela em árvore»** (não tabela comum!)
![02-data-modeling-2026-03-11-09-26-07](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-26-07.png)

3. Nome da tabela: `categories`, título da tabela: `Categorias de Tickets`

![02-data-modeling-2026-03-11-09-26-55](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-26-55.png)

> Após a criação, além dos campos do sistema, vão aparecer automaticamente dois campos de relação **«Parent»** e **«Children»** — esse é o poder especial da tabela em árvore. Pelo Parent, você acessa o nó pai; pelos Children, você acessa todos os nós filhos. Não precisa adicionar manualmente.

![02-data-modeling-2026-03-11-09-27-40](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-27-40.png)

### Adicionar campos

Clique em **«Configurar campos»** para entrar na lista de campos. Você pode ver os campos do sistema e os campos Parent e Children gerados automaticamente.
Clique em **«Adicionar campo»** no canto superior direito:

**Campo 1: Nome da categoria**

1. Escolha **«Texto de uma linha»**
2. Nome do campo: `name`, título do campo: `Nome da categoria`
3. Clique em **«Configurar regras de validação»**, adicione regra **«Obrigatório»**

**Campo 2: Cor**

1. Escolha **«Cor»**
2. Nome do campo: `color`, título do campo: `Cor`

![02-data-modeling-2026-03-11-09-28-59](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-28-59.png)

O campo de cor permite que cada categoria tenha sua cor identificadora — isso ajuda a visualização na interface.

![02-data-modeling-2026-03-11-09-29-23](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-29-23.png)

Pronto — os campos básicos das duas tabelas estão configurados. Agora vamos relacioná-las.


## 2.4 De Volta à Tabela de Tickets: Adicionando Campos de Relacionamento

> **Os campos de relacionamento podem parecer abstratos no primeiro contato.** Se você achar difícil de entender, pode pular para o [Capítulo 3: Construindo Páginas](./03-building-pages) e sentir como os dados são exibidos nas operações de página real, e depois voltar para adicionar os campos de relacionamento.

Os tickets precisam ser relacionados a categoria, criador e atendente. Esse tipo de campo é chamado de **campo de relacionamento** — ele não armazena diretamente um texto como o "título", mas armazena o ID de um registro de outra tabela, e através desse ID encontra o registro correspondente.

Vejamos com um ticket específico — à esquerda estão as várias propriedades do ticket, e o que está armazenado em "categoria" e "criador" não é texto, mas um ID. O sistema, através desse ID, encontra exatamente o registro correspondente na tabela à direita:


![02-data-modeling-2026-03-12-00-50-10](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-00-50-10.png)

O que você vê na interface são os nomes ("Problema de rede", "Zé"), mas no fundo é uma associação por ID. **Vários tickets podem apontar para a mesma categoria ou para o mesmo usuário** — esse tipo de relação é chamado [**muitos-para-um**](/data-sources/data-modeling/collection-fields/associations/m2o).

### Adicionar campos de relacionamento

Volte para «Configurar campos» da tabela de tickets → «Adicionar campo», escolha **«Muitos-para-um»**.
![02-data-modeling-2026-03-12-00-52-39](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-00-52-39.png)

Ao criar, você verá estas opções de configuração:

| Opção | Descrição | Como preencher |
|--------|------|--------|
| Tabela de origem | Tabela atual (preenchida automaticamente) | Não mexa |
| **Tabela de destino** | Em qual tabela queremos relacionar | Escolha a tabela correspondente |
| **Chave estrangeira** | Nome da coluna de relacionamento na tabela atual | Coloque um nome significativo |
| Campo identificador da tabela de destino | Por padrão `id` | Mantenha o padrão |
| ON DELETE | O que fazer quando o registro de destino for excluído | Mantenha o padrão |

![02-data-modeling-2026-03-12-00-58-38](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-00-58-38.png)

> A chave estrangeira gera um nome aleatório por padrão (como `f_xxxxx`). Recomenda-se mudar para um nome significativo — facilita a manutenção depois. Use letras minúsculas com underscore (como `category_id`), evite mistura de maiúsculas e minúsculas.

Adicione três campos seguindo este modelo:

**5. Categoria → Tabela de Categorias de Tickets**

- Título do campo: `Categoria`
- Tabela de destino: escolha **«Categorias de Tickets»** (se não estiver na lista, basta digitar o nome da tabela e ela é criada automaticamente)
- Chave estrangeira: `category_id`

**6. Criador → Tabela de Usuários**

Registra quem criou esse ticket. O NocoBase já tem uma tabela de usuários embutida, é só relacionar.

- Título do campo: `Criador`
- Tabela de destino: escolha **«Usuário»**
- Chave estrangeira: `submitter_id`
![02-data-modeling-2026-03-12-01-00-09](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-01-00-09.png)

**7. Atendente → Tabela de Usuários**

Registra quem está responsável por esse ticket.

- Título do campo: `Atendente`
- Tabela de destino: escolha **«Usuário»**
- Chave estrangeira: `assignee_id`

![02-data-modeling-2026-03-12-01-00-22](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-01-00-22.png)


## 2.5 Visão Geral do Modelo de Dados

Vamos revisar o modelo de dados completo:

![02-data-modeling-2026-03-16-00-30-35](https://static-docs.nocobase.com/02-data-modeling-2026-03-16-00-30-35.png)

`}o--||` representa uma relação muitos-para-um: à esquerda "muitos", à direita "um".


## Resumo

Neste capítulo concluímos a modelagem de dados — o esqueleto do sistema de tickets:

1. **Tabela de tickets** (tickets): 4 campos básicos + 3 campos de relacionamento, criada como **tabela comum**
2. **Tabela de categorias de tickets** (categories): 2 campos personalizados + Parent/Children automáticos, criada como **tabela em árvore**, com suporte natural a categorias hierárquicas

Aprendemos vários conceitos importantes:

- **Tabela (Collection)** = container para um tipo de dados
- **Tipo de tabela** = escolha o tipo certo para cada cenário (tabela comum, tabela em árvore...)
- **Campo (Field)** = propriedade do dado, criado em «Configurar campos» → «Adicionar campo»
- **Campos do sistema** = ID, data de criação, criado por, etc., marcados automaticamente ao criar a tabela
- **Campo de relacionamento (muitos-para-um)** = aponta para um registro de outra tabela, estabelece associação entre tabelas

> Você pode ter notado que nos próximos prints já aparecem dados — esses dados de teste foram inseridos antecipadamente para fins de demonstração, sem pressa. No NocoBase, criar, editar e excluir dados é feito pelas páginas frontend. No Capítulo 3 vamos construir tabelas para exibir dados, e no Capítulo 4 vamos construir formulários para inserir dados, passo a passo.


## Prévia do Próximo Capítulo

O esqueleto está pronto, mas só temos tabelas vazias. No próximo capítulo, vamos construir páginas para que os dados realmente apareçam.

Até o próximo capítulo!

## Recursos Relacionados

- [Visão geral das fontes de dados](/data-sources) — conceitos centrais da modelagem de dados do NocoBase
- [Campos de tabelas](/data-sources/data-modeling/collection-fields) — explicação de todos os tipos de campo
- [Relação muitos-para-um](/data-sources/data-modeling/collection-fields/associations/m2o) — configuração da relação de associação
