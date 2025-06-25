# Lowcode Block Plugin

A simplified NocoBase plugin that enables creating lowcode blocks using custom JavaScript execution code.

## Features

- **Custom Code Execution**: Write and execute custom JavaScript code within the component
- **External Library Loading**: Load external JavaScript libraries using requirejs
- **CSS Loading**: Load external CSS files using the loadCSS helper function
- **DOM Manipulation**: Direct access to the component's DOM element for rendering
- **Flow Page Integration**: Automatically appears in the "Add Block" dropdown in flow pages
- **CodeMirror Editor**: Advanced code editor with syntax highlighting, smart auto-completion, and JavaScript language support
- **Real-time Syntax Checking**: Instant error detection and helpful warnings for common programming issues
- **Context-Aware Autocomplete**: Intelligent suggestions for available variables (element, ctx, model, requirejs, requireAsync, loadCSS)
- **Code Snippets**: Pre-built templates for common operations like loading libraries, creating elements, and async operations
- **Simple Configuration**: Single-step configuration with execution code

## Configuration

Each lowcode component block has one main configuration:

1. **Execution Code**: Custom JavaScript code that will be executed to render the component

## Code Editor Features

The built-in CodeMirror editor provides enhanced development experience:

### ✅ Real-time Syntax Checking
- **Syntax Errors**: Instant detection of JavaScript syntax errors using Acorn parser
- **Undefined Variables**: Precise detection of undefined variable usage
- **Scope Analysis**: Intelligent variable scope tracking across functions and blocks
- **Context Awareness**: Recognizes lowcode environment variables (element, ctx, model, etc.)

### 🎯 Visual Error Indicators
- **Error Underlines**: Red wavy underlines for syntax errors
- **Warning Underlines**: Yellow wavy underlines for potential issues  
- **Info Underlines**: Blue wavy underlines for optimization suggestions
- **Gutter Icons**: Error/warning indicators in the editor gutter
- **Hover Tooltips**: Detailed error descriptions on hover

## Example Usage

### 1. ECharts Data Visualization

**Execution Code**:
```javascript
// Load ECharts library
requirejs.config({
  paths: {
    'echarts': 'https://cdn.jsdelivr.net/npm/echarts@5.4.2/dist/echarts.min'
  }
});

const echarts = await requireAsync('echarts');

// Initialize chart with responsive design
const chart = echarts.init(element, null, { renderer: 'svg' });

// Sales data visualization
const option = {
  title: {
    text: 'Monthly Sales Report',
    left: 'center',
    textStyle: { color: '#333', fontSize: 18 }
  },
  tooltip: {
    trigger: 'axis',
    formatter: '{b}: ${c}'
  },
  grid: {
    left: '10%',
    right: '10%',
    bottom: '15%'
  },
  xAxis: {
    type: 'category',
    data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    axisLabel: { color: '#666' }
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#666', formatter: '${value}K' }
  },
  series: [{
    name: 'Sales',
    type: 'line',
    smooth: true,
    data: [120, 132, 101, 134, 90, 230],
    lineStyle: { color: '#1890ff', width: 3 },
    areaStyle: { color: 'rgba(24, 144, 255, 0.1)' }
  }]
};

chart.setOption(option);

// Make chart responsive
window.addEventListener('resize', () => chart.resize());
```

### 2. Chart.js Interactive Dashboard

**Execution Code**:
```javascript
// Load Chart.js library
requirejs.config({
  paths: {
    'chart': 'https://cdn.jsdelivr.net/npm/chart.js@4.3.0/dist/chart.umd'
  }
});

const Chart = await requireAsync('chart');

// Create canvas element
const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 300;
element.appendChild(canvas);

// Create interactive pie chart
new Chart(canvas, {
  type: 'doughnut',
  data: {
    labels: ['Desktop', 'Mobile', 'Tablet', 'Other'],
    datasets: [{
      data: [45, 35, 15, 5],
      backgroundColor: [
        '#FF6384',
        '#36A2EB', 
        '#FFCE56',
        '#4BC0C0'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  },
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Traffic Sources Distribution',
        font: { size: 16 }
      },
      legend: {
        position: 'bottom'
      }
    },
    animation: {
      animateRotate: true,
      duration: 2000
    }
  }
});
```

### 3. Swiper.js Image Gallery

**Execution Code**:
```javascript
// Load Swiper CSS and JS
await loadCSS('https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.css');

requirejs.config({
  paths: {
    'swiper': 'https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min'
  }
});

const Swiper = await requireAsync('swiper');

// Create gallery HTML
element.innerHTML = `
  <div class="swiper" style="width: 100%; height: 400px;">
    <div class="swiper-wrapper">
      <div class="swiper-slide">
        <img src="https://picsum.photos/600/400?random=1" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
      <div class="swiper-slide">
        <img src="https://picsum.photos/600/400?random=2" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
      <div class="swiper-slide">
        <img src="https://picsum.photos/600/400?random=3" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
      <div class="swiper-slide">
        <img src="https://picsum.photos/600/400?random=4" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
    </div>
    <div class="swiper-pagination"></div>
    <div class="swiper-button-next"></div>
    <div class="swiper-button-prev"></div>
  </div>
`;

// Initialize Swiper with advanced features
new Swiper('.swiper', {
  loop: true,
  autoplay: {
    delay: 3000,
    disableOnInteraction: false,
  },
  effect: 'coverflow',
  grabCursor: true,
  centeredSlides: true,
  slidesPerView: 'auto',
  coverflowEffect: {
    rotate: 50,
    stretch: 0,
    depth: 100,
    modifier: 1,
    slideShadows: true,
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
});
```

### 4. AOS (Animate On Scroll) Effects

**Execution Code**:
```javascript
// Load AOS CSS and JS
await loadCSS('https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css');

requirejs.config({
  paths: {
    'aos': 'https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos'
  }
});

const AOS = await requireAsync('aos');

// Create animated content
element.innerHTML = `
  <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 500px;">
    <h1 data-aos="fade-up" data-aos-duration="1000" style="text-align: center; margin-bottom: 40px;">
      Animated Dashboard
    </h1>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
      <div data-aos="flip-left" data-aos-delay="100" 
           style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; backdrop-filter: blur(10px);">
        <h3>Total Users</h3>
        <p style="font-size: 2em; font-weight: bold;">12,345</p>
      </div>
      
      <div data-aos="flip-left" data-aos-delay="200"
           style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; backdrop-filter: blur(10px);">
        <h3>Revenue</h3>
        <p style="font-size: 2em; font-weight: bold;">$98,765</p>
      </div>
      
      <div data-aos="flip-left" data-aos-delay="300"
           style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; backdrop-filter: blur(10px);">
        <h3>Growth Rate</h3>
        <p style="font-size: 2em; font-weight: bold;">+23%</p>
      </div>
    </div>
    
    <div data-aos="fade-up" data-aos-delay="400" style="margin-top: 40px; text-align: center;">
      <button style="padding: 12px 24px; background: #fff; color: #667eea; border: none; border-radius: 25px; font-weight: bold; cursor: pointer;">
        View Details
      </button>
    </div>
  </div>
`;

// Initialize AOS
AOS.init({
  duration: 1200,
  easing: 'ease-in-out',
  once: false,
  mirror: true
});
```

### 5. Three.js 3D Scene

**Execution Code**:
```javascript
// Load Three.js library
requirejs.config({
  paths: {
    'three': 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.min'
  }
});

const THREE = await requireAsync('three');

// Create 3D scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, element.clientWidth / 400, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(element.clientWidth, 400);
renderer.setClearColor(0x000000, 0.1);
element.appendChild(renderer.domElement);

// Create rotating cube with gradient material
const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshPhongMaterial({ 
  color: 0x4cc9f0,
  transparent: true,
  opacity: 0.8
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Add lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

// Position camera
camera.position.z = 5;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  
  renderer.render(scene, camera);
}

animate();

// Handle resize
const resizeObserver = new ResizeObserver(() => {
  const width = element.clientWidth;
  camera.aspect = width / 400;
  camera.updateProjectionMatrix();
  renderer.setSize(width, 400);
});

resizeObserver.observe(element);
```

### 6. GSAP Advanced Animations

**Execution Code**:
```javascript
// Load GSAP library
requirejs.config({
  paths: {
    'gsap': 'https://cdn.jsdelivr.net/npm/gsap@3.12.2/dist/gsap.min'
  }
});

const gsap = await requireAsync('gsap');

// Create animated interface
element.innerHTML = `
  <div style="background: #1a1a1a; padding: 40px; border-radius: 15px; overflow: hidden; position: relative;">
    <div class="bg-animation" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.1;">
      <div class="particle" style="position: absolute; width: 4px; height: 4px; background: #00ff88; border-radius: 50%;"></div>
      <div class="particle" style="position: absolute; width: 6px; height: 6px; background: #0088ff; border-radius: 50%;"></div>
      <div class="particle" style="position: absolute; width: 3px; height: 3px; background: #ff0088; border-radius: 50%;"></div>
    </div>
    
    <h1 class="main-title" style="color: white; text-align: center; font-size: 3em; margin-bottom: 30px; opacity: 0; transform: translateY(50px);">
      GSAP Animation
    </h1>
    
    <div class="stats-container" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
      <div class="stat-box" style="background: linear-gradient(45deg, #00ff88, #00cc6a); padding: 20px; border-radius: 10px; text-align: center; transform: scale(0);">
        <div class="stat-number" style="font-size: 2.5em; font-weight: bold; color: white;">0</div>
        <div style="color: rgba(255,255,255,0.8);">Active Users</div>
      </div>
      
      <div class="stat-box" style="background: linear-gradient(45deg, #0088ff, #0066cc); padding: 20px; border-radius: 10px; text-align: center; transform: scale(0);">
        <div class="stat-number" style="font-size: 2.5em; font-weight: bold; color: white;">0</div>
        <div style="color: rgba(255,255,255,0.8);">Total Sales</div>
      </div>
      
      <div class="stat-box" style="background: linear-gradient(45deg, #ff0088, #cc0066); padding: 20px; border-radius: 10px; text-align: center; transform: scale(0);">
        <div class="stat-number" style="font-size: 2.5em; font-weight: bold; color: white;">0</div>
        <div style="color: rgba(255,255,255,0.8);">Growth %</div>
      </div>
    </div>
  </div>
`;

// GSAP Timeline Animation
const tl = gsap.timeline();

// Animate particles in background
gsap.to('.particle', {
  duration: 3,
  x: 'random(-200, 200)',
  y: 'random(-100, 100)',
  rotation: 'random(0, 360)',
  repeat: -1,
  yoyo: true,
  ease: 'power2.inOut',
  stagger: 0.5
});

// Main animation sequence
tl.to('.main-title', {
  duration: 1,
  opacity: 1,
  y: 0,
  ease: 'back.out(1.7)'
})
.to('.stat-box', {
  duration: 0.8,
  scale: 1,
  stagger: 0.2,
  ease: 'back.out(1.7)'
}, '-=0.5')
.to('.stat-number', {
  duration: 2,
  innerHTML: (i) => [1234, 5678, 89][i],
  snap: { innerHTML: 1 },
  stagger: 0.3,
  ease: 'power2.out'
}, '-=0.5');

// Hover effects
element.querySelectorAll('.stat-box').forEach(box => {
  box.addEventListener('mouseenter', () => {
    gsap.to(box, { duration: 0.3, scale: 1.05, y: -5 });
  });
  
  box.addEventListener('mouseleave', () => {
    gsap.to(box, { duration: 0.3, scale: 1, y: 0 });
  });
});
```

### 7. Tabulator Data Table with NocoBase API

**Execution Code**:
```javascript
// Load Tabulator library with proper scoping
await loadCSS('https://unpkg.com/tabulator-tables@5.5.0/dist/css/tabulator_simple.min.css');

requirejs.config({
  paths: {
    'tabulator': 'https://unpkg.com/tabulator-tables@5.5.0/dist/js/tabulator.min'
  }
});

const Tabulator = await requireAsync('tabulator');

// Generate unique IDs to avoid conflicts
const containerId = `users-container-${Date.now()}`;
const tableId = `users-table-${Date.now()}`;
const searchId = `search-${Date.now()}`;
const clearId = `clear-${Date.now()}`;
const exportId = `export-${Date.now()}`;

// Show loading state
element.innerHTML = '<div style="text-align: center; padding: 20px;">Loading users data...</div>';

try {
  // Request users data from NocoBase API
  const response = await ctx.globals.api.request({
    url: 'users:list',
    method: 'GET',
    params: {
      pageSize: 100,
      sort: ['-createdAt'],
      fields: ['id', 'username', 'email', 'nickname', 'createdAt', 'updatedAt']
    }
  });

  const users = response.data?.data || [];
  const recentUsers = users.filter(user => {
    const createdAt = new Date(user.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdAt > weekAgo;
  });

  // Create scoped container
  element.innerHTML = `
    <div id="${containerId}" style="padding: 20px; background: #f5f5f5; border-radius: 8px;">
      <h2 style="margin-bottom: 20px; color: #333;">Users Management</h2>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
        <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h4 style="margin: 0; color: #666;">Total Users</h4>
          <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #1890ff;">${users.length}</p>
        </div>
        <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h4 style="margin: 0; color: #666;">Recent Signups</h4>
          <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #52c41a;">${recentUsers.length}</p>
        </div>
      </div>
      
      <div style="margin-bottom: 15px; display: flex; gap: 10px; align-items: center;">
        <input type="text" id="${searchId}" placeholder="Search users..." 
               style="flex: 1; padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px;">
        <button id="${clearId}" style="padding: 8px 16px; background: #f5f5f5; border: 1px solid #d9d9d9; border-radius: 4px; cursor: pointer;">Clear</button>
        <button id="${exportId}" style="padding: 8px 16px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer;">Export CSV</button>
      </div>
      
      <div id="${tableId}" style="background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"></div>
    </div>
  `;

  // Initialize Tabulator with scoped element reference
  const tableElement = element.querySelector(`#${tableId}`);
  const table = new Tabulator(tableElement, {
    data: users,
    layout: "fitColumns",
    responsiveLayout: "hide",
    pagination: "local",
    paginationSize: 10,
    paginationSizeSelector: [5, 10, 20, 50],
    movableColumns: true,
    resizableRows: true,
    initialSort: [{ column: "createdAt", dir: "desc" }],
    columns: [
      {
        title: "ID", 
        field: "id", 
        width: 80,
        headerFilter: "input",
        formatter: function(cell) {
          return `<span style="font-family: monospace; color: #666;">#${cell.getValue()}</span>`;
        }
      },
      {
        title: "Username", 
        field: "username", 
        headerFilter: "input",
        formatter: function(cell) {
          const value = cell.getValue();
          return value ? `<strong style="color: #1890ff;">${value}</strong>` : '<span style="color: #ccc;">-</span>';
        }
      },
      {
        title: "Nickname", 
        field: "nickname", 
        headerFilter: "input",
        formatter: function(cell) {
          return cell.getValue() || '-';
        }
      },
      {
        title: "Email", 
        field: "email", 
        headerFilter: "input",
        formatter: function(cell) {
          const email = cell.getValue();
          return email ? `<a href="mailto:${email}" style="color: #1890ff; text-decoration: none;">${email}</a>` : '-';
        }
      },
      {
        title: "Created", 
        field: "createdAt", 
        width: 150,
        sorter: "datetime",
        formatter: function(cell) {
          const date = new Date(cell.getValue());
          return date.toLocaleString();
        }
      },
      {
        title: "Updated", 
        field: "updatedAt", 
        width: 150,
        sorter: "datetime",
        formatter: function(cell) {
          const date = new Date(cell.getValue());
          return date.toLocaleString();
        }
      },
      {
        title: "Actions",
        width: 120,
        headerSort: false,
        formatter: function() {
          return `<button class="view-btn" style="padding: 4px 8px; background: #1890ff; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; margin-right: 5px;">View</button>
                  <button class="edit-btn" style="padding: 4px 8px; background: #52c41a; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">Edit</button>`;
        },
        cellClick: function(e, cell) {
          const userData = cell.getRow().getData();
          if (e.target.classList.contains('view-btn')) {
            alert('Viewing user: ' + (userData.username || userData.email || userData.id));
          } else if (e.target.classList.contains('edit-btn')) {
            alert('Editing user: ' + (userData.username || userData.email || userData.id));
          }
        }
      }
    ],
    rowClick: function(e, row) {
      // Use scoped selection
      const container = element.querySelector(`#${containerId}`);
      container.querySelectorAll('.tabulator-row').forEach(r => r.style.backgroundColor = '');
      row.getElement().style.backgroundColor = '#e6f7ff';
    }
  });

  // Scoped event handlers
  const searchInput = element.querySelector(`#${searchId}`);
  const clearBtn = element.querySelector(`#${clearId}`);
  const exportBtn = element.querySelector(`#${exportId}`);

  searchInput.addEventListener('input', function(e) {
    const value = e.target.value;
    if (value) {
      table.setFilter([
        [
          { field: "username", type: "like", value: value },
          { field: "email", type: "like", value: value },
          { field: "nickname", type: "like", value: value }
        ]
      ]);
    } else {
      table.clearFilter();
    }
  });

  clearBtn.addEventListener('click', function() {
    searchInput.value = '';
    table.clearFilter();
  });

  exportBtn.addEventListener('click', function() {
    table.download("csv", "users_export.csv");
  });

} catch (error) {
  console.error('Failed to load users data:', error);
  element.innerHTML = `
    <div style="text-align: center; padding: 40px; color: #ff4d4f;">
      <h3>Failed to load users data</h3>
      <p>Error: ${error.message}</p>
      <button onclick="window.location.reload()" style="padding: 8px 16px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Retry
      </button>
    </div>
  `;
}
```

## Installation

1. Place the plugin in `packages/plugins/@nocobase/plugin-block-lowcode/`
2. Install dependencies: `npm install`
3. Build the plugin: `npm run build`
4. Enable the plugin in NocoBase admin panel

## Development

The plugin follows the standard NocoBase plugin structure:

- `src/server/`: Server-side plugin code
- `src/client/`: Client-side plugin code
- `src/client/LowcodeBlockFlowModel.tsx`: Main flow model implementation

## Architecture

The plugin extends the `BlockFlowModel` class and implements a simplified default flow with a single step:

1. **executionStep**: Executes the custom JavaScript code to render the component

The plugin automatically registers with the flow engine and appears in the flow page's "Add Block" dropdown.
