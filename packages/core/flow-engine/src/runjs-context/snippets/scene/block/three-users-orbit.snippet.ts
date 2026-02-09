/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';
import { JSBlockRunJSContext } from '../../../contexts/JSBlockRunJSContext';

const snippet: SnippetModule = {
  contexts: [JSBlockRunJSContext],
  prefix: 'sn-three-users-orbit',
  label: 'Users orbit (three.js)',
  description: 'Fetch users:list and render a rotating 3D orbit of users with hover/click',
  locales: {
    'zh-CN': {
      label: 'Three.js 用户轨道',
      description: '从 users:list 加载用户，并以 3D 轨道方式展示（支持悬停高亮与点击提示）',
    },
  },
  content: `
// Container
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '360px';
container.style.position = 'relative';
container.style.borderRadius = '10px';
container.style.overflow = 'hidden';
container.style.background = 'radial-gradient(700px 300px at 20% 25%, #172036, #0b0f19 60%), radial-gradient(600px 240px at 80% 70%, rgba(56,189,248,0.12), transparent 60%)';
ctx.render(container);

// 不做显式清理逻辑；如需存储信息，统一挂在 ctx.model 上

// 使用 ctx.initResource 加载 users:list（真实数据）
ctx.initResource('MultiRecordResource');
const resource = ctx.resource;
resource.setDataSourceKey && resource.setDataSourceKey('main');
resource.setResourceName && resource.setResourceName('users');
resource.setPageSize && resource.setPageSize(50);
try {
  await resource.refresh();
} catch (err) {
  var msg = (err && err.message) ? err.message : 'users:list 请求失败';
  container.innerHTML = '<div style="color:#cbd5e1; padding: 12px; text-align:center;">' + msg + '</div>';
  throw err;
}

// Helpers: generate avatar textures (emoji or initials)
function makeAvatarTexture(user, idx) {
  const canvas = document.createElement('canvas');
  const size = 128;
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  // background circle with subtle gradient
  const palettes = ['#60a5fa','#34d399','#fbbf24','#f472b6','#a78bfa','#f87171','#22d3ee'];
  const c1 = palettes[idx % palettes.length];
  const grad = g.createRadialGradient(size*0.35, size*0.35, 10, size*0.5, size*0.5, size*0.6);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, '#111827');
  g.fillStyle = grad;
  g.beginPath();
  g.arc(size/2, size/2, size*0.48, 0, Math.PI*2);
  g.fill();
  // border
  g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,0.25)';
  g.stroke();
  // content: emoji if possible, else initials
  const emojis = ['😀','😎','🚀','🌟','🎉','🧠','🐼','🦊','🐯','🦄','🍀','🍕','⚡️','🔥','❤️'];
  const text = emojis[idx % emojis.length];
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = 'bold 68px system-ui, -apple-system, Segoe UI Emoji, Noto Color Emoji, Apple Color Emoji';
  g.fillStyle = '#fff';
  g.fillText(text, size/2, size/2 + 4);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const THREE = await ctx.importAsync('three@0.160.0');
const { Scene, PerspectiveCamera, WebGLRenderer, Color, AmbientLight, DirectionalLight, Group, Mesh, MeshStandardMaterial, SphereGeometry, Raycaster, Vector2 } = THREE;

const scene = new Scene();
scene.background = new Color(0x0b0f19);

const camera = new PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(0, 1.2, 6.5);

const renderer = new WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(1); // sandbox-friendly
container.appendChild(renderer.domElement);

scene.add(new AmbientLight(0xffffff, 0.8));
const dir = new DirectionalLight(0xffffff, 0.6);
dir.position.set(2.5, 3.0, 4.0);
scene.add(dir);

const orbit = new Group();
scene.add(orbit);

const users = (resource && resource.getData && Array.isArray(resource.getData())) ? resource.getData() : [];
if (!users.length) {
  container.innerHTML = '<div style="color:#cbd5e1; padding: 12px; text-align:center;">users:list 接口无数据</div>';
  return;
}
const N = users.length;
const R = 2.8;
// background starfield
const starCount = 500;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const r = 10 * Math.pow(Math.random(), 0.7) + 4;
  const th = Math.random() * Math.PI * 2;
  const ph = Math.acos(2 * Math.random() - 1);
  starPos[i*3+0] = r * Math.sin(ph) * Math.cos(th);
  starPos[i*3+1] = r * Math.cos(ph) * 0.5;
  starPos[i*3+2] = r * Math.sin(ph) * Math.sin(th);
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, transparent: true, opacity: 0.8 });
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

const items = [];
for (let i = 0; i < N; i++) {
  const u = users[i];
  const a = (i / N) * Math.PI * 2;
  const y = (Math.sin(a * 2) * 0.6);
  const tex = makeAvatarTexture(u, i);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.9, 0.9, 1);
  sprite.position.set(Math.cos(a) * R, y, Math.sin(a) * R);
  sprite.userData.user = u;
  orbit.add(sprite);
  items.push(sprite);
}

// Simple ring wireframe for context
const ring = new Group();
scene.add(ring);
for (let k = 0; k < 64; k++) {
  const a = (k / 64) * Math.PI * 2;
  const seg = new Mesh(new SphereGeometry(0.01, 8, 8), new MeshStandardMaterial({ color: 0xffffff }));
  seg.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
  ring.add(seg);
}

// Hover + click via Raycaster
const raycaster = new Raycaster();
const mouse = new Vector2();
let over = null;

function updateMouse(e) {
  const rect = container.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  mouse.set(x * 2 - 1, -(y * 2 - 1));
}

function handleHover() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(items, false);
  const hit = (intersects && intersects[0] && intersects[0].object) ? intersects[0].object : null;
  if (over && over !== hit) {
    over.material.opacity = 1.0;
    over.scale.set(0.9, 0.9, 1);
    over = null;
  }
  if (hit && hit !== over) {
    over = hit;
    over.material.opacity = 1.0;
    over.scale.set(1.15, 1.15, 1);
  }
}

const onMouseMove = (e) => { updateMouse(e); handleHover(); };
// resolve primary key field name from collection meta
let __pkField = null;
async function getPrimaryKeyField() {
  if (__pkField) return __pkField;
  const name = (resource && resource.getResourceName) ? resource.getResourceName() : 'users';
  try {
    const meta = await ctx.request({ url: 'collections:get', method: 'get', params: { filterByTk: name } });
    const data = (meta && meta.data) ? meta.data : {};
    // prefer filterTargetKey, fallback to fields.primaryKey
    const ft = (data && data.filterTargetKey) ? data.filterTargetKey : (data && data.options && data.options.filterTargetKey);
    if (ft && typeof ft === 'string') {
      __pkField = ft;
      return __pkField;
    }
    const fields = (data && data.fields) ? data.fields : (data && data.options && data.options.fields) ? data.options.fields : [];
    const pk = Array.isArray(fields) && fields.find(function(f){ return f && (f.primaryKey || (f.uiSchema && f.uiSchema['x-component'] === 'ID')); });
    if (pk && typeof pk.name === 'string') {
      __pkField = pk.name;
      return __pkField;
    }
  } catch (_) {}
  __pkField = 'id';
  return __pkField;
}

const onClick = async (e) => {
  updateMouse(e);
  handleHover();
  if (over && over.userData && over.userData.user) {
    const u = over.userData.user;
    const baseId = (ctx.model && ctx.model.uid) ? ctx.model.uid : String(ctx.model || 'runjs');
    const popupUid = baseId + '-details';
    const pkField = await getPrimaryKeyField();
    var tk = (u && u[pkField]) ? u[pkField] : (u ? (u.id || u.userId || u.pk) : undefined);
    await ctx.openView(popupUid, {
      mode: 'dialog',
      // 让弹窗自动定位当前记录：顶层 filterByTk + 数据源/集合信息
      dataSourceKey: (resource && resource.getDataSourceKey) ? resource.getDataSourceKey() : 'main',
      collectionName: (resource && resource.getResourceName) ? resource.getResourceName() : 'users',
      filterByTk: tk,
      params: { user: u, userId: tk },
      title: (u.nickname || u.username || u.name || 'User') + ' details',
      width: 720,
    });
  }
};
container.addEventListener('mousemove', onMouseMove);
container.addEventListener('click', onClick);

// Animation (no rAF/use setInterval)
let t = 0;
const tick = () => {
  t += 0.016;
  orbit.rotation.y += 0.005; // slow spin
  stars.rotation.y = t * 0.02;
  // subtle bobbing per item
  for (let i = 0; i < items.length; i++) {
    const m = items[i];
    const a = (i / items.length) * Math.PI * 2;
    m.position.y = Math.sin(a * 2 + t * 1.5) * 0.6;
  }
  renderer.render(scene, camera);
};
// 若上一次运行的动画仍在，清理之（仅使用 ctx.model 存储）
try { if (ctx.model && ctx.model.__usersOrbitTimer) clearInterval(ctx.model.__usersOrbitTimer); } catch (_) {}
var __timer = setInterval(tick, 16);
if (ctx.model) ctx.model.__usersOrbitTimer = __timer;

// Initial sizing
(() => {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
})();

// 不额外挂载 cleanup；容器被替换后旧 DOM 将被 GC；定时器在下次运行前通过 ctx.model 清理
`,
};

export default snippet;
