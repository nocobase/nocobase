/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  name: 'js-field-model',
  content: String.raw`# JSFieldModel

用于以 JavaScript 自定义字段的只读展示。典型用于：
- 表格列中的字段只读渲染（搭配 TableBlock）。
- 详情页的字段只读渲染（搭配 DetailsBlock）。

支持在“JavaScript settings”中编写并运行脚本，脚本通过 \`ctx\` 上下文读写容器、读取当前字段值与记录，并可结合视图能力（drawer/dialog）实现交互扩展。

## JSFieldModel 可用上下文（常用）
- \`ctx.element\`：ElementProxy（安全封装的 DOM 容器）。常用 \`innerHTML\` 写入内容，或 \`addEventListener\` 绑定事件。
- \`ctx.value\`：当前字段值（只读形态）。
- \`ctx.record\`：当前记录数据对象（在表格/详情中可用）。
- \`ctx.collection\`：当前集合对象，可获取字段定义、主键等元信息。
- \`ctx.viewer\`：视图控制器，支持 \`drawer\`、\`dialog\`、\`popover\`、\`embed\` 等能力。
- \`ctx.api\`：API 客户端，可发起请求（如读取/更新数据）。
- \`ctx.t\`：国际化函数，用于界面文案翻译。

说明：
- JSFieldModel 在运行时会为容器注册 \`ctx.element\`，并在只读场景下提供 \`ctx.value\`；所在区块为集合块时会透传 \`ctx.collection\`、\`ctx.record\` 等。
- 所有 DOM 操作务必在 \`ctx.element\` 内进行，避免直接访问 \`document\` 带来的 XSS 风险。

## 常见场景
- 详情页：格式化金额/时间、拼接多个字段展示、生成只读的富文本展示。
- 表格列：根据值动态着色、组合多个字段生成标签、显示状态图标和说明。

## 示例：详情页字段格式化（金额 + 折扣）
\`\`\`javascript
const price = Number(ctx.value ?? ctx.record?.price) || 0;
const discount = Number(ctx.record?.discount || 0);
const finalPrice = price * (1 - discount);
const fmt = (n) => '¥' + (Number(n) || 0).toFixed(2);

ctx.element.innerHTML =
  '<div style="font:14px/1.6 -apple-system,BlinkMacSystemFont,system-ui,Roboto,sans-serif;">' +
    '<div><strong>应付金额：</strong><span style="color:#52c41a;">' + fmt(finalPrice) + '</span></div>' +
    '<div style="color:#999">原价 ' + fmt(price) + '，折扣 ' + (discount * 100).toFixed(0) + '%</div>' +
  '</div>';
\`\`\`

## 示例：表格列只读渲染（状态徽标）
\`\`\`javascript
const status = String(ctx.value ?? ctx.record?.status ?? '').toLowerCase();
const color = status === 'done' ? '#52c41a' : status === 'pending' ? '#faad14' : '#ff4d4f';
const text = status || 'unknown';
const html = '<span style="display:inline-flex;align-items:center;gap:6px;">'
  + '<i style="width:8px;height:8px;border-radius:50%;background:' + color + ';display:inline-block;"></i>'
  + '<span style="color:' + color + ';text-transform:capitalize;">' + text + '</span>'
  + '</span>';
ctx.element.innerHTML = html;
\`\`\`

## 进阶提示
- 可通过 \`ctx.viewer.drawer({ content: ... })\` 打开抽屉查看扩展信息；
- 如需跨字段取值，可用 \`ctx.record\` 拼接显示；
- 需要在表单中“可编辑”的 JS 字段，请使用 JSEditableFieldModel。

## 跨区块弹窗（openView）
可通过 \`ctx.openView(viewId, { ... })\` 打开视图，可以用于跨区块跨页面打开抽屉/对话框。

示例
\`\`\`javascript
ctx.element.innerHTML = '<a href="javascript:;" style="color:#1677ff;">打开按钮弹窗</a>';
ctx.element.querySelector('a')?.addEventListener('click', () => {
  ctx.openView('targetViewId', {
    from: 'JSFieldModel',
    time: new Date().toISOString(),
    note: '通过 openView 打开按钮的弹窗',
  });
});
\`\`\`

示例

\`\`\`javascript
const targetUid = '<目标按钮UID>'; // 替换成目标按钮uid

ctx.element.innerHTML = '<a href="javascript:;" style="color:#1677ff;">查看详情</a>';
ctx.element.querySelector('a')?.addEventListener('click', async () => {
  await ctx.openView('targetViewId', {
    from: 'JSFieldModel',
    time: new Date().toISOString(),
    note: '通过 openView 打开按钮的弹窗',
  });
});
\`\`\`

示例（目标区块：监听事件并打开抽屉）

\`\`\`typescript
// 在目标区块的模型中注册监听（伪代码/示意）
MyBlockModel.registerFlow({
  key: 'demo',
  on: 'click',
  steps: {
    show: {
      async handler(ctx) {
        await ctx.viewer.drawer({
          width: '56%',
          content: \`<div style="padding:16px"><pre>Hello NocoBase!</pre></div>\`,
        });
      },
    },
  },
});
\`\`\`

# JSEditableFieldModel

用于在表单项中以 JavaScript 自定义“可编辑字段”的输入体验。典型用于：
- 自定义输入控件（原生 input/select、第三方库封装等）；
- 通过 API 动态加载可选项、联动刷新；
- 复杂的校验、格式化与与表单的双向同步。

可在“JavaScript settings”中编写脚本，运行时通过 \`ctx\` 上下文读写容器与表单值。

## JSEditableFieldModel 可用上下文（常用）
- \`ctx.element\`：ElementProxy（容器），脚本内用它读写 DOM。
- \`ctx.getValue()\` / \`ctx.setValue(v)\`：获取/设置当前字段值（与表单双向绑定）。
- \`ctx.namePath\`：当前字段的 \`namePath\`。
- \`ctx.disabled\`、\`ctx.readOnly\`：禁用/只读状态。
- \`ctx.form\`：AntD Form 实例，可读写其它字段或做校验。
- \`ctx.api\`：API 客户端，可发起 HTTP 请求（可搭配 Mock 使用）。
- \`ctx.viewer\`：视图控制器（drawer/dialog/popover/embed）。

说明：
- 所有 DOM 操作需在 \`ctx.element\` 下进行，避免直接访问 \`document\` 导致 XSS 风险；
- 需要只读展示时请使用 \`JSFieldModel\`。

## 示例：通过 API 加载下拉可选项
\`\`\`javascript
// 初始化容器结构（使用字符串拼接避免模板字符串嵌套）
ctx.element.innerHTML =
  '<div style="display:flex;gap:8px;align-items:center;width:100%">' +
  '  <select class="js-select" style="flex:1;padding:4px 8px;border:1px solid #d9d9d9;border-radius:6px;height:32px"></select>' +
  '  <button type="button" class="js-refresh" style="height:32px;padding:0 10px;border:1px solid #1677ff;background:#1677ff;color:#fff;border-radius:6px;cursor:pointer;">刷新</button>' +
  '</div>';

var selectEl = ctx.element.querySelector('.js-select');
var refreshBtn = ctx.element.querySelector('.js-refresh');

// 渲染下拉选项（避免使用反引号与模板占位符嵌套）
var renderOptions = function(items) {
  var current = String(ctx.getValue() == null ? '' : ctx.getValue());
  selectEl.innerHTML = (Array.isArray(items) ? items : []).map(function(it) {
    return '<option value="' + it.value + '">' + it.label + '</option>';
  }).join('');
  // 恢复当前已选值（如仍存在）
  if (current) {
    var exists = items.some(function(it) { return String(it.value) === current; });
    if (exists) selectEl.value = current;
  }
};

// 远程加载 options（可扩展为携带 keyword 等参数）
var loadOptions = async function() {
  // 简单的加载态
  selectEl.innerHTML = '<option>加载中...</option>';
  try {
    var res = await ctx.request({ url: 'categories:list', method: 'get', params: {} });
    var items = (res && res.data) || [];
    renderOptions(Array.isArray(items) ? items : (items.data || []));
  } catch (e) {
    // 失败兜底
    renderOptions([]);
  }
};

// 绑定交互：变更时写回表单；外部值变化时更新选中
selectEl && selectEl.addEventListener('change', function(e) { ctx.setValue(e.target.value); });
ctx.element.addEventListener('js-field:value-change', function(ev) {
  if (!selectEl) return;
  var v = ev.detail == null ? '' : String(ev.detail);
  selectEl.value = v;
});
refreshBtn && refreshBtn.addEventListener('click', function() { loadOptions(); });

// 初次加载
loadOptions();
\`\`\`

## 示例：远程搜索（防抖 + 实时建议）
\`\`\`javascript
// 结构：输入关键词 -> 防抖搜索 -> 渲染下方下拉框 -> 选择写回值
ctx.element.innerHTML =
  '<div style="display:flex;gap:8px;align-items:center;width:100%">' +
  '  <input class="js-keyword" placeholder="输入关键词搜索" style="flex:1;padding:4px 8px;border:1px solid #d9d9d9;border-radius:6px;height:32px" />' +
  '</div>' +
  '<div style="margin-top:8px">' +
  '  <select class="js-results" style="width:100%;padding:4px 8px;border:1px solid #d9d9d9;border-radius:6px;height:32px"></select>' +
  '</div>';

var inputEl = ctx.element.querySelector('.js-keyword');
var selectEl = ctx.element.querySelector('.js-results');

// 简单防抖
var debounce = function(fn, delay) {
  var timer = null; return function() { var args = arguments, self = this; clearTimeout(timer); timer = setTimeout(function(){ fn.apply(self, args); }, delay); };
};

var renderOptions = function(items) {
  var current = String(ctx.getValue() == null ? '' : ctx.getValue());
  selectEl.innerHTML = (Array.isArray(items) ? items : []).map(function(it){
    return '<option value="' + it.value + '">' + it.label + '</option>';
  }).join('');
  if (current) selectEl.value = current;
};

var doSearch = async function(keyword) {
  selectEl.innerHTML = '<option>搜索中...</option>';
  try {
    var res = await ctx.request({ url: 'categories:search', method: 'get', params: { q: keyword || '' } });
    var items = (res && res.data) || [];
    renderOptions(Array.isArray(items) ? items : (items.data || []));
  } catch (e) {
    renderOptions([]);
  }
};

// 交互绑定
inputEl && inputEl.addEventListener('input', debounce(function(e){ doSearch(e.target.value); }, 300));
selectEl && selectEl.addEventListener('change', function(e){ ctx.setValue(e.target.value); });
ctx.element.addEventListener('js-field:value-change', function(ev){ if (selectEl) selectEl.value = String(ev.detail == null ? '' : ev.detail); });

// 初次加载
doSearch('');
\`\`\`

## 示例：远程搜索（虚拟滚动列表）
\`\`\`javascript
// 结构：输入框 + 可滚动容器（虚拟列表）
ctx.element.innerHTML =
  '<div style="display:flex;gap:8px;align-items:center;width:100%">' +
  '  <input class="js-keyword" placeholder="搜索 Item" style="flex:1;padding:4px 8px;border:1px solid #d9d9d9;border-radius:6px;height:32px" />' +
  '</div>' +
  '<div class="js-viewport" style="margin-top:8px;position:relative;height:240px;overflow:auto;border:1px solid #eee;border-radius:6px">' +
  '  <div class="js-spacer" style="height:0"></div>' +
  '  <div class="js-list" style="position:absolute;left:0;right:0;top:0"></div>' +
  '</div>';

var inputEl = ctx.element.querySelector('.js-keyword');
var viewport = ctx.element.querySelector('.js-viewport');
var spacer = ctx.element.querySelector('.js-spacer');
var list = ctx.element.querySelector('.js-list');

var all = [];
var itemHeight = 32; // 每项高度（需与 render 一致）
var buffer = 5; // 预加载 Buffer

var debounce = function(fn, delay){ var timer=null; return function(){ var args=arguments,self=this; clearTimeout(timer); timer=setTimeout(function(){ fn.apply(self,args); }, delay); } };

var renderSlice = function(start){
  var viewportHeight = viewport.clientHeight || 240;
  var visibleCount = Math.ceil(viewportHeight / itemHeight) + buffer;
  var end = Math.min(start + visibleCount, all.length);
  // 偏移定位
  var offsetY = start * itemHeight;
  list.style.transform = 'translateY(' + offsetY + 'px)';
  // 构造 HTML 片段
  var html = '';
  for (var i = start; i < end; i++) {
    var it = all[i];
    var selected = String(ctx.getValue()==null?'':ctx.getValue()) === String(it.value);
    html += '<div class="js-row" data-value="' + it.value + '" style="height:' + itemHeight + 'px;line-height:' + itemHeight + 'px;padding:0 8px;cursor:pointer;' + (selected?'background:#e6f4ff;':'') + '">' + it.label + '</div>';
  }
  list.innerHTML = html;
};

var updateVirtual = function(){
  var scrollTop = viewport.scrollTop || 0;
  var start = Math.floor(scrollTop / itemHeight);
  renderSlice(start);
};

var renderData = function(items){
  all = Array.isArray(items) ? items : [];
  spacer.style.height = String(all.length * itemHeight) + 'px';
  viewport.scrollTop = 0;
  renderSlice(0);
};

var doSearch = async function(keyword){
  list.innerHTML = '<div style="padding:8px;color:#999;">加载中...</div>';
  try { var res = await ctx.request({ url: 'biglist:search', method: 'get', params: { q: keyword || '' } }); var items = (res && res.data) || []; renderData(Array.isArray(items) ? items : (items.data || [])); } catch(e) { renderData([]); }
};

// 事件绑定
inputEl && inputEl.addEventListener('input', debounce(function(e){ doSearch(e.target.value); }, 300));
viewport && viewport.addEventListener('scroll', function(){ updateVirtual(); });
list && list.addEventListener('click', function(e){
  var target = e.target || e.srcElement; if (!target) return; var row = target.closest ? target.closest('.js-row') : null; if (!row) return;
  var v = row.getAttribute('data-value'); ctx.setValue(v);
  updateVirtual(); // 重新渲染以体现选中态
});
ctx.element.addEventListener('js-field:value-change', function(){ updateVirtual(); });

// 初次加载
doSearch('');
\`\`\`

## 示例：级联下拉（父子联动 + 监听表单变更）
\`\`\`javascript
ctx.element.innerHTML = '<select class="js-parent" style="width:100%;padding:4px 8px;border:1px solid #d9d9d9;border-radius:6px;height:32px"></select>';
var el = ctx.element.querySelector('.js-parent');
var renderOptions = function(items) {
  var current = String(ctx.getValue() == null ? '' : ctx.getValue());
  var list = Array.isArray(items) ? items : [];
  el.innerHTML = list.map(function(it){ return '<option value="' + it.value + '">' + it.label + '</option>'; }).join('');
  if (current) {
    el.value = current;
  } else if (list.length) {
    var first = String(list[0].value);
    el.value = first;
    ctx.setValue(first);
  }
};
var loadParents = async function(){
  el.innerHTML = '<option>加载中...</option>';
  try { var res = await ctx.request({ url: 'categories:parents', method: 'get', params: {} }); var items = (res && res.data) || []; renderOptions(Array.isArray(items) ? items : (items.data || [])); } catch(e) { renderOptions([]); }
};
el && el.addEventListener('change', function(e){ ctx.setValue(e.target.value); });
ctx.element.addEventListener('js-field:value-change', function(ev){ if (el) el.value = String(ev.detail == null ? '' : ev.detail); });
loadParents();
\`\`\`

## 示例：跨区块联动（Block 间同步）
\`\`\`javascript
// 渲染父类选择框
ctx.element.innerHTML = '<select class="js-parent" style="width:100%;padding:4px 8px;border:1px solid #d9d9d9;border-radius:6px;height:32px"></select>';
var selectEl = ctx.element.querySelector('.js-parent');
var peerUid = '\${RIGHT_BLOCK_UID}';

// 通知子区块刷新子类列表
var notifyPeer = function(parentId){
  var peerBlock = ctx.engine.getModel(peerUid);
  if (!peerBlock.getFlow('syncFromParent')) {
    setTimeout(function(){ notifyPeer(parentId); }, 0);
    return;
  }
  peerBlock.applyFlow('syncFromParent', { parentId: parentId });
};

// 渲染父类选项并同步表单/子区块
var renderOptions = function(items){
  var list = Array.isArray(items) ? items : [];
  var current = String(ctx.getValue() == null ? '' : ctx.getValue());
  selectEl.innerHTML = list.map(function(it){ return '<option value="' + it.value + '">' + it.label + '</option>'; }).join('');
  if (current && list.some(function(it){ return String(it.value) === current; })) {
    selectEl.value = current;
  } else if (list.length) {
    var first = String(list[0].value);
    selectEl.value = first;
    ctx.setValue(first);
    notifyPeer(first);
    return;
  } else {
    selectEl.value = '';
    ctx.setValue('');
    notifyPeer('');
  }
  notifyPeer(selectEl.value);
};

// 加载父类列表
var loadParents = async function(){
  selectEl.innerHTML = '<option>加载中...</option>';
  try {
    var res = await ctx.request({ url: 'categories:parents', method: 'get', params: {} });
    var items = (res && res.data) || [];
    renderOptions(Array.isArray(items) ? items : (items.data || []));
  } catch (err) {
    renderOptions([]);
  }
};

if (selectEl) {
  selectEl.addEventListener('change', function(e){
    var value = e.target.value;
    ctx.setValue(value);
    notifyPeer(value);
  });
}

ctx.element.addEventListener('js-field:value-change', function(ev){
  var next = ev.detail == null ? '' : String(ev.detail);
  if (selectEl) {
    var prev = selectEl.value;
    if (prev !== next) {
      selectEl.value = next;
      notifyPeer(next);
    }
  }
});

loadParents();
\`\`\`

## 示例：多选标签（可创建）
\`\`\`javascript
// 结构：已选标签 + 输入框 + 建议面板
ctx.element.innerHTML =
  '<div class="js-tags" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px"></div>' +
  '<div style="display:flex;gap:8px;align-items:center;width:100%">' +
  '  <input class="js-input" placeholder="输入后回车创建或选择" style="flex:1;padding:4px 8px;border:1px solid #d9d9d9;border-radius:6px;height:32px" />' +
  '  <button type="button" class="js-add" style="height:32px;padding:0 10px;border:1px solid #1677ff;background:#1677ff;color:#fff;border-radius:6px;cursor:pointer;">添加</button>' +
  '</div>' +
  '<div class="js-suggest" style="margin-top:8px;border:1px solid #eee;border-radius:6px;display:none"></div>';

var tagsWrap = ctx.element.querySelector('.js-tags');
var inputEl = ctx.element.querySelector('.js-input');
var addBtn = ctx.element.querySelector('.js-add');
var suggest = ctx.element.querySelector('.js-suggest');

var debounce = function(fn, delay){ var timer=null; return function(){ var args=arguments,self=this; clearTimeout(timer); timer=setTimeout(function(){ fn.apply(self,args); }, delay); } };

var getValueArr = function(){ var v = ctx.getValue(); return Array.isArray(v) ? v.slice() : (v ? [v] : []); };
var setValueArr = function(arr){ ctx.setValue(arr); };

var renderTags = function(){
  var arr = getValueArr();
  if (!tagsWrap) return;
  var html = arr.map(function(t){
    return '<span class="js-tag" data-v="' + t + '" style="display:inline-flex;align-items:center;gap:6px;background:#f5f5f5;border:1px solid #d9d9d9;border-radius:999px;padding:0 8px;height:24px;line-height:24px;">' +
      '<span>' + t + '</span>' +
      '<i class="js-remove" style="cursor:pointer;color:#999">×</i>' +
    '</span>';
  }).join('');
  tagsWrap.innerHTML = html;
};

var addTag = function(t){
  var v = String(t || '').trim(); if (!v) return;
  var arr = getValueArr(); if (arr.indexOf(v) === -1) { arr.push(v); setValueArr(arr); renderTags(); }
  if (inputEl) inputEl.value=''; hideSuggest();
};

var removeTag = function(t){
  var arr = getValueArr().filter(function(x){ return x !== t; }); setValueArr(arr); renderTags();
};

var showSuggest = function(items){
  if (!suggest) return;
  var arr = Array.isArray(items) ? items : [];
  if (!arr.length) { hideSuggest(); return; }
  suggest.style.display = 'block';
  suggest.innerHTML = arr.map(function(x){ return '<div class="js-opt" data-v="' + x + '" style="padding:6px 8px;cursor:pointer">' + x + '</div>'; }).join('');
};
var hideSuggest = function(){ if (!suggest) return; suggest.style.display = 'none'; suggest.innerHTML = ''; };

var search = async function(q){
  if (!q) { hideSuggest(); return; }
  try { var res = await ctx.request({ url: 'tags:search', method: 'get', params: { q: q } }); var items = (res && res.data) || []; showSuggest(Array.isArray(items) ? items : (items.data || [])); } catch(e) { hideSuggest(); }
};

// 初始化标签
renderTags();

// 交互
tagsWrap && tagsWrap.addEventListener('click', function(e){ var t = e.target || e.srcElement; if (!t) return; var tag = t.closest ? t.closest('.js-tag') : null; if (!tag) return; if ((t.className||'').indexOf('js-remove')>-1){ removeTag(tag.getAttribute('data-v')); } });
addBtn && addBtn.addEventListener('click', function(){ addTag(inputEl ? inputEl.value : ''); });
inputEl && inputEl.addEventListener('keydown', function(e){ if (e.key === 'Enter') { e.preventDefault(); addTag(inputEl.value); } });
inputEl && inputEl.addEventListener('input', debounce(function(e){ search(e.target.value); }, 300));
suggest && suggest.addEventListener('click', function(e){ var t = e.target || e.srcElement; if (!t) return; var opt = t.closest ? t.closest('.js-opt') : null; if (!opt) return; addTag(opt.getAttribute('data-v')); });
ctx.element.addEventListener('js-field:value-change', function(){ renderTags(); });
\`\`\``,
};
