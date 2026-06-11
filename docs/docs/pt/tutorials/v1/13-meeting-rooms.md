# Capítulo 12: Reserva de Salas de Reunião e Workflow

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114048192480747&bvid=BV1PKPuevEH5&cid=28526840811&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Acreditamos que, neste momento, você já está bem familiarizado com o **NocoBase**.

Neste capítulo, vamos juntos implementar um cenário especial: o módulo de gestão de reuniões.

Esse módulo inclui funcionalidades como reserva de sala de reunião e notificações. Nesse processo, vamos construir do zero, gradualmente, o módulo de gestão de reuniões — começando pelo básico e implementando funcionalidades cada vez mais complexas. Vamos começar projetando a estrutura básica das tabelas de dados desse módulo.

---

### 12.1 Projetando a Estrutura das Tabelas

A estrutura das tabelas pode ser entendida como o arcabouço básico do módulo de gestão de reuniões. Aqui vamos focar na **tabela de salas de reunião** e na **tabela de reservas**, e abordar algumas relações novas, como a relação [muitos-para-muitos](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2m) com os usuários.

![](https://static-docs.nocobase.com/Solution/CRuKbVrnroSgGdxaVrBcvzSMnHd.png)

#### 12.1.1 Tabela de Salas de Reunião

A tabela de salas de reunião armazena as informações básicas de todas as salas, incluindo nome, localização, capacidade e configuração.

##### Exemplo de estrutura

```json
Salas (Rooms)
    ID (chave primária)
    Nome da sala (name, texto de uma linha)
    Localização (location, texto de várias linhas)
    Capacidade (capacity, número inteiro)
    Configuração (equipment, texto de várias linhas)
```

#### 12.1.2 Tabela de Reservas

A tabela de reservas registra todas as reservas de reunião, com campos como sala, usuários participantes, intervalo de tempo, título e descrição.

##### Exemplo de estrutura

```json
Reservas (Bookings)
    ID (número inteiro, chave primária única)
    Sala (room, muitos-para-um, FK room_id associada à ID da sala)
    Usuários (users, muitos-para-muitos, associada à ID do usuário)
    Hora de início (start_time, datetime)
    Hora de fim (end_time, datetime)
    Título da reunião (title, texto de uma linha)
    Descrição da reunião (description, Markdown)
```

##### [Relação muitos-para-muitos](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2m)

Na tabela de reservas, há uma relação «muitos-para-muitos»: um usuário pode participar de várias reuniões e uma reunião pode ter vários usuários participantes. A relação muitos-para-muitos aqui precisa de chaves estrangeiras configuradas. Para facilitar o gerenciamento, podemos nomear a tabela intermediária de **booking_users**.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428726.png)

---

### 12.2 Construindo o Módulo de Gestão de Reuniões

Após projetar a estrutura, criamos as duas tabelas e o módulo «Gestão de Reuniões». Os passos:

#### 12.2.1 Criar [Bloco de Tabela](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table)

Primeiro, na página, adicione o módulo «Gestão de Reuniões», e crie respectivamente o **bloco de tabela de salas** e o **[bloco de tabela](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table) de reservas**. Em seguida, crie um [bloco de calendário](https://docs-cn.nocobase.com/handbook/calendar) para a tabela de reservas, com a visualização padrão definida como «Dia».

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428135.png)

##### Configurar a associação do bloco de tabela de salas

Associe o bloco de tabela de salas com os outros dois blocos, para que os registros de reservas correspondentes àquela sala sejam filtrados automaticamente. Em seguida, experimente as funcionalidades de filtragem, criação, exclusão, leitura e atualização para testar a interação básica do módulo.

> Dica **Conexão de blocos do NocoBase (recomendado!!)**:
>
> Além dos blocos de filtro anteriores, nosso bloco de tabela também pode se conectar a outros blocos, alcançando o efeito de filtro por clique.
>
> Como na imagem abaixo, na configuração da tabela de salas, conectamos os outros dois blocos da tabela de reservas (bloco de tabela de reservas, bloco de calendário de reservas)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428280.png)

> Após conectar com sucesso, ao clicar na tabela de salas, você verá que as outras duas tabelas também são filtradas! Clique no item selecionado novamente para desselecionar.
>
> ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429198.gif)

---

### 12.3 Detectando Ocupação de Salas

Após configurar a página, precisamos adicionar uma funcionalidade importante: detectar a ocupação das salas. Essa função, ao criar ou atualizar uma reunião, verifica se a sala alvo está ocupada no intervalo de tempo especificado, evitando conflitos de reserva.

![](https://static-docs.nocobase.com/project-management-cn-er.drawio.svg)

#### 12.3.1 Configurar [workflow](https://docs-cn.nocobase.com/handbook/workflow) de «Evento Pré-Ação»

Para fazer detecção na hora da reserva, usamos um tipo especial de workflow — o [«Evento Pré-Ação»](https://docs-cn.nocobase.com/handbook/workflow-request-interceptor):

- [**Evento Pré-Ação**](https://docs-cn.nocobase.com/handbook/workflow-request-interceptor) (plugin comercial): executa uma série de operações antes de adicionar, excluir ou modificar dados, podendo pausar e interceptar a qualquer momento. Esse modo é muito próximo do nosso fluxo diário de desenvolvimento de código!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429352.png)

#### 12.3.2 Configurar Nós

No workflow de detecção de ocupação, precisamos dos seguintes tipos de nós:

- [**Nó de Cálculo**](https://docs-cn.nocobase.com/handbook/workflow/nodes/calculation) (lógica de transformação de dados, para tratar casos de modificação e adição)
- [**Operação SQL**](https://docs-cn.nocobase.com/handbook/workflow/nodes/sql) (executar consulta SQL)
- [**Análise JSON**](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query) (plugin comercial, para analisar dados JSON)
- [**Mensagem de Resposta**](https://docs-cn.nocobase.com/handbook/workflow/nodes/response-message) (plugin comercial, para retornar mensagens informativas)

---

#### 12.3.3 Vincular a Tabela de Reservas e Configurar o Trigger

Agora vinculamos a tabela de reservas, escolhemos o modo de disparo «Modo Global», e selecionamos os tipos de operação como criar e atualizar registros.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429296.png)

---

### 12.4 Configurar [Nó de Cálculo](https://docs-cn.nocobase.com/handbook/workflow/nodes/calculation)

#### 12.4.1 Criar nó de cálculo «Converter ID em branco para -1»

Criamos primeiro um nó de cálculo para converter ID em branco para -1. O nó de cálculo permite converter variáveis da forma que precisamos, fornecendo três modos de operação:

- **Math.js** (referência [Math.js](https://mathjs.org/))
- **Formula.js** (referência [Formula.js](https://formulajs.info/functions/))
- **Template de string** (para concatenação de dados)

Aqui usamos **Formula.js** para o julgamento numérico:

```html
IF(NUMBERVALUE(【Variável do trigger/Parâmetros/Objeto de valor submetido/ID】, '', '.'),【Variável do trigger/Parâmetros/Objeto de valor submetido/ID】, -1)
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429134.png)

---

### 12.5. Criar [Nó de Operação SQL](https://docs-cn.nocobase.com/handbook/workflow/nodes/sql)

Em seguida, crie um nó de operação SQL para executar a consulta e verificar as salas disponíveis:

#### 12.5.1 SQL para consultar salas disponíveis

```sql
-- Consulta todas as salas que podem ser reservadas
SELECT r.id, r.name
FROM rooms r
LEFT JOIN bookings b ON r.id = b.room_id
  AND b.id <> {{$jobsMapByNodeKey.3a0lsms6tgg}}  -- Exclui reserva atual
  AND b.start_time < '{{$context.params.values.end_time}}' -- Início antes do fim consultado
  AND b.end_time > '{{$context.params.values.start_time}}' -- Fim depois do início consultado
WHERE b.id IS NULL;
```

> Atenção SQL: as variáveis são substituídas diretamente no SQL — verifique cuidadosamente para evitar SQL injection. Adicione aspas simples nos lugares apropriados.

As variáveis significam:

{{$jobsMapByNodeKey.3a0lsms6tgg}} representa o resultado do nó anterior, 【Dados do nó/Converter ID em branco para -1】

{{$context.params.values.end_time}} representa 【Variável do trigger/Parâmetros/Objeto de valor submetido/Hora de fim】

{{$context.params.values.start_time}} representa 【Variável do trigger/Parâmetros/Objeto de valor submetido/Hora de início】

#### 12.5.2 Testar SQL

Nosso objetivo é consultar todas as salas que não conflitam com o intervalo alvo.

Você pode clicar em "Test run" abaixo, alterar valores de variáveis e depurar o SQL.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211437958.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211438641.png)

---

### 12.6 [Análise JSON](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query)

#### 12.6.1 Configurar [Nó de Análise JSON](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query)

Pelo teste do passo anterior, observamos que o resultado tem este formato; precisamos habilitar o [**plugin JSON query node**](https://docs-cn.nocobase.com/handbook/workflow-json-query):

```json
[
  {
    "id": 2,
    "name": "Sala de reunião 2"
  },
  {
    "id": 1,
    "name": "Sala de reunião 1"
  }
]
```

> A análise JSON tem três modos:
> [JMESPath](https://jmespath.org/)
> [JSON Path Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
> [JSONata](https://jsonata.org/)

Aqui escolhemos um, por exemplo o formato [JMESPath](https://jmespath.org/). Como precisamos filtrar a lista de nomes de todas as salas disponíveis, a expressão é:

```sql
[].name
```

A configuração de mapeamento de propriedades é para listas de objetos; não é necessária aqui, pode ficar em branco.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211438250.png)

### 12.7 [Condicional](https://docs-cn.nocobase.com/handbook/workflow/nodes/condition)

Configure o nó de condicional para verificar se a sala atual está na lista de salas disponíveis. Conforme o resultado **Sim** ou **Não**, configure as mensagens de resposta:

A condição usa o cálculo "básico":

```json
【Dados do nó / Lista de salas analisada】 contém 【Variável do trigger / Parâmetros / Objeto de valor submetido / Sala / Nome】
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211439432.png)

#### 12.7.1 Sim: configurar mensagem de sucesso

Aqui você precisa habilitar o [**plugin Workflow: Response message**](https://docs-cn.nocobase.com/handbook/workflow-response-message):

```json
【Variável do trigger/Parâmetros/Objeto de valor submetido/Sala/Nome】 disponível, reserva concluída!
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211439159.png)

#### 12.7.2 Não: configurar mensagem de falha

```json
Sala alvo indisponível, lista de salas disponíveis: 【Dados do nó/Lista de salas analisada】
```

Atenção, ao decidir falha, sempre configure o nó "Encerrar fluxo" para encerrar o fluxo manualmente.

![202411170606321731794792.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440377.png)

---

### 12.8 Detalhamento de Detecção e Depuração

Agora entramos na fase de teste final do sistema de gestão de reuniões. O objetivo dessa fase é confirmar se nosso workflow consegue detectar corretamente e impedir reservas conflitantes.

#### 12.8.1 Adicionar reserva com conflito de horário

Primeiro, tentamos adicionar uma reunião com horário conflitante a uma reserva existente, para ver se o sistema impede a operação e mostra o erro.

- Definir intervalo de tempo conflitante

Tente adicionar uma nova reserva na "Sala 1", com o horário

`2024-11-14 00:00:00 - 2024-11-14 23:00:00`

Esse intervalo cobre o dia inteiro, propositalmente em conflito com reservas existentes.

- Confirmar reservas existentes

Na "Sala 1" já existem duas reservas:

1. `2024-11-14 09:00:00 a 2024-11-14 12:00:00`
2. `2024-11-14 14:00:00 a 2024-11-14 16:30:00`

Esses dois intervalos sobrepõem-se ao que queremos adicionar (`2024-11-14 00:00:00 - 2024-11-14 23:00:00`).

Portanto, o sistema deve detectar o conflito e impedir a reserva.

- Submeter reserva e validar resposta

Clique em **Submeter**; o sistema executa o fluxo de detecção:

**Resposta de sucesso:** após submeter, o sistema mostra o aviso de conflito, indicando que a lógica de detecção está normal. A página informa com sucesso que a reserva não pode ser concluída.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440141.png)

---

#### 12.8.2 Adicionar reserva sem conflito

Em seguida, vamos testar reservas sem conflito~

Garanta que, quando os horários não se sobrepõem, conseguimos reservar a sala com sucesso!

- Definir intervalo sem conflito

Escolha um intervalo sem conflito, como

`2024-11-10 16:00:00 - 2024-11-10 17:00:00`.

Esse intervalo não conflita com reservas existentes, atendendo aos requisitos.

- Submeter reserva sem conflito

Clique em **Submeter**; o sistema executa novamente o fluxo:

**Vamos validar:** submetido com sucesso! O sistema mostra o aviso «Reserva concluída», indicando que a função de reserva sem conflito também funciona.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440542.png)

#### 12.8.3 Modificar horário de reserva existente

Além de adicionar, você pode testar modificar um horário existente.

Por exemplo, mude o horário de uma reunião existente para outro intervalo sem conflito, e clique em submeter de novo.

Esse passo deixo com você.

---

### 12.9 Otimização do Dashboard e Painel de Agenda Pessoal

Após todos os testes passarem, podemos refinar e otimizar o dashboard, melhorando a experiência do usuário.

#### 12.9.1 Ajustar layout do dashboard

No dashboard, podemos reorganizar o conteúdo da página de acordo com os hábitos do usuário, facilitando a visualização dos dados do sistema.

Para melhorar ainda mais a experiência, podemos criar um painel de agenda exclusivo para cada usuário. Os passos:

1. **Criar bloco "Agenda Pessoal"**: no dashboard adicione um novo bloco de calendário ou lista, exibindo a agenda pessoal do usuário.
2. **Configurar valor padrão de membro**: defina o valor padrão de membro como o usuário atual; assim, ao abrir o dashboard, o usuário vê por padrão as reuniões relacionadas a si.

Otimizamos ainda mais a experiência do usuário no módulo de gestão de reuniões.

Após essas configurações, o dashboard fica muito mais intuitivo e útil, com funcionalidades enriquecidas!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211507712.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211507197.png)

Com esses passos, implementamos e otimizamos com sucesso as funcionalidades principais do módulo de gestão de reuniões! Esperamos que durante a operação, você consiga dominar as funcionalidades centrais do NocoBase e experimente a alegria de construir sistemas modulares.

---

Continue explorando, dê asas à sua criatividade! Se encontrar problemas, não esqueça que você pode consultar a [documentação oficial do NocoBase](https://docs-cn.nocobase.com/) ou entrar na [comunidade NocoBase](https://forum.nocobase.com/) para discutir.
