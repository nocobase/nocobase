:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Vincular Fluxo de Trabalho

## Introdução

Em alguns botões de ação, você pode configurar um **fluxo de trabalho** para vincular a operação de envio a ele, o que permite o processamento automatizado dos dados.

![20251029144822](https://static-docs.nocobase.com/20251029144822.png)

![20251029145017](https://static-docs.nocobase.com/20251029145017.png)

## Ações e Tipos de Fluxo de Trabalho Suportados

Os botões de ação e os tipos de **fluxo de trabalho** atualmente suportados para vinculação são os seguintes:

| Botão de Ação \ Tipo de Fluxo de Trabalho | Evento Antes da Ação | Evento Depois da Ação | Evento de Aprovação | Evento de Ação Personalizada |
| --- | --- | --- | --- | --- |
| Botões "Enviar", "Salvar" do formulário | ✅ | ✅ | ✅ | ❌ |
| Botão "Atualizar dados" em linhas de dados (Tabela, Lista, etc.) | ✅ | ✅ | ✅ | ❌ |
| Botão "Excluir" em linhas de dados (Tabela, Lista, etc.) | ✅ | ❌ | ❌ | ❌ |
| Botão "Acionar fluxo de trabalho" | ❌ | ❌ | ❌ | ✅ |

## Vinculando Múltiplos Fluxos de Trabalho

Um botão de ação pode ser vinculado a múltiplos **fluxos de trabalho**. Quando vários **fluxos de trabalho** são vinculados, a ordem de execução deles segue as seguintes regras:

1. Para **fluxos de trabalho** do mesmo tipo de gatilho, os **fluxos de trabalho** síncronos são executados primeiro, seguidos pelos assíncronos.
2. **Fluxos de trabalho** do mesmo tipo de gatilho são executados na ordem configurada.
3. Entre **fluxos de trabalho** de diferentes tipos de gatilho:
    1. Eventos "Antes da Ação" são sempre executados antes dos eventos "Depois da Ação" e "de Aprovação".
    2. Eventos "Depois da Ação" e "de Aprovação" não têm uma ordem específica, e a lógica de negócios não deve depender da ordem de configuração.

## Saiba Mais

Para diferentes tipos de evento de **fluxo de trabalho**, consulte a documentação detalhada dos **plugins** relevantes:

* [Evento Depois da Ação]
* [Evento Antes da Ação]
* [Evento de Aprovação]
* [Evento de Ação Personalizada]