:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Regras de Interligação de Campos

## Introdução

As regras de interligação de campos permitem ajustar dinamicamente o estado dos campos em blocos de formulário ou detalhes com base nas ações do usuário. Atualmente, os blocos que suportam regras de interligação de campos incluem:

- [Bloco de Formulário](/interface-builder/blocks/data-blocks/form)
- [Bloco de Detalhes](/interface-builder/blocks/data-blocks/details)
- [Subformulário](/interface-builder/fields/specific/sub-form)

## Instruções de Uso

### **Bloco de Formulário**

Em um Bloco de Formulário, as regras de interligação podem ajustar dinamicamente o comportamento dos campos com base em condições específicas:

- **Controlar a visibilidade do campo (mostrar/ocultar)**: Decida se o campo atual será exibido com base nos valores de outros campos.
- **Definir campo como obrigatório**: Defina dinamicamente um campo como obrigatório ou não obrigatório sob condições específicas.
- **Atribuir valor**: Atribua automaticamente um valor a um campo com base em condições.
- **Executar JavaScript especificado**: Escreva JavaScript de acordo com os requisitos do negócio.

### **Bloco de Detalhes**

Em um Bloco de Detalhes, as regras de interligação são usadas principalmente para controlar dinamicamente a visibilidade (mostrar/ocultar) dos campos no bloco.

![20251029114859](https://static-docs.nocobase.com/20251029114859.png)

## Interligação de Propriedades

### Atribuir Valor

Exemplo: Quando um pedido é marcado como um pedido suplementar, o status do pedido é automaticamente definido como 'Pendente de Revisão'.

![20251029115348](https://static-docs.nocobase.com/20251029115348.png)

### Obrigatório

Exemplo: Quando o status do pedido é 'Pago', o campo de valor do pedido é obrigatório.

![20251029115031](https://static-docs.nocobase.com/20251029115031.png)

### Mostrar/Ocultar

Exemplo: A conta de pagamento e o valor total são exibidos apenas quando o status do pedido é 'Pendente de Pagamento'.

![20251030223710](https://static-docs.nocobase.com/20251030223710.png)

![20251030223801](https://static-docs.nocobase.com/20251030223801.gif)