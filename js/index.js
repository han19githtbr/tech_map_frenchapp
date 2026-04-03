/**
 * TechMap — French Game
 * Reescrito do zero: layout circular em clusters por categoria,
 * animação suave, drag, zoom e panel de detalhes
 */

class TechMap {
  constructor() {
    this.canvas = document.getElementById('techCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.technologies = [];
    this.layers = [];
    this.dataFlow = [];

    this.selectedTech = null;
    this.hoveredTech = null;

    // Viewport state
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;
    this.targetOffsetX = 0;
    this.targetOffsetY = 0;
    this.targetScale = 1;

    // Animation
    this.animationId = null;
    this.time = 0;

    this.NODE_RADIUS = 36;

    // Node drag state
    this.draggingNode = null;      // tech object being dragged
    this.nodeDragOffsetX = 0;      // offset from node centre to pointer
    this.nodeDragOffsetY = 0;
    this.dragMoved = false;        // did pointer move enough to count as drag?
    this.dragStartClientX = 0;
    this.dragStartClientY = 0;

    this.initCanvas();
    this.setupEventListeners();
    this.loadData();
  }

  /* ─── Canvas Setup ─── */
  initCanvas() {
    this.resizeCanvas();
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      if (this.technologies.length) {
        this.computeLayout();
        this.centerView();
      }
    });
  }

  resizeCanvas() {
    const parent = this.canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    this.canvas.width = rect.width;
    // Use the canvas element's CSS height (set via stylesheet)
    const cssH = parseInt(getComputedStyle(this.canvas).height, 10);
    this.canvas.height = cssH || 620;

    // Scale node radius with screen size: comfortable on mobile, not too big on desktop
    const shortSide = Math.min(this.canvas.width, this.canvas.height);
    this.NODE_RADIUS = Math.max(18, Math.min(30, shortSide * 0.045));
  }

  /* ─── Data Loading ─── */
  loadData() {
    console.log('[TechMap.loadData] Iniciando carregamento de dados...');
    console.log('[TechMap.loadData] window.techMapData disponível:', !!window.techMapData);
    console.log('[TechMap.loadData] window.languageManager disponível:', !!window.languageManager);
    
    // Se os dados já foram carregados em window.techMapData, use-os
    if (window.techMapData && window.languageManager) {
      console.log('[TechMap.loadData] ✓ Usando dados pré-carregados');
      const fullData = window.techMapData;
      const langMgr = window.languageManager;
      
      console.log('[TechMap.loadData] Configurando technologies...');
      this.technologies = fullData.technologies || [];
      console.log(`[TechMap.loadData] ${this.technologies.length} tecnologias carregadas`);
      
      this.layers = fullData.layers[langMgr.currentLanguage] || fullData.layers['pt'];
      this.dataFlow = fullData.dataFlow[langMgr.currentLanguage] || fullData.dataFlow['pt'];

      // Informar language manager que TechMap está pronto
      langMgr.setTechMapInstance(this);

      console.log('[TechMap.loadData] Computando layout...');
      this.computeLayout();
      
      console.log('[TechMap.loadData] Renderizando...');
      this.renderLayers();
      this.renderDataFlow();
      this.centerView();
      this.startAnimation();
      
      console.log('[TechMap.loadData] ✓ TechMap carregado com sucesso');
      return;
    }
    
    console.log('[TechMap.loadData] ✗ Dados pré-carregados não encontrados, usando fallback...');

    // Fallback: carregar dados se ainda não foram carregados (para compatibilidade)
    console.log('[TechMap.loadData] Carregando data.json por fallback...');
    fetch('database/data.json')
      .then(response => response.json())
      .then(fullData => {
        console.log('[TechMap.loadData] ✓ data.json carregado com sucesso');
        window.techMapData = fullData;

        this.technologies = fullData.technologies || [];
        console.log(`[TechMap.loadData] ${this.technologies.length} tecnologias carregadas`);
        
        const langMgr = window.languageManager || {};
        const currentLang = langMgr.currentLanguage || 'pt';
        
        this.layers = fullData.layers[currentLang] || fullData.layers['pt'];
        this.dataFlow = fullData.dataFlow[currentLang] || fullData.dataFlow['pt'];

        if (window.languageManager) {
          window.languageManager.setData(fullData);
          window.languageManager.setTechMapInstance(this);
        }

        console.log('[TechMap.loadData] Computando layout...');
        this.computeLayout();
        
        console.log('[TechMap.loadData] Renderizando...');
        this.renderLayers();
        this.renderDataFlow();
        this.centerView();
        this.startAnimation();

        console.log('[TechMap.loadData] ✓ TechMap inicializado com sucesso');
      })
      .catch(err => {
        console.error('[TechMap.loadData] ✗ Erro ao carregar data.json:', err);
        this.loadEmbeddedData();
      });
  }

  loadEmbeddedData() {
    // Fallback embedded data (simplified version)
    const data = {
      "categories": {
        "pt": ["Frontend", "Backend", "Database", "External API", "DevOps"],
        "en": ["Frontend", "Backend", "Database", "External API", "DevOps"],
        "fr": ["Frontend", "Backend", "Base de données", "API Externe", "DevOps"]
      },
      "technologies": [],
      "layers": {
        "pt": [
          { "name": "Frontend", "color": "#4f8ef7", "technologies": ["nextjs", "react", "typescript", "tailwind", "framer", "recharts", "toastify", "pwa", "socketio-client"] },
          { "name": "Backend", "color": "#2ecf8c", "technologies": ["node", "nextauth", "mongoose", "prisma", "socketio"] },
          { "name": "Database", "color": "#a78bfa", "technologies": ["mongodb"] },
          { "name": "APIs Externas", "color": "#f59e0b", "technologies": ["youtube", "cloudinary", "freesound"] },
          { "name": "DevOps", "color": "#f87171", "technologies": ["vercel", "docker"] }
        ]
      }
    };

    window.techMapData = data;
    this.technologies = data.technologies || [];
    this.layers = data.layers[languageManager.currentLanguage] || data.layers['pt'];
    this.dataFlow = [];
    languageManager.setData(data);
  }

  /* ─── Layout: radial clusters por categoria ─── */
  computeLayout() {
    console.log('[computeLayout] Iniciando... this.technologies.length:', this.technologies.length);
    const categories = ['Frontend', 'Backend', 'Database', 'External API', 'DevOps'];
    const groups = {};

    categories.forEach(c => groups[c] = []);
    this.technologies.forEach(t => {
      const cat = t.category || 'Frontend';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    });

    console.log('[computeLayout] Grupos criados:', Object.keys(groups).map(k => `${k}: ${groups[k].length}`).join(', '));

    // Scale the entire world-space layout based on canvas dimensions.
    // This means the map always fits comfortably regardless of screen size —
    // on mobile the coordinates are smaller, so nodes stay large relative to
    // the canvas and remain readable without any zoom tricks.
    const W = this.canvas.width;
    const H = this.canvas.height;
    const shortSide = Math.min(W, H);

    // Use the larger dimension so clusters spread out well on both portrait and landscape
    const ref         = Math.max(W, H);
    const SPACING     = ref * 0.18;           // min gap between nodes within a cluster
    const CX          = W * 0.5;
    const CY          = H * 0.5;
    const CLUSTER_RADIUS = ref * 0.34;        // distance from centre to cluster hub
    const NUM_CLUSTERS  = categories.length;

    categories.forEach((cat, ci) => {
      const techs = groups[cat] || [];
      if (!techs.length) return;

      const clusterAngle = (ci / NUM_CLUSTERS) * Math.PI * 2 - Math.PI / 2;
      const cx = CX + Math.cos(clusterAngle) * CLUSTER_RADIUS;
      const cy = CY + Math.sin(clusterAngle) * CLUSTER_RADIUS;

      // innerR must be large enough so no two nodes overlap:
      // circumference = 2π·r  ≥  N · SPACING  →  r ≥ N·SPACING/(2π)
      // also enforce a readable minimum based on node count
      const minInner = this.NODE_RADIUS * 2.8 * techs.length;
      const innerR = techs.length <= 1
        ? 0
        : Math.max(SPACING * techs.length / (2 * Math.PI), minInner / (2 * Math.PI), ref * 0.10);

      techs.forEach((tech, ti) => {
        if (techs.length === 1) {
          tech._x = cx;
          tech._y = cy;
        } else {
          const angle = (ti / techs.length) * Math.PI * 2 - Math.PI / 2;
          tech._x = cx + Math.cos(angle) * innerR;
          tech._y = cy + Math.sin(angle) * innerR;
        }
        tech.hidden = false;
      });
    });
    
    console.log('[computeLayout] ✓ Layout computado. Nós posicionados:', this.technologies.filter(t => !t.hidden).length);
  }

  centerView() {
    if (!this.technologies.length) return;

    const W = this.canvas.width;
    const H = this.canvas.height;

    // Account for label height below each node (~28px per label)
    const LABEL_MARGIN = 30;
    const PADDING = 80;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    this.technologies.forEach(t => {
      if (t._x < minX) minX = t._x;
      if (t._x > maxX) maxX = t._x;
      if (t._y < minY) minY = t._y;
      if (t._y > maxY) maxY = t._y;
    });

    // Layout coordinates are already sized for the canvas, so scale stays at 1.
    // We still clamp in case the user has zoomed or the canvas was tiny.
    const scaleX = (W - PADDING * 2) / ((maxX - minX) || 1);
    const scaleY = (H - PADDING * 2 - LABEL_MARGIN) / ((maxY - minY) || 1);
    this.scale = Math.min(scaleX, scaleY, 1.0);
    this.targetScale = this.scale;

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    this.offsetX = W / 2 - cx * this.scale;
    this.offsetY = H / 2 - cy * this.scale;
    this.targetOffsetX = this.offsetX;
    this.targetOffsetY = this.offsetY;
  }

  /* ─── Event Listeners ─── */
  setupEventListeners() {
    this.canvas.addEventListener('mousedown', e => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', e => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => { this.onPointerUp(e); });
    this.canvas.addEventListener('mouseleave', (e) => { this.onPointerUp(e); this.hoveredTech = null; });
    this.canvas.addEventListener('wheel', e => this.onWheel(e), { passive: false });

    // Touch support
    this.canvas.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        this.onMouseDown({ clientX: t.clientX, clientY: t.clientY });
      }
    }, { passive: true });
    this.canvas.addEventListener('touchmove', e => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        this.onMouseMove({ clientX: t.clientX, clientY: t.clientY });
      }
      e.preventDefault();
    }, { passive: false });
    this.canvas.addEventListener('touchend', e => { this.onPointerUp(e); });

    // Controls
    document.querySelectorAll('.control-btn').forEach(btn => {
      btn.addEventListener('click', e => this.filterByCategory(e.currentTarget));
    });

    // Nav links
    document.querySelectorAll('[data-section]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const sel = link.dataset.section;
        const el = document.querySelector(sel);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        // close mobile nav
        document.getElementById('mobileNav')?.classList.remove('open');
      });
    });

    // Reset button
    document.getElementById('resetBtn')?.addEventListener('click', () => {
      this.centerView();
      this.selectedTech = null;
      this.renderInfoPanel(null);
    });

    // Mobile menu
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
      document.getElementById('mobileNav')?.classList.toggle('open');
    });
  }

  getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.offsetX) / this.scale;
    const y = (e.clientY - rect.top - this.offsetY) / this.scale;
    return { x, y };
  }

  onMouseDown(e) {
    const { x, y } = this.getCanvasPos(e);

    for (const tech of this.technologies) {
      if (!tech.hidden && this.hitTest(x, y, tech)) {
        // Start a potential node drag — we'll decide click vs drag in onMouseMove
        this.draggingNode     = tech;
        this.nodeDragOffsetX  = x - tech._x;
        this.nodeDragOffsetY  = y - tech._y;
        this.dragMoved        = false;
        this.dragStartClientX = e.clientX;
        this.dragStartClientY = e.clientY;
        return;
      }
    }

    // Clicked on empty space → pan the canvas
    this.isDragging = true;
    this.dragStartX = e.clientX - this.offsetX;
    this.dragStartY = e.clientY - this.offsetY;
  }

  onMouseMove(e) {
    const { x, y } = this.getCanvasPos(e);

    // ── Node drag ──────────────────────────────────────────────
    if (this.draggingNode) {
      const dx = e.clientX - this.dragStartClientX;
      const dy = e.clientY - this.dragStartClientY;
      if (!this.dragMoved && Math.sqrt(dx * dx + dy * dy) > 4) {
        this.dragMoved = true;
      }
      if (this.dragMoved) {
        this.draggingNode._x = x - this.nodeDragOffsetX;
        this.draggingNode._y = y - this.nodeDragOffsetY;
        this.canvas.style.cursor = 'grabbing';
      }
      return;
    }

    // ── Canvas pan ─────────────────────────────────────────────
    let hovered = null;
    for (const tech of this.technologies) {
      if (!tech.hidden && this.hitTest(x, y, tech)) {
        hovered = tech;
        break;
      }
    }

    this.hoveredTech = hovered;
    this.canvas.style.cursor = hovered ? 'grab' : (this.isDragging ? 'grabbing' : 'default');

    if (this.isDragging) {
      this.offsetX = e.clientX - this.dragStartX;
      this.offsetY = e.clientY - this.dragStartY;
      this.targetOffsetX = this.offsetX;
      this.targetOffsetY = this.offsetY;
    }
  }

  onPointerUp(e) {
    // ── End node drag ──────────────────────────────────────────
    if (this.draggingNode) {
      if (!this.dragMoved) {
        // It was a tap/click, not a drag → toggle selection
        const tech = this.draggingNode;
        if (this.selectedTech?.id === tech.id) {
          this.selectedTech = null;
          this.renderInfoPanel(null);
        } else {
          this.selectedTech = tech;
          this.renderInfoPanel(tech);
        }
      }
      // Snap a subtle spring-back feel: node stays where dropped
      this.draggingNode = null;
      this.dragMoved    = false;
      this.canvas.style.cursor = 'default';
      return;
    }

    // ── End canvas pan ─────────────────────────────────────────
    this.isDragging = false;
  }

  onWheel(e) {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    const newScale = Math.max(0.3, Math.min(4, this.scale * factor));

    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    this.offsetX = mx - (mx - this.offsetX) * (newScale / this.scale);
    this.offsetY = my - (my - this.offsetY) * (newScale / this.scale);
    this.targetOffsetX = this.offsetX;
    this.targetOffsetY = this.offsetY;
    this.scale = newScale;
    this.targetScale = newScale;
  }

  hitTest(x, y, tech) {
    const dx = x - tech._x;
    const dy = y - tech._y;
    return Math.sqrt(dx * dx + dy * dy) < this.NODE_RADIUS + 5;
  }

  /* ─── Filter ─── */
  filterByCategory(btn) {
    document.querySelectorAll('.control-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const cat = btn.dataset.category;
    this.technologies.forEach(t => {
      t.hidden = cat !== 'all' && t.category !== cat;
    });

    this.selectedTech = null;
    this.renderInfoPanel(null);
  }

  /* ─── Animation Loop ─── */
  startAnimation() {
    const loop = () => {
      this.time += 0.016;
      this.draw();
      this.animationId = requestAnimationFrame(loop);
    };
    loop();
  }

  /* ─── Drawing ─── */
  draw() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    // Debug: log once
    if (!this._drawLoggedOnce) {
      console.log('[draw] Primeiro render - this.technologies.length:', this.technologies.length);
      console.log('[draw] Canvas dimensions:', W, 'x', H);
      this._drawLoggedOnce = true;
    }

    // Background
    ctx.fillStyle = '#0b0e1a';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    this.drawGrid(ctx, W, H);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    this.drawConnections(ctx);
    this.drawNodes(ctx);

    ctx.restore();
  }

  drawGrid(ctx, W, H) {
    const GRID = 40;
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;

    const ox = this.offsetX % (GRID * this.scale);
    const oy = this.offsetY % (GRID * this.scale);
    const step = GRID * this.scale;

    ctx.beginPath();
    for (let x = ox; x < W; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for (let y = oy; y < H; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();
  }

  drawConnections(ctx) {
    const drawn = new Set();

    this.technologies.forEach(tech => {
      if (tech.hidden) return;

      tech.connects.forEach(cid => {
        const target = this.technologies.find(t => t.id === cid);
        if (!target || target.hidden) return;

        const key = [tech.id, cid].sort().join('|');
        if (drawn.has(key)) return;
        drawn.add(key);

        const isHighlighted =
          this.selectedTech &&
          (this.selectedTech.id === tech.id || this.selectedTech.id === cid);

        const isHovered =
          this.hoveredTech &&
          (this.hoveredTech.id === tech.id || this.hoveredTech.id === cid);

        const alpha = isHighlighted ? 0.6 : isHovered ? 0.35 : 0.1;
        const width = isHighlighted ? 2 : 1;

        ctx.strokeStyle = isHighlighted
          ? tech.color + 'cc'
          : `rgba(100,140,255,${alpha})`;
        ctx.lineWidth = width;
        ctx.setLineDash(isHighlighted ? [] : [4, 6]);

        ctx.beginPath();
        ctx.moveTo(tech._x, tech._y);
        ctx.lineTo(target._x, target._y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated dot along connection when highlighted
        if (isHighlighted) {
          const t = (Math.sin(this.time * 2) + 1) / 2;
          const dx = tech._x + (target._x - tech._x) * t;
          const dy = tech._y + (target._y - tech._y) * t;

          ctx.fillStyle = tech.color;
          ctx.beginPath();
          ctx.arc(dx, dy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });
  }

  drawNodes(ctx) {
    const visibleTechs = this.technologies.filter(t => !t.hidden);
    if (!this._nodesLoggedOnce) {
      console.log('[drawNodes] Tecnologias visíveis:', visibleTechs.length, 'de', this.technologies.length);
      this._nodesLoggedOnce = true;
    }
    visibleTechs.forEach(tech => {
      this.drawNode(ctx, tech);
    });
  }

  drawNode(ctx, tech) {
    const x = tech._x;
    const y = tech._y;
    const R = this.NODE_RADIUS;

    const isSelected = this.selectedTech?.id === tech.id;
    const isHovered  = this.hoveredTech?.id === tech.id;
    const isNodeDrag = this.draggingNode?.id === tech.id && this.dragMoved;
    const isActive   = isSelected || isHovered || isNodeDrag;

    // Drag indicator ring
    const isDragging = this.draggingNode?.id === tech.id && this.dragMoved;
    if (isDragging) {
      ctx.strokeStyle = tech.color + 'cc';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(x, y, R + 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Pulse ring for selected
    if (isSelected && !isDragging) {
      const pulse = 1 + Math.sin(this.time * 3) * 0.15;
      ctx.strokeStyle = tech.color + '60';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, R * pulse + 18, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Glow
    if (isActive) {
      const grd = ctx.createRadialGradient(x, y, 0, x, y, R + 28);
      grd.addColorStop(0, tech.color + '55');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, R + 28, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shadow
    ctx.shadowColor = tech.color + '50';
    ctx.shadowBlur = isActive ? 24 : 10;

    // Node circle
    ctx.fillStyle = '#1a2035';
    ctx.strokeStyle = isActive ? tech.color : tech.color + '90';
    ctx.lineWidth = isActive ? 3 : 2;
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // Inner color fill (top-half arc for style)
    ctx.fillStyle = tech.color + (isActive ? 'dd' : '55');
    ctx.beginPath();
    ctx.arc(x, y, R * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Icon
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(R * 0.58)}px 'DM Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tech.icon, x, y);

    // ── Label ──
    const langMgr = typeof languageManager !== 'undefined' ? languageManager : null;
    const displayName = langMgr ? langMgr.getTechName(tech) : tech.name;

    const TARGET_PX = 13;
    const worldFontSize = Math.round(TARGET_PX / this.scale);
    const clampedFont = Math.max(10, Math.min(worldFontSize, 22));

    ctx.font = `${isActive ? 700 : 500} ${clampedFont}px 'DM Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const labelY = y + R + 7;
    const labelAlpha = isActive ? 1 : 0.8;

    // Background pill for readability
    const metrics = ctx.measureText(displayName);
    const pw = metrics.width + 10;
    const ph = clampedFont + 6;
    ctx.fillStyle = `rgba(11,14,26,0.72)`;
    ctx.beginPath();
    ctx.roundRect(x - pw / 2, labelY - 2, pw, ph, 4);
    ctx.fill();

    ctx.fillStyle = isActive ? tech.color : `rgba(200,212,235,${labelAlpha})`;
    ctx.fillText(displayName, x, labelY + 1);
  }

  /* ─── Info Panel ─── */
  renderInfoPanel(tech) {
    const panel = document.getElementById('infoPanel');
    const langMgr = typeof languageManager !== 'undefined' ? languageManager : null;

    if (!tech) {
      const emptyMessage = langMgr ? langMgr.getUIString('sections.mapaEmpty') : 'Clique em um nó no mapa para ver os detalhes da tecnologia';
      panel.innerHTML = `
        <div class="info-empty">
          <div class="info-empty-icon">◎</div>
          <p>${emptyMessage}</p>
        </div>`;
      return;
    }

    const catColors = {
      'Frontend': '#4f8ef7',
      'Backend': '#2ecf8c',
      'Database': '#a78bfa',
      'External API': '#f59e0b',
      'DevOps': '#f87171'
    };
    const catColor = catColors[tech.category] || '#4f8ef7';

    const techName = langMgr ? langMgr.getTechName(tech) : tech.name;
    const techDesc = langMgr ? langMgr.getTechDescription(tech) : tech.description;
    const techFeatures = langMgr ? langMgr.getTechFeatures(tech) : tech.features;

    const connects = tech.connects
      .map(id => this.technologies.find(t => t.id === id))
      .filter(Boolean)
      .map(t => {
        const connectName = langMgr ? langMgr.getTechName(t) : t.name;
        return `<span class="connect-chip" style="color:${t.color};border-color:${t.color}40">${connectName}</span>`;
      })
      .join('');

    const featuresLabel = langMgr ? langMgr.getUIString('panel.features') : 'Características';
    const integratesLabel = langMgr ? langMgr.getUIString('panel.integrates') : 'Integra-se com';

    panel.innerHTML = `
      <div class="tech-detail">
        <div class="tech-detail-header">
          <div class="tech-detail-icon">${tech.icon}</div>
          <div>
            <div class="tech-detail-name">${techName}</div>
            <div class="tech-detail-version">${tech.version}</div>
          </div>
        </div>

        <div class="tech-category-badge" style="background:${catColor}22;color:${catColor};border:1px solid ${catColor}44">
          ${tech.category}
        </div>

        <p class="tech-detail-desc">${techDesc}</p>

        <div class="tech-detail-label">${featuresLabel}</div>
        <div class="feature-tags">
          ${techFeatures.map(f => `<span class="feature-tag">${f}</span>`).join('')}
        </div>

        ${connects ? `
          <div class="tech-detail-label" style="margin-top:1rem">${integratesLabel}</div>
          <div class="connects-list">${connects}</div>
        ` : ''}
      </div>`;
  }

  reloadWithLanguage(lang) {
    // Update data from window.techMapData with the selected language
    if (!window.techMapData) {
      console.warn('[TechMap.reloadWithLanguage] window.techMapData não disponível');
      return;
    }

    console.log(`[TechMap.reloadWithLanguage] Recarregando dados para o idioma: ${lang}`);

    // Atualizar dados com o idioma selecionado
    this.technologies = window.techMapData.technologies;
    this.layers = window.techMapData.layers[lang] || window.techMapData.layers['pt'];
    this.dataFlow = window.techMapData.dataFlow[lang] || window.techMapData.dataFlow['pt'];

    // Re-render sections with new language
    setTimeout(() => {
      this.renderLayers();
      this.renderDataFlow();
      this.renderInfoPanel(this.selectedTech);
      console.log(`[TechMap.reloadWithLanguage] Re-render completo para ${lang}`);
    }, 0);
  }

  /* ─── Layers Section ─── */
  renderLayers() {
    const container = document.getElementById('layersGrid');
    if (!container) return;

    const layerColors = {
      'Frontend': '#4f8ef7',
      'Backend': '#2ecf8c',
      'Database': '#a78bfa',
      'Base de données': '#a78bfa',
      'External APIs': '#f59e0b',
      'External API': '#f59e0b',
      'API Externe': '#f59e0b',
      'APIs Externas': '#f59e0b',
      'DevOps': '#f87171'
    };

    const layerIcons = {
      'Frontend': '🎨',
      'Backend': '⚙️',
      'Database': '🗄️',
      'Base de données': '🗄️',
      'External APIs': '🌐',
      'External API': '🌐',
      'API Externe': '🌐',
      'APIs Externas': '🌐',
      'DevOps': '🚀'
    };

    container.innerHTML = this.layers.map(layer => {
      const color = layerColors[layer.name] || '#4f8ef7';
      const icon = layerIcons[layer.name] || '◎';
      const techs = layer.technologies
        .map(id => this.technologies.find(t => t.id === id))
        .filter(Boolean);

      return `
        <div class="layer-card" style="--layer-color: ${color}">
          <h3>
            ${icon} ${layer.name}
            <span class="layer-count">${techs.length}</span>
          </h3>
          <div class="layer-techs">
            ${techs.map(t => {
              const langMgr = typeof languageManager !== 'undefined' ? languageManager : null;
              const techName = langMgr ? langMgr.getTechName(t) : t.name;
              return `
              <span class="layer-tech-chip">
                <span style="color:${t.color}">${t.icon}</span>
                ${techName}
              </span>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');
  }

  /* ─── Data Flow Section ─── */
  renderDataFlow() {
    const container = document.getElementById('flowItems');
    if (!container) return;

    const langMgr = typeof languageManager !== 'undefined' ? languageManager : null;

    container.innerHTML = this.dataFlow.map(flow => {
      const translatedFlow = langMgr ? langMgr.getDataFlowInfo(flow) : flow;
      return `
      <div class="flow-item">
        <div class="flow-arrow-wrap">→</div>
        <div class="flow-content">
          <div class="flow-from-to">${translatedFlow.from} → ${translatedFlow.to}</div>
          <div class="flow-desc">${translatedFlow.description}</div>
          <span class="flow-method-badge">${translatedFlow.method}</span>
        </div>
      </div>`;
    }).join('');
  }
}

/* ─── Counter Animation ─── */
function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    let current = 0;
    const step = Math.ceil(target / 30);
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current;
      if (current >= target) clearInterval(interval);
    }, 40);
  });
}

/* ─── Init ─── */
function initTechMap() {
  console.log('[initTechMap] Iniciando carregamento de dados...');
  
  // Load data first
  fetch('database/data.json')
    .then(response => response.json())
    .then(fullData => {
      console.log('[initTechMap] ✓ data.json carregado com sucesso');
      
      // Store data globally
      window.techMapData = fullData;
      
      // Create LanguageManager with data
      console.log('[initTechMap] Criando LanguageManager com dados...');
      window.languageManager = new LanguageManager(fullData);
      console.log('[initTechMap] ✓ LanguageManager criado com sucesso');
      
      // Now create TechMap
      console.log('[initTechMap] Criando TechMap...');
      window.techMapInstance = new TechMap();
      console.log('[initTechMap] ✓ TechMap criado com sucesso');
      
      animateCounters();
      console.log('[initTechMap] ✓ INICIALIZAÇÃO CONCLUÍDA!');
    })
    .catch(err => {
      console.error('[initTechMap] ✗ ERRO ao carregar data.json:', err);
    });
}

document.addEventListener('DOMContentLoaded', initTechMap);
