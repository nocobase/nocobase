/**
 * moved to examples/js-field-model
 * defaultShowCode: true
 * title: 表单：综合示例（多个 JS 可编辑字段联动 + 校验 + 远程建议 + 计算）
 */
import React from 'react';
import { Application, FilterManager, Plugin } from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card } from 'antd';
import { api } from './api';
import { registerJsFieldDemoModels } from './utils';

class DemoPlugin extends Plugin {
  form: any;
  async load() {
    this.flowEngine.flowSettings.enable();
    this.flowEngine.context.defineProperty('api', { value: api });
    const dsm = this.flowEngine.context.dataSourceManager;
    dsm.getDataSource('main') || dsm.addDataSource({ key: 'main', displayName: 'Main' });
    dsm.getDataSource('main')!.addCollection({
      name: 'orders',
      title: 'Orders',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'bigInt', title: 'ID' },
        { name: 'country', type: 'string', title: 'Country' },
        { name: 'phone', type: 'string', title: 'Phone' },
        { name: 'code', type: 'string', title: 'Code' },
        { name: 'product', type: 'string', title: 'Product' },
        { name: 'tags', type: 'json', title: 'Tags' },
        { name: 'from', type: 'string', title: 'From date' },
        { name: 'to', type: 'string', title: 'To date' },
        { name: 'desc', type: 'string', title: 'Description' },
        { name: 'unitPrice', type: 'double', title: 'Unit price' },
        { name: 'quantity', type: 'double', title: 'Quantity' },
        { name: 'discount', type: 'double', title: 'Discount %' },
        { name: 'total', type: 'double', title: 'Total' },
      ],
    });

    await registerJsFieldDemoModels(this.flowEngine);

    const calcTotalJS = `function calc(){const up=Number(ctx.form?.getFieldValue?.(['unitPrice'])||0);const qty=Number(ctx.form?.getFieldValue?.(['quantity'])||0);const d=Number(ctx.form?.getFieldValue?.(['discount'])||0);const t=Math.max(0,up*qty*(1-d/100));ctx.form?.setFieldValue?.(['total'],t);}calc();`;

    this.form = this.flowEngine.createModel({
      use: 'CreateFormModel',
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'orders' } } },
      subModels: {
        grid: {
          use: 'FormGridModel',
          subModels: {
            items: [
              // Country
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'country' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'country' },
                      },
                      jsSettings: {
                        runJs: {
                          code: `const map={CN:'+86',US:'+1',DE:'+49'};const cur=String(ctx.getValue()||'CN');ctx.element.innerHTML='<select id="cty" style="width:100%;padding:4px 8px">'+\
'<option value="CN" '+(cur==='CN'?'selected':'')+'>中国 (+86)</option>'+\
'<option value="US" '+(cur==='US'?'selected':'')+'>美国 (+1)</option>'+\
'<option value="DE" '+(cur==='DE'?'selected':'')+'>德国 (+49)</option>'+\
'</select>';const el=document.getElementById('cty');el?.addEventListener('change',()=>{ctx.setValue(el.value);const p=map[el.value];const old=String(ctx.form?.getFieldValue?.(['phone'])||'').replace(/^[+][0-9]+ */,'');ctx.form?.setFieldValue?.(['phone'],p+' '+old);});`,
                        },
                      },
                    },
                  },
                },
              },
              // Phone
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'phone' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'phone' } },
                      jsSettings: {
                        runJs: {
                          code: `const v=String(ctx.getValue()||'');ctx.element.innerHTML='<input id="ph" style="width:100%;padding:4px 8px" value="'+v.replace(/"/g,'&quot;')+'" />';document.getElementById('ph')?.addEventListener('input',(e)=>ctx.setValue(String(e.target.value||'')));`,
                        },
                      },
                    },
                  },
                },
              },
              // Product suggest
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'product' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'product' },
                      },
                      jsSettings: {
                        runJs: {
                          code: `const v=String(ctx.getValue()||'');ctx.element.innerHTML='<div><input id="prod" style="width:100%;padding:4px 8px" value="'+v.replace(/"/g,'&quot;')+'" /><ul id="sug" style="list-style:none;padding-left:0;margin:6px 0 0"></ul></div>';const ipt=document.getElementById('prod');const ul=document.getElementById('sug');ipt?.addEventListener('input',async()=>{ctx.setValue(String(ipt.value||''));try{const {data}=await ctx.api.axios.get('/suggest',{params:{keyword:ipt.value}});const items=(data?.items||[]).slice(0,6);ul.innerHTML=items.map(x=>'<li style="padding:2px 4px;cursor:pointer;">'+x+'</li>').join('');Array.from(ul.children).forEach((li)=>li.addEventListener('click',()=>{ipt.value=li.textContent;ctx.setValue(li.textContent);ul.innerHTML='';}));}catch(e){ul.innerHTML='';}});`,
                        },
                      },
                    },
                  },
                },
              },
              // Desc markdown preview
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'desc' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'desc' } },
                      jsSettings: {
                        runJs: {
                          code: `function md(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\\*\\*(.*?)\\*\\*/g,'<b>$1</b>').replace(/__(.*?)__/g,'<i>$1</i>').replace(/\\n/g,'<br/>');}const src=String(ctx.getValue()||'');ctx.element.innerHTML='<div style="display:flex;gap:12px"><textarea id="mk" style="width:50%;height:120px">'+src.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</textarea><div id="pv" style="width:50%;padding:8px;border:1px solid #eee;border-radius:6px;min-height:120px"></div></div>';const mk=document.getElementById('mk');const pv=document.getElementById('pv');pv.innerHTML=md(src);mk?.addEventListener('input',()=>{ctx.setValue(mk.value);pv.innerHTML=md(mk.value);});`,
                        },
                      },
                    },
                  },
                },
              },
              // Code async validate
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'code' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'code' } },
                      jsSettings: {
                        runJs: {
                          code: `ctx.element.innerHTML='<div><input id="cd" style="width:100%;padding:4px 8px" /><div id="msg" style="font-size:12px;margin-top:6px;color:#999">仅允许大写字母与数字，长度 4-8</div></div>';const ip=document.getElementById('cd');const m=document.getElementById('msg');ip?.addEventListener('input',()=>ctx.setValue(String(ip.value||'')));ip?.addEventListener('blur',async()=>{try{const {data}=await ctx.api.axios.post('/validate-code',{value:ip.value});if(data.valid){m.style.color='#52c41a';m.textContent='可用';}else{m.style.color='#ff4d4f';m.textContent=data.message||'不可用';}}catch(e){m.style.color='#ff4d4f';m.textContent='校验失败';}});`,
                        },
                      },
                    },
                  },
                },
              },
              // From / To
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'from' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'from' } },
                      jsSettings: {
                        runJs: {
                          code: `const v=String(ctx.getValue()||'');ctx.element.innerHTML='<input id="f" type="date" value="'+v+'" />';const f=document.getElementById('f');f?.addEventListener('change',()=>{ctx.setValue(f.value);const t=String(ctx.form?.getFieldValue?.(['to'])||'');if(t&&f.value&&t<f.value){ctx.form?.setFieldValue?.(['to'],f.value);}});`,
                        },
                      },
                    },
                  },
                },
              },
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'to' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'to' } },
                      jsSettings: {
                        runJs: {
                          code: `const v=String(ctx.getValue()||'');ctx.element.innerHTML='<input id="t" type="date" value="'+v+'" />';const t=document.getElementById('t');t?.addEventListener('change',()=>{const f=String(ctx.form?.getFieldValue?.(['from'])||'');if(t.value&&f&&t.value<f){t.value=f;}ctx.setValue(t.value);});`,
                        },
                      },
                    },
                  },
                },
              },
              // Tags
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'tags' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'tags' } },
                      jsSettings: {
                        runJs: {
                          code: `const arr=Array.isArray(ctx.getValue())?ctx.getValue():[];ctx.element.innerHTML='<div><div id="chips" style="margin-bottom:6px"></div><input id="tg" style="width:100%;padding:4px 8px" placeholder="输入后回车添加"/></div>';const chips=document.getElementById('chips');const ipt=document.getElementById('tg');function render(){chips.innerHTML=(ctx.getValue()||[]).map((t,i)=>'<span data-i="'+i+'" style="display:inline-block;margin:2px;padding:2px 6px;background:#f5f5f5;border-radius:10px;cursor:pointer">'+t+' ✕</span>').join('');Array.from(chips.children).forEach(el=>el.addEventListener('click',()=>{const i=Number(el.getAttribute('data-i'));const a=(ctx.getValue()||[]).slice();a.splice(i,1);ctx.setValue(a);render();}));}ctx.setValue(arr);render();ipt?.addEventListener('keydown',(e)=>{if(e.key==='Enter'){e.preventDefault();const v=ipt.value.trim();if(v){const a=(ctx.getValue()||[]).slice();a.push(v);ctx.setValue(a);ipt.value='';render();}}});`,
                        },
                      },
                    },
                  },
                },
              },
              // Unit price / Quantity / Discount / Total
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'unitPrice' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'unitPrice' },
                      },
                      jsSettings: {
                        runJs: {
                          code: `const v=String(ctx.getValue()||'');ctx.element.innerHTML='<input id="up" type="number" step="0.01" min="0" style="width:100%;padding:4px 8px" value="'+v+'" />';const el=document.getElementById('up');el?.addEventListener('input',()=>{ctx.setValue(el.value); ${calcTotalJS} });`,
                        },
                      },
                    },
                  },
                },
              },
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'quantity' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'quantity' },
                      },
                      jsSettings: {
                        runJs: {
                          code: `const v=String(ctx.getValue()||'');ctx.element.innerHTML='<input id="qt" type="number" step="1" min="0" style="width:100%;padding:4px 8px" value="'+v+'" />';const el=document.getElementById('qt');el?.addEventListener('input',()=>{ctx.setValue(el.value); ${calcTotalJS} });`,
                        },
                      },
                    },
                  },
                },
              },
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'discount' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'discount' },
                      },
                      jsSettings: {
                        runJs: {
                          code: `const v=Number(ctx.getValue()||0);ctx.element.innerHTML='<div style="display:flex;gap:8px;align-items:center"><input id="ds" type="range" min="0" max="100" value="'+v+'"/><span id="dsv" style="width:40px;text-align:right">'+v+'%</span></div>';const sl=document.getElementById('ds');const sv=document.getElementById('dsv');function sync(){sv.textContent=sl.value+'%';ctx.setValue(sl.value); ${calcTotalJS} }sl?.addEventListener('input',sync);sync();`,
                        },
                      },
                    },
                  },
                },
              },
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'total' } },
                },
                subModels: {
                  field: {
                    use: 'JSFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'total' } },
                      jsSettings: {
                        runJs: {
                          code: `const v=Number(ctx.form?.getFieldValue?.(['total'])||0);ctx.element.innerHTML='<span style="font-weight:700;color:#1890ff">￥'+v.toFixed(2)+'</span>';`,
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
        actions: [{ use: 'FormSubmitActionModel', stepParams: { buttonSettings: { general: { title: 'Submit' } } } }],
      },
    });

    this.form.context.defineProperty('filterManager', { value: new FilterManager(this.form) });

    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <Card style={{ margin: 12 }} title="Complex Order Form（多个 JS 字段联动）">
            <FlowModelRenderer model={this.form} showFlowSettings />
          </Card>
        </FlowEngineProvider>
      ),
    });
  }
}

export default new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [DemoPlugin],
}).getRootComponent();
