:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Editar Modal

## Introdução

Qualquer ação ou campo que abre um modal ao ser clicado permite configurar o modo de abertura, o tamanho e outras opções do modal.

![20251027212617](https://static-docs.nocobase.com/20251027212617.png)

![20251027212800](https://static-docs.nocobase.com/20251027212800.png)

## Modo de Abertura

- Gaveta

![20251027212832](https://static-docs.nocobase.com/20251027212832.png)

- Diálogo

![20251027212905](https://static-docs.nocobase.com/20251027212905.png)

- Subpágina

![20251027212940](https://static-docs.nocobase.com/20251027212940.png)

## Tamanho do Modal

- Grande
- Médio (padrão)
- Pequeno

## UID do Pop-up

O "UID do Pop-up" é o UID do componente que abre o pop-up; ele também corresponde ao segmento `viewUid` em `view/:viewUid` na barra de endereço atual. Você pode obtê-lo rapidamente no campo ou botão que aciona o pop-up, clicando em "Copiar UID do pop-up" no menu de configurações. Definir o UID do pop-up permite a reutilização de pop-ups.

![popup-copy-uid-20251102](https://static-docs.nocobase.com/popup-copy-uid-20251102.png)

### Pop-up interno (padrão)
- O "UID do Pop-up" é igual ao UID do botão de ação atual (por padrão, ele usa o UID deste botão).

### Pop-up externo (reutilizar um pop-up existente)
- No campo "UID do Pop-up", insira o UID de um botão de acionamento de outro local (ou seja, o UID do pop-up) para reutilizar aquele pop-up.
- Uso típico: Compartilhar a mesma interface e lógica de pop-up entre várias páginas/blocos, evitando configurações duplicadas.
- Ao usar um pop-up externo, algumas configurações não podem ser modificadas (veja abaixo).

## Outras configurações relacionadas

- `Data source / Collection`: Somente leitura. Indica a **fonte de dados** e a **coleção** à qual o pop-up está vinculado; por padrão, ele segue a **coleção** do bloco atual. No modo de pop-up externo, ele segue a configuração do pop-up de destino e não pode ser alterado.
- `Association name`: Opcional. Usado para abrir o pop-up a partir de um campo de associação; exibido apenas quando um valor padrão existe. No modo de pop-up externo, ele segue a configuração do pop-up de destino e não pode ser alterado.
- `Source ID`: Exibido apenas quando `Association name` está definido; usa por padrão o `sourceId` do contexto atual; pode ser alterado para uma variável ou um valor fixo, conforme necessário.
- `filterByTk`: Pode ser vazio, uma variável opcional ou um valor fixo, usado para restringir os registros de dados que o pop-up carrega.

![popup-config-20251102](https://static-docs.nocobase.com/popup-config-20251102.png)