:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# O que é o FlowEngine?

O FlowEngine é um novo motor de desenvolvimento front-end no-code/low-code introduzido no NocoBase 2.0. Ele combina **Modelos** e **Fluxos** para simplificar a lógica front-end e melhorar a reusabilidade e a manutenibilidade. Ao mesmo tempo, ele aproveita a capacidade de configuração dos **Fluxos** para oferecer recursos de configuração e orquestração no-code para componentes front-end e lógica de negócios.

## Por que o nome FlowEngine?

Porque no FlowEngine, as propriedades e a lógica de um componente não são mais definidas estaticamente, mas são impulsionadas e gerenciadas por **Fluxos**.

*   O **Fluxo**, como um fluxo de dados, divide a lógica em etapas (Steps) ordenadas que são aplicadas progressivamente ao componente.
*   **Engine** significa que é um motor que impulsiona a lógica e as interações front-end.

Portanto, **FlowEngine = Um motor de lógica front-end impulsionado por Fluxos**.

## O que é um Modelo?

No FlowEngine, um Modelo é um modelo abstrato de um componente, responsável por:

*   Gerenciar as **propriedades (Props) e o estado** do componente.
*   Definir o **método de renderização** do componente.
*   Hospedar e executar **Fluxos**.
*   Lidar uniformemente com o **despacho de eventos** e os **ciclos de vida**.

Em outras palavras, **um Modelo é o cérebro lógico de um componente**, transformando-o de uma unidade estática em uma unidade dinâmica configurável e orquestrável.

## O que é um Fluxo?

No FlowEngine, **um Fluxo é um fluxo lógico que serve a um Modelo**.
Seu propósito é:

*   Dividir a lógica de propriedades ou eventos em etapas (Steps) e executá-las sequencialmente em um fluxo.
*   Gerenciar tanto as mudanças de propriedades quanto as respostas a eventos.
*   Tornar a lógica **dinâmica, configurável e reutilizável**.

## Como entender esses conceitos?

Você pode imaginar um **Fluxo** como um **fluxo de água**:

*   **Um Step é como um nó ao longo do fluxo de água**
    Cada Step executa uma pequena tarefa (por exemplo, definir uma propriedade, acionar um evento, chamar uma API), assim como um fluxo de água tem um efeito quando passa por uma comporta ou uma roda d'água.

*   **Os Fluxos são ordenados**
    Um fluxo de água segue um caminho predeterminado do nascente ao jusante, passando por todos os Steps em sequência; da mesma forma, a lógica em um Fluxo é executada na ordem definida.

*   **Os Fluxos podem ser ramificados e combinados**
    Um fluxo de água pode ser dividido em múltiplos fluxos menores ou ser unido; um Fluxo também pode ser dividido em múltiplos sub-fluxos ou combinado em cadeias lógicas mais complexas.

*   **Os Fluxos são configuráveis e controláveis**
    A direção e o volume de um fluxo de água podem ser ajustados com uma comporta; o método de execução e os parâmetros de um Fluxo também podem ser controlados através da configuração (`stepParams`).

Resumo da Analogia

*   Um **componente** é como uma roda d'água que precisa de um fluxo de água para girar.
*   Um **Modelo** é a base e o controlador dessa roda d'água, responsável por receber o fluxo de água e impulsionar sua operação.
*   Um **Fluxo** é esse fluxo de água, passando por cada Step em ordem, impulsionando o componente a mudar e responder continuamente.

Então, no FlowEngine:

*   Os **Fluxos permitem que a lógica se mova naturalmente como um fluxo de água**.
*   Os **Modelos permitem que os componentes se tornem os portadores e executores desse fluxo**.