import { Chart } from '../chart';

export class AntdChart extends Chart {
  getReference() {
    return {
      title: this.title,
      link: `https://ant.design/components/${this.name}`,
    };
  }
}
