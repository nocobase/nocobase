:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# O que é o FlowEngine?

O FlowEngine é um novo motor de desenvolvimento front-end no-code e low-code, lançado no NocoBase 2.0. Ele combina modelos (Model) com fluxos (Flow) para simplificar a lógica front-end, aumentando a reusabilidade e a manutenibilidade. Ao mesmo tempo, aproveitando a natureza configurável do Flow, ele oferece recursos de configuração e orquestração no-code para componentes front-end e lógica de negócios.

## Por que o nome FlowEngine?

Porque no FlowEngine, as propriedades e a lógica dos componentes não são mais definidas estaticamente, mas são impulsionadas e gerenciadas por um **Flow**.

*   O **Flow**, como um fluxo de dados, divide a lógica em etapas (Step) ordenadas e as aplica sequencialmente ao componente;
*   O **Engine** significa que é um motor que impulsiona a lógica e as interações front-end.

Portanto, **FlowEngine = Um motor de lógica front-end impulsionado por fluxos**.

## O que é um Model?

No FlowEngine, um Model é um modelo abstrato de um componente, responsável por:

*   Gerenciar as **propriedades (Props) e o estado** do componente;
*   Definir o **método de renderização** do componente;
*   Hospedar e executar o **Flow**;
*   Lidar de forma unificada com o **despacho de eventos** e os **ciclos de vida**.

Em outras palavras, **o Model é o cérebro lógico do componente**, transformando-o de um elemento estático em uma unidade dinâmica configurável e orquestrável.

## O que é um Flow?

No FlowEngine, um **Flow é um fluxo lógico que serve ao Model**.
Seu propósito é:

*   Dividir a lógica de propriedades ou eventos em etapas (Step) e executá-las sequencialmente, como um fluxo;
*   Gerenciar mudanças de propriedades, assim como respostas a eventos;
*   Tornar a lógica **dinâmica, configurável e reutilizável**.

## Como entender esses conceitos?

Você pode imaginar um **Flow** como um **fluxo de água**:

*   **Um Step é como um nó no caminho do fluxo**
    Cada Step desempenha uma pequena tarefa (por exemplo, definir uma propriedade, disparar um evento, chamar uma API), assim como a água tem um efeito ao passar por uma comporta ou uma roda d'água.

*   **O fluxo é ordenado**
    A água flui por um caminho predeterminado de montante a jusante, passando por todos os Steps em sequência; da mesma forma, a lógica em um Flow é executada na ordem definida.

*   **O fluxo pode ser ramificado e combinado**
    Um fluxo de água pode ser dividido em múltiplos pequenos fluxos ou se juntar; um Flow também pode ser dividido em múltiplos sub-fluxos ou combinado em cadeias lógicas mais complexas.

*   **O fluxo é configurável e controlável**
    A direção e o volume de um fluxo de água podem ser ajustados por uma comporta; o método de execução e os parâmetros de um Flow também podem ser controlados através da configuração (`stepParams`).

Resumo da Analogia

*   Um **componente** é como uma roda d'água que precisa de um fluxo de água para girar;
*   O **Model** é a base e o controlador dessa roda d'água, responsável por receber a água e impulsionar sua operação;
*   O **Flow** é esse fluxo de água que passa por cada Step em ordem, fazendo com que o componente mude e responda continuamente.

Então, no FlowEngine:

*   O **Flow permite que a lógica flua naturalmente como um fluxo de água**;
*   O **Model torna o componente o portador e executor desse fluxo**.