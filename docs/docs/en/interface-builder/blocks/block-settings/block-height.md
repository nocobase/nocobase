# Block Height

## Introduction

Block height supports three modes: **Default height**, **Specified height**, and **Full height**. Most blocks support height settings.

![20260211153947](https://static-docs.nocobase.com/20260211153947.png)

![20260211154020](https://static-docs.nocobase.com/20260211154020.png)

## Height Modes

### Default Height

Different types of blocks have different default height strategies. For example, Table and Form blocks automatically adjust their height based on content, and scrollbars will not appear inside the block.

### Specified Height

You can manually specify the total height of the block's outer frame. The internal area of the block will automatically calculate and allocate the available height.

![20260211154043](https://static-docs.nocobase.com/20260211154043.gif)

### Full Height

Full height mode is similar to specified height, where the block height is calculated based on the current browser's **viewport** to fill the maximum screen height. No scrollbars appear on the browser page; scrollbars only appear inside the block.

Internal scrolling behavior in full height mode varies slightly across different blocks:

- **Table**: Internal scrolling within the `tbody`;
- **Form / Details**: Scrolling within the Grid (content scrolls except for the action area);
- **List / Grid Card**: Scrolling within the Grid (content scrolls except for the action area and pagination bar);
- **Map / Calendar**: Overall adaptive height, no scrollbars;
- **Iframe / Markdown**: Limits the total height of the block's outer frame, with scrollbars appearing inside the block.

#### Full Height Table

![20260211154204](https://static-docs.nocobase.com/20260211154204.gif)

#### Full Height Form

![20260211154335](https://static-docs.nocobase.com/20260211154335.gif)
