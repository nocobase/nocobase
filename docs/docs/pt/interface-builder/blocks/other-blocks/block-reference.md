---
pkg: "@nocobase/plugin-block-reference"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Bloco de Referência

## Introdução
O Bloco de Referência exibe um bloco já configurado diretamente na página atual, usando o UID do bloco de destino, sem a necessidade de reconfigurá-lo.

## Ativar o plugin
Este plugin é integrado, mas vem desativado por padrão.
Abra o "Gerenciador de plugins" → encontre "Bloco: Referência" → clique em "Ativar".

![Ativar Bloco de Referência (Gerenciador de plugins)](https://static-docs.nocobase.com/block-reference-enable-20251102.png)

## Como Adicionar o Bloco
1) Adicione um bloco → Grupo "Outros blocos" → selecione "Bloco de Referência".  
2) Nas "Configurações de Referência", configure:
   - ``UID do Bloco``: o UID do bloco de destino
   - ``Modo de Referência``: escolha ``Referência`` ou ``Copiar``

![Demonstração de adição e configuração do Bloco de Referência](https://static-docs.nocobase.com/20251102193949_rec_.gif)

### Como Obter o UID do Bloco
- Abra o menu de configurações do bloco de destino e clique em ``Copiar UID`` para copiar o UID dele.  

![Exemplo de como copiar o UID do bloco](https://static-docs.nocobase.com/block-reference-copy-uid-20251102.png)

## Modos e Comportamento
- ``Referência`` (padrão)
  - Compartilha a mesma configuração que o bloco original; modificações feitas no original ou em qualquer lugar onde ele é referenciado atualizarão todas as referências.

- ``Copiar``
  - Cria um bloco independente idêntico ao original no momento da cópia; alterações posteriores não são sincronizadas entre eles.

## Configuração
- Bloco de Referência:
  - ``Configurações de Referência``: usado para especificar o UID do bloco de destino e selecionar o modo "Referência/Copiar";
  - Ao mesmo tempo, você verá as configurações completas do bloco referenciado (equivalente a configurar o bloco original diretamente).

![Interface de configurações do Bloco de Referência](https://static-docs.nocobase.com/block-reference-settings-20251102.png)

- Bloco Copiado:
  - O bloco resultante da cópia tem o mesmo tipo que o original e contém apenas as suas próprias configurações;
  - Não inclui as ``Configurações de Referência``.

## Estados de Erro e Substituição
- Quando o destino está ausente ou inválido: exibe uma mensagem de erro. Você pode reconfigurar nas configurações do Bloco de Referência (``Configurações de Referência`` → ``UID do Bloco``) e salvar para restaurar a exibição.  

![Estado de erro quando o bloco de destino é inválido](https://static-docs.nocobase.com/block-reference-error-20251102.png)

## Observações e Limitações
- Recurso experimental — use com cautela em ambientes de produção.
- Ao copiar um bloco, algumas configurações que dependem do UID de destino podem precisar ser reconfiguradas.
- Todas as configurações de um bloco de referência são sincronizadas automaticamente, incluindo configurações como "escopo de dados". No entanto, um bloco de referência pode ter sua própria [configuração de fluxo de eventos](/interface-builder/event-flow/). Com fluxos de eventos e ações JavaScript personalizadas, você pode alcançar indiretamente diferentes escopos de dados ou configurações relacionadas por referência.