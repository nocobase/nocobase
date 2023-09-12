import { NodeView } from '@antv/x6';

export class SimpleNodeView extends NodeView {
  protected renderMarkup() {
    return this.renderJSONMarkup({
      tagName: 'rect',
      selector: 'body',
    });
  }

  update() {
    const attrs = this.cell.getAttrs();
    const fill = attrs.hightLight ? '#1890ff' : 'gray';
    super.update({
      body: {
        refWidth: '50px',
        refHeight: '100px',
        fill: fill,
      },
    });
  }
}
