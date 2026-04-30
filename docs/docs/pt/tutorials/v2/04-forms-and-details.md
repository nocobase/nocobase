# Capítulo 4: Formulários e Detalhes — Inserção e Exibição em Um Só Passo

No capítulo anterior, montamos a lista de tickets e usamos um formulário simplificado para inserir dados de teste. Neste capítulo vamos **aperfeiçoar a experiência do formulário** — otimizar o layout dos campos do [bloco de formulário](/interface-builder/blocks/data-blocks/form), adicionar [bloco de detalhes](/interface-builder/blocks/data-blocks/details), configurar [regras de vinculação](/interface-builder/linkage-rules) e ainda usar o [histórico de mudanças](https://docs.nocobase.com/cn/record-history/) para acompanhar cada modificação em tickets.

:::tip
A funcionalidade de «[Histórico de Registros](https://docs.nocobase.com/cn/record-history/)» da seção 4.4 deste capítulo está incluída na [Versão Profissional](https://www.nocobase.com/cn/commercial). Pular essa seção não afeta o aprendizado dos capítulos seguintes.
:::

## 4.1 Aperfeiçoar o Formulário de Novo Ticket

No capítulo anterior, criamos rapidamente um formulário funcional de novo ticket. Agora vamos aperfeiçoá-lo — ajustar a ordem dos campos, definir valores padrão, otimizar o layout. Se você pulou a parte do formulário rápido do capítulo anterior, sem problema, vamos começar do zero aqui.

### Adicionar o botão de ação «Adicionar»

1. Garanta que está no modo UI Editor (interruptor no canto superior direito ligado).
2. Entre na página «Lista de Tickets» e clique em **«[Ações](/interface-builder/actions) (Actions)»** acima do bloco de tabela.
3. Marque o botão de ação **«Adicionar»**.
4. O botão «Adicionar» aparece acima da tabela; ao clicar, abre um [popup](/interface-builder/actions/pop-up).

![04-forms-and-details-2026-03-13-09-43-54](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-09-43-54.png)

### Configurar o formulário no popup

1. Clique no botão «Adicionar», o popup abre.
2. No popup clique em **«Criar [bloco](/interface-builder/blocks) (Add block) → bloco de dados → Formulário (Adicionar)»**.
3. Escolha **«[Tabela](/data-sources/data-modeling/collection) atual (Current collection)»**. O popup já está conectado ao contexto da tabela correspondente, sem precisar especificar manualmente.

   ![04-forms-and-details-2026-03-13-09-44-50](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-09-44-50.png)
4. No formulário clique em **«[Campos](/data-sources/data-modeling/collection-fields) (Fields)»**, marque os seguintes campos:

| Campo | Pontos de configuração |
|------|---------|
| Título | Obrigatório (segue o global) |
| Descrição | Entrada de texto longo |
| Status | Lista suspensa (vamos definir o valor padrão via regra de vinculação depois) |
| Prioridade | Lista suspensa |
| Categoria | Campo de relacionamento, exibido automaticamente como seletor suspenso |
| Criador | Campo de relacionamento (vamos definir o valor padrão via regra de vinculação depois) |
| Atendente | Campo de relacionamento |

![04-forms-and-details-2026-03-13-12-44-49](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-44-49.png)

Você verá que o campo «Título» já vem com um asterisco vermelho `*` ao lado — porque ao criar o campo no Capítulo 2 já marcamos como obrigatório, e o formulário herda automaticamente a regra de obrigatoriedade do nível da tabela, sem precisar configurar de novo.

![04-forms-and-details-2026-03-13-12-46-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-46-34.png)

> **Dica**: se um campo não foi definido como obrigatório no nível da tabela, mas você quer que seja obrigatório no formulário atual, dá pra definir individualmente nas configurações do campo.
>
![04-forms-and-details-2026-03-13-12-47-26](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-47-26.png)

### Adicionar botão de submeter

1. Abaixo do bloco de formulário clique em **«Ações (Actions)»**.
2. Marque o botão **«Submeter»**.

![04-forms-and-details-2026-03-13-16-30-06](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-30-06.png)

3. O usuário preenche o formulário e clica em submeter para criar um novo ticket.

![04-forms-and-details-2026-03-13-16-32-19](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-32-19.gif)

## 4.2 Regras de Vinculação: Valores Padrão e Vinculação de Campos

Alguns campos a gente quer preencher automaticamente (por exemplo, status padrão «Pendente»), outros precisam mudar dinamicamente segundo condições (por exemplo, ticket urgente exige descrição obrigatória). Atualmente, na 2.0, a forma da função de valor padrão ainda está evoluindo, então este tutorial usa uniformemente **regras de vinculação** para configurar valores padrão e vinculação de campos.

1. Clique nas **configurações do bloco** no canto superior direito do bloco de formulário (ícone de três traços).
2. Encontre **«Regras de vinculação (Linkage rules)»** e clique para abrir o painel de configuração na lateral.

![04-forms-and-details-2026-03-13-16-43-35](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-43-35.png)

### Definir valores padrão

Vamos primeiro definir valores padrão para «Status» e «Criador»:

1. Clique em **«Adicionar regra de vinculação»**.
2. **Não defina condição** (deixe em branco) — uma regra de vinculação sem condição é executada imediatamente quando o formulário é carregado.

![04-forms-and-details-2026-03-13-16-47-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-47-34.png)

3. Configure as ações:
   - Campo Status → **Definir valor padrão** → Pendente
   - Campo Criador → **Definir valor padrão** → Usuário atual

> **Atenção ao escolher os valores**: ao definir o valor, escolha primeiro **«Formulário atual»** como fonte de dados. Se for um campo de objeto relacionado (como Categoria, Criador, Atendente, todos campos muitos-para-um), você deve escolher a propriedade do objeto em si, não os subcampos expandidos.
>
> Ao escolher uma variável (como «Usuário atual»), é preciso primeiro **clicar uma vez** para selecionar a variável e depois **clicar duas vezes** para preenchê-la na barra de seleção.

![04-forms-and-details-2026-03-13-17-01-06](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-01-06.png)

![04-forms-and-details-2026-03-13-17-02-20](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-02-20.png)


![04-forms-and-details-2026-03-13-17-03-41](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-03-41.png)


Se você quer que algum campo o criador não possa modificar (como o status), nas configurações do campo defina **«Modo de exibição (Display mode)»** como **«Somente leitura (Readonly)»**.

![04-forms-and-details-2026-03-13-17-22-15](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-22-15.png)

> **Três modos de exibição**: editável (Editable), somente leitura (Readonly, proibido editar mas mantém aparência do campo), modo leitura (Easy-reading, exibe apenas texto).

![04-forms-and-details-2026-03-13-12-54-53](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-54-53.png)

### Ticket urgente exige descrição obrigatória

Em seguida vamos adicionar uma regra de vinculação condicional: quando o usuário escolher prioridade «Urgente», o campo descrição se torna **obrigatório**, lembrando o criador de explicar bem a situação.

1. Clique em **«Adicionar regra de vinculação»**.

![04-forms-and-details-2026-03-13-17-07-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-07-34.png)

2. Configure a regra:
   - **Condição (Condition)**: Formulário atual / Prioridade **igual** Urgente
   - **Ações (Actions)**: Campo descrição → **definir como obrigatório**

![04-forms-and-details-2026-03-13-17-08-46](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-08-46.png)

![04-forms-and-details-2026-03-13-17-18-16](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-18-16.png)

3. Salve a regra.

Agora teste: ao escolher prioridade «Urgente», aparece o asterisco vermelho `*` ao lado do campo descrição, indicando obrigatoriedade. Ao escolher outra prioridade, volta a não ser obrigatório.

![04-forms-and-details-2026-03-13-17-20-18](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-20-18.gif)

Por fim, com base no que aprendemos, ajuste o layout simplesmente
![04-forms-and-details-2026-03-13-17-25-55](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-25-55.png)

> **O que mais as regras de vinculação podem fazer?** Além de definir valores padrão e controlar obrigatoriedade, também podem controlar exibição/ocultação de campos, atribuição dinâmica. Por exemplo: quando o status for «Fechado», esconder o campo atendente. Vamos ver mais exemplos quando aparecerem nos próximos capítulos.

## 4.3 [Bloco de Detalhes](/interface-builder/blocks/data-blocks/details)

No capítulo anterior, adicionamos o botão «Visualizar» na linha da tabela — clicar abre uma gaveta. Agora vamos configurar o conteúdo da gaveta.

1. Na tabela clique no botão **«Visualizar»** de uma linha, abrindo a gaveta.
2. Na gaveta clique em **«Criar bloco (Add block) → bloco de dados → Detalhes»**.
3. Escolha **«Tabela atual (Current collection)»**.

![04-forms-and-details-2026-03-13-17-27-02](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-27-02.png)

4. No bloco de detalhes, em **«Campos (Fields)»**, organize o layout assim:


| Área | Campos |
|------|------|
| Topo | Título, Status (estilo tag) |
| Corpo | Descrição (área de texto grande) |
| Informações laterais | Nome da categoria, Prioridade, Criador, Atendente, Data de criação |

Como colocar um título grande?
Selecione campos > markdown > editar markdown > na área de edição escolha variável > registro atual > título
Isso insere dinamicamente o título do registro no bloco markdown.
Exclua o texto padrão e use sintaxe markdown para deixar como título de segundo nível (basta adicionar `## ` na frente)

![04-forms-and-details-2026-03-13-17-36-26](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-36-26.png)

![04-forms-and-details-2026-03-13-17-39-51](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-39-51.png)

O campo de título original da página pode ser removido — ajuste o layout do formulário de detalhes

![04-forms-and-details-2026-03-13-17-43-36](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-43-36.png)


> **Dica**: vários campos podem ser organizados na mesma linha por arrastar, deixando o layout mais compacto e bonito.


1. Em **«Ações (Actions)»** do bloco de detalhes marque o botão **«Editar»**, facilitando entrar no modo de edição direto a partir dos detalhes.

![04-forms-and-details-2026-03-13-17-45-15](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-45-15.png)

### Configurar o formulário de edição

Ao clicar no botão «Editar», abre um novo popup — onde precisamos colocar um formulário de edição. Os campos do formulário de edição são quase idênticos ao formulário de novo ticket — será que precisamos marcar tudo de novo do zero?

Não. Lembra do formulário de novo ticket? Vamos primeiro **salvá-lo como template**, e o formulário de edição apenas referencia.

**Primeiro passo: voltar para o formulário de novo ticket e salvar como template**

1. Feche o popup atual, volte para a lista de tickets, clique em «Adicionar» para abrir o formulário de novo ticket.
2. Clique nas **configurações do bloco** no canto superior direito do formulário (ícone de três traços) e encontre **«Salvar como template (Save as template)»**.

![04-forms-and-details-2026-03-13-17-47-21](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-47-21.png)

3. Clique em salvar; por padrão é **«Referência (Reference)»** — todos os formulários que referenciam o template compartilham a mesma configuração; mexer em um sincroniza tudo.

![04-forms-and-details-2026-03-13-17-47-44](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-47-44.png)


![04-forms-and-details-2026-03-13-18-39-05](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-39-05.png)

> Nosso formulário de ticket é simples; escolher «Referência» é mais prático para manutenção unificada. Se escolher «Cópia», cada formulário recebe uma cópia independente, modificadas isoladamente.

**Segundo passo: referenciar o template no popup de edição**

1. Volte à gaveta de detalhes ou à coluna de operações da tabela, clique no botão «Editar» para abrir o popup de edição.

Você pode pensar: criar diretamente via **«Criar bloco → outros blocos → template de bloco»** não bastaria? Tente — o que você cria assim é um **formulário de adicionar**, e os campos não são preenchidos automaticamente. É uma armadilha comum.

![04-forms-and-details-2026-03-13-17-59-36](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-59-36.png)

A forma correta é:

2. No popup clique em **«Criar bloco (Add block) → bloco de dados → Formulário (Editar)»**, criando primeiro um bloco de formulário de edição normal.
3. No formulário de edição clique em **«Campos (Fields) → Templates de campos (Field templates)»** e escolha o template salvo anteriormente.
4. Os campos vão preencher tudo de uma vez, idêntico ao formulário de novo ticket.
5. Não esqueça de adicionar o botão de ação «Submeter», para que o usuário possa salvar após editar.

![04-forms-and-details-2026-03-13-18-05-13](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-05-13.png)

![04-forms-and-details-2026-03-13-18-15-11](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-15-11.gif)

Vai querer adicionar campos depois? Basta modificar uma vez no template — o formulário de novo e o de edição se atualizam juntos.

### Edição rápida: alterar dados sem abrir popup

Além da edição via popup, o NocoBase também suporta **edição rápida** direto na tabela — sem abrir nenhum popup, basta passar o mouse para alterar.

Há duas formas de ativar:

- **Nível do bloco de tabela**: clique nas **configurações do bloco** (ícone de três traços) e encontre **«Edição rápida (Quick editing)»**. Ao ativar, todos os campos da tabela suportam edição rápida.
- **Nível de campo individual**: clique nas configurações de uma coluna específica e encontre **«Edição rápida»**, controlando individualmente se cada campo está habilitado.

![04-forms-and-details-2026-03-13-18-20-07](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-20-07.png)

Ativado, ao passar o mouse sobre uma célula da tabela aparece um pequeno ícone de lápis. Clique para abrir o componente de edição daquele campo, e a alteração é salva automaticamente.

![04-forms-and-details-2026-03-13-18-21-09](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-21-09.gif)

> **Para que cenários é adequado?** A edição rápida é ideal para cenários de modificação em massa de status, atendente, etc. Por exemplo, ao navegar pela lista de tickets, o administrador pode clicar diretamente na coluna «Status» para mudar o ticket de «Pendente» para «Em processamento», sem ter que abrir um por um.

## 4.4 Habilitar Histórico de Registros

:::info Plugin comercial
O «[Histórico de Registros](https://docs.nocobase.com/cn/record-history/)» é um plugin da [Versão Profissional](https://www.nocobase.com/cn/commercial) do NocoBase, requer licença comercial. Se você usa a versão comunidade, pode pular esta seção sem afetar os capítulos seguintes.
:::

Um ponto crítico de um sistema de tickets: **quem mudou o quê e quando deve estar tudo rastreável**. O plugin «Histórico de Registros» do NocoBase grava automaticamente cada alteração de dado.

### Configurar histórico de registros

1. Vá em **Configurações → Gerenciamento de plugins**, garanta que o plugin «Histórico de Registros» (Record History) está habilitado.

![04-forms-and-details-2026-03-13-18-22-44](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-22-44.png)

2. Entre na página de configuração do plugin, clique em **«Adicionar tabela»** e escolha **«Tickets»**.
3. Selecione os campos que deseja registrar: **Título, Status, Prioridade, Atendente, Descrição**, etc.

![04-forms-and-details-2026-03-13-18-25-11](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-25-11.png)

> **Sugestão**: não precisa registrar todos os campos. Campos como ID e data de criação não são modificados manualmente, sem necessidade de rastrear. Registre apenas alterações de campos com significado de negócio.

4. Volte às configurações, clique em **«Sincronizar snapshot do histórico de dados»**, o plugin vai automaticamente registrar todos os tickets atuais como o primeiro registro de histórico, e cada modificação posterior gera um novo registro de histórico.

![04-forms-and-details-2026-03-13-18-27-01](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-27-01.png)

![04-forms-and-details-2026-03-13-18-28-50](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-28-50.png)

### Visualizar histórico na página de detalhes

1. Volte à gaveta de detalhes do ticket (clicando no botão «Visualizar» da linha da tabela).
2. Na gaveta clique em **«Criar bloco (Add block) → Histórico de registros»**.
3. Escolha **«Tabela atual»**, dado escolha **«Registro atual»**.
4. Na parte inferior da página de detalhes aparece uma linha do tempo, mostrando claramente cada alteração: quem em qual momento mudou qual campo de qual valor para qual valor.

![04-forms-and-details-2026-03-13-18-31-45](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-31-45.png)

![04-forms-and-details-2026-03-13-18-33-00](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-33-00.gif)

Assim, mesmo que o ticket passe pelas mãos de várias pessoas, todas as alterações estão claras como cristal.

## Resumo

Neste capítulo concluímos o ciclo de vida completo dos dados:

- **Formulário** — usuário pode submeter novo ticket, com campos com valores padrão e validação
- **Regras de vinculação** — ticket urgente exige descrição obrigatória automaticamente
- **Bloco de detalhes** — exibe claramente todas as informações do ticket
- **Histórico de registros** — rastreia automaticamente cada mudança, auditoria sem dor de cabeça (plugin comercial, opcional)

De «conseguir ver» para «conseguir preencher» e «conseguir consultar» — nosso sistema de tickets já tem usabilidade básica.

## Recursos Relacionados

- [Bloco de formulário](/interface-builder/blocks/data-blocks/form) — configuração detalhada do bloco de formulário
- [Bloco de detalhes](/interface-builder/blocks/data-blocks/details) — configuração do bloco de detalhes
- [Regras de vinculação](/interface-builder/linkage-rules) — explicação das regras de vinculação de campos
