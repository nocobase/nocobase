示例一

```ts
const model = flowEngine.createModel({
    use: 'PageFlowModel',
    tabs: [
        {
            use: 'TabFlowModel'
        },
        {
            use: 'TabFlowModel'
        },
    ],
});
flowEngine.saveModel(model);

class PageFlowModel {
    isNew: boolean;
    one = {};
    many = [];
    onInt(options) {}
    async addMany() {
        const model = this.addSubModel('many', {
            use: 'TabFlowModel',
        });
    }
    async addOne() {
        const model = this.setSubModel('one', {
            use: 'GridFlowModel'
        });
    }
}
```
