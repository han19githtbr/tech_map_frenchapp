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
    // Embed data directly so the page works without a server
    const data = {
      "technologies": [
        { "id": "nextjs", "name": "Next.js", "category": "Frontend", "version": "15.2.4", "description": "Framework React com SSR (Server-Side Rendering - renderização no servidor), SSG (Static Site Generation - geração estática) e API Routes (funções serverless) integradas. Responsável pela renderização de páginas, roteamento automático baseado em arquivos, otimização de imagens, e execução de chamadas de API. Oferece PWA (Progressive Web App) para experiência app-like.", "features": ["SSR/SSG", "API Routes", "File Routing", "Image Optimization", "PWA"], "color": "#e2e8f0", "icon": "▲", "connects": ["react", "typescript", "tailwind", "vercel"] },
        { "id": "react", "name": "React 18", "category": "Frontend", "version": "18.2.0", "description": "Biblioteca JavaScript para construir interfaces de usuário reativas com componentes reutilizáveis. Gerencia estado da aplicação, renderização eficiente com Virtual DOM (representação em memória da UI), e oferece Hooks para lógica funcional. Implementa atualizações automáticas quando dados mudam.", "features": ["Components", "Hooks", "State", "Virtual DOM"], "color": "#4f8ef7", "icon": "⚛", "connects": ["nextjs", "typescript", "framer", "recharts"] },
        { "id": "typescript", "name": "TypeScript", "category": "Frontend", "version": "5.8.3", "description": "Superset tipado de JavaScript que adiciona verificação de tipos em tempo de desenvolvimento. Oferece type safety (segurança de tipos), interfaces reutilizáveis, generics para componentes flexíveis e compilador que transforma código TypeScript em JavaScript compatível. Reduz bugs e melhora a manutenibilidade do código.", "features": ["Type Safety", "Interfaces", "Generics", "Compiler"], "color": "#5b8dee", "icon": "T", "connects": ["nextjs", "node"] },
        { "id": "tailwind", "name": "TailwindCSS", "category": "Frontend", "version": "4.1.3", "description": "Framework CSS com abordagem utility-first que fornece classes pré-definidas prontas para uso. Permite criar designs responsivos sem escrever CSS customizado, com suporte nativo para dark mode, temas personalizados, e breakpoints responsivos. Reduz tempo de desenvolvimento e melhora consistência visual.", "features": ["Utility-First", "Responsive", "Dark Mode", "Custom"], "color": "#38bdf8", "icon": "◈", "connects": ["nextjs"] },
        { "id": "framer", "name": "Framer Motion", "category": "Frontend", "version": "12.11.3", "description": "Biblioteca de animação para React que simplifica criação de animações suaves, transições e interações. Oferece animações declarativas, detecção de gestos (swipe, hover), layout animations e variants reutilizáveis. Essencial para criar experiências de usuário fluidas e modernas.", "features": ["Animations", "Gestures", "Layout", "Variants"], "color": "#7c3aed", "icon": "◉", "connects": ["react"] },
        { "id": "recharts", "name": "Recharts", "category": "Frontend", "version": "2.15.2", "description": "Biblioteca de gráficos compostos para React que permite visualições de dados responsivas. Oferece múltiplos tipos de gráficos (linha, barra, pizza), animações automáticas, temas customizáveis, e integração perfeita com React. Ideal para dashboards e análises de dados de jogadores.", "features": ["Charts", "Responsive", "Animations", "Themes"], "color": "#f59e0b", "icon": "◊", "connects": ["react"] },
        { "id": "toastify", "name": "React Toastify", "category": "Frontend", "version": "11.0.5", "description": "Biblioteca para exibir notificações toast (pequenas mensagens flutuantes) na aplicação. Oferece tipos pré-definidos (sucesso, erro, aviso, informação), animações automáticas, posicionamento flexível e customização completa. Melhora feedback visual para ações do usuário.", "features": ["Notifications", "Animations", "Positioning", "Customizable"], "color": "#f97316", "icon": "◐", "connects": ["react"] },
        { "id": "pwa", "name": "PWA (next-pwa)", "category": "Frontend", "version": "5.6.0", "description": "Progressive Web App (aplicação web progressiva) permite usar a aplicação como um app nativo. Utiliza Service Workers para cache offline, funciona sem conexão internet, pode ser instalada na home screen e suporta push notifications. Combina o melhor da web com apps nativos.", "features": ["Service Workers", "Offline", "Installable", "Push"], "color": "#a78bfa", "icon": "◻", "connects": ["nextjs"] },
        { "id": "socketio-client", "name": "Socket.io Client", "category": "Frontend", "version": "4.8.1", "description": "Cliente Socket.io que estabelece comunicação bidirectional em tempo real com o servidor via WebSocket. Permite troca de eventos instantânea, reconexão automática em caso de desconexão, fallback para outras tecnologias se necessário. Essencial para funcionalidades live do jogo.", "features": ["Real-time", "WebSocket", "Reconnect", "Events"], "color": "#34d399", "icon": "⟶", "connects": ["nextjs", "socketio"] },
        { "id": "node", "name": "Node.js", "category": "Backend", "version": "Runtime", "description": "Runtime JavaScript que executa código no servidor. Oferece event loop não-bloqueante, suporte nativo a async/await para operações assíncronas, sistema de módulos poderoso e streams para processamento de dados. Base de toda a infraestrutura backend da aplicação.", "features": ["Event Loop", "Async/Await", "Modules", "Streams"], "color": "#6ed97a", "icon": "⬡", "connects": ["nextjs", "typescript"] },
        { "id": "nextauth", "name": "NextAuth.js", "category": "Backend", "version": "4.24.11", "description": "Solução de autenticação para Next.js que gerencia login de usuários. Suporta OAuth (autenticação via Google, GitHub, etc), JWT (JSON Web Tokens - tokens seguros para sessões), gerenciamento de sessões e cookies automático, e callbacks customizáveis para controle fino. Simplifica segurança de autenticação.", "features": ["OAuth", "JWT", "Sessions", "Callbacks"], "color": "#22d3ee", "icon": "◍", "connects": ["nextjs", "mongodb"] },
        { "id": "mongoose", "name": "Mongoose", "category": "Backend", "version": "8.14.2", "description": "ODM (Object Document Mapping) para MongoDB que fornece camada abstrata sobre o banco de dados. Define schemas (estrutura dos documentos), valida dados automaticamente antes de salvar, oferece middleware hooks para operações, e simplifica queries complexas. Garante integridade dos dados.", "features": ["ODM", "Schema", "Validation", "Middleware"], "color": "#f87171", "icon": "◬", "connects": ["mongodb", "nextjs"] },
        { "id": "prisma", "name": "Prisma ORM", "category": "Backend", "version": "6.8.0", "description": "ORM (Object-Relational Mapping) moderno e type-safe para acesso a banco de dados. Define modelos de dados, oferece query builder intuitivo, gerencia migrations automáticas, gera tipos TypeScript automaticamente, e fornece cliente Prisma com intellisense completo. Melhora produtividade e segurança.", "features": ["ORM", "Query Builder", "Migrations", "Type Safety"], "color": "#94a3b8", "icon": "▣", "connects": ["mongodb", "typescript"] },
        { "id": "socketio", "name": "Socket.io Server", "category": "Backend", "version": "4.8.1", "description": "Servidor Socket.io que estabelece conexões WebSocket para comunicação em tempo real e bidirecional. Suporta rooms (agrupamento de clientes), broadcasting (envio para múltiplos clientes), fallback automático para outras tecnologias, e event-driven architecture. Essencial para multiplayer e atualizações live.", "features": ["Real-time", "WebSocket", "Fallback", "Rooms"], "color": "#2ecf8c", "icon": "⟵", "connects": ["nextjs", "node"] },
        { "id": "mongodb", "name": "MongoDB", "category": "Database", "version": "6.16.0", "description": "Banco de dados NoSQL (Not Only SQL) que armazena dados em documentos JSON flexíveis. Suporta queries complexas, índices TTL (Time To Live) para expiração automática de dados, transações ACID, e escalabilidade horizontal. Escolha ideal para aplicações modernas com esquemas variáveis.", "features": ["NoSQL", "Documents", "TTL Indexes", "Transactions"], "color": "#a78bfa", "icon": "◈", "connects": ["mongoose", "prisma", "nextauth"] },
        { "id": "youtube", "name": "YouTube API", "category": "External API", "version": "v3", "description": "API do Google que permite buscar e recuperar informações de vídeos do YouTube. Oferece pesquisa por palavras-chave, detalhes de vídeos, lista de trending, e metadados completos. Integra conteúdo educativo de francês diretamente na plataforma de aprendizado.", "features": ["Search", "Video Details", "Trending", "Metadata"], "color": "#f87171", "icon": "▶", "connects": ["nextjs"] },
        { "id": "cloudinary", "name": "Cloudinary", "category": "External API", "version": "6.16.0", "description": "Serviço cloud para gerenciamento de imagens e mídia. Oferece upload de arquivos, otimização automática, armazenamento em CDN (Content Delivery Network - rede global de distribuição), transformações em tempo real (resize, crop, filtros), e aceleração de entrega. Melhora performance e experiência do usuário.", "features": ["Upload", "CDN", "Optimization", "Transforms"], "color": "#60a5fa", "icon": "☁", "connects": ["nextjs"] },
        { "id": "freesound", "name": "Freesound API", "category": "External API", "version": "Custom", "description": "API de banco de dados de efeitos sonoros que permite buscar e baixar áudios licenciados. Oferece busca por palavras-chave, pré-visualização de áudio, metadados de qualidade, e licenças claras. Enriquece a experiência do jogo com sons de animais, ambientes e eventos interativos.", "features": ["Sound Search", "Caching", "TTL Index", "Preview"], "color": "#fb923c", "icon": "♪", "connects": ["nextjs", "mongodb"] },
        { "id": "vercel", "name": "Vercel", "category": "DevOps", "version": "Cloud Platform", "description": "Plataforma cloud para deploy de aplicações Next.js. Oferece CI/CD automático (Continuous Integration/Continuous Deployment - integração contínua e deploy contínuo), edge functions para lógica distribuída globalmente, escalabilidade automática, analytics de performance, e preview deployments. Otimizada para Next.js com zero config.", "features": ["Deployment", "CI/CD", "Scalability", "Analytics"], "color": "#e2e8f0", "icon": "▲", "connects": ["nextjs"] },
        { "id": "docker", "name": "Docker", "category": "DevOps", "version": "Containerization", "description": "Plataforma de containerização que empacota aplicação, dependências e configurações em containers isolados. Oferece consistência de ambiente entre desenvolvimento, testes e produção, facilita CI/CD pipelines, permite orquestração com Kubernetes, e simplifica deploy em múltiplos ambientes. Container é uma imagem portável e executável.", "features": ["Containers", "Images", "Networking", "Volumes"], "color": "#38bdf8", "icon": "⬢", "connects": ["nextjs"] }
      ],
      "layers": [
        { "name": "Frontend", "color": "#4f8ef7", "technologies": ["nextjs", "react", "typescript", "tailwind", "framer", "recharts", "toastify", "pwa", "socketio-client"] },
        { "name": "Backend", "color": "#2ecf8c", "technologies": ["node", "nextauth", "mongoose", "prisma", "socketio"] },
        { "name": "Database", "color": "#a78bfa", "technologies": ["mongodb"] },
        { "name": "External APIs", "color": "#f59e0b", "technologies": ["youtube", "cloudinary", "freesound"] },
        { "name": "DevOps", "color": "#f87171", "technologies": ["vercel", "docker"] }
      ],
      "dataFlow": [
        { "from": "Frontend", "to": "Backend", "description": "Requisições HTTP e WebSocket em tempo real", "method": "Fetch API · Socket.io" },
        { "from": "Backend", "to": "Database", "description": "Operações CRUD com validação de schema", "method": "Mongoose · Prisma" },
        { "from": "Backend", "to": "APIs Externas", "description": "Chamadas autenticadas para serviços externos", "method": "Axios · Node-fetch" },
        { "from": "Frontend", "to": "Cloudinary", "description": "Upload direto de imagens via SDK", "method": "Fetch API · SDK" }
      ]
    };

    this.technologies = data.technologies;
    this.layers = data.layers;
    this.dataFlow = data.dataFlow;

    this.computeLayout();
    this.renderLayers();
    this.renderDataFlow();
    this.centerView();
    this.startAnimation();
  }

  /* ─── Layout: radial clusters por categoria ─── */
  computeLayout() {
    const categories = ['Frontend', 'Backend', 'Database', 'External API', 'DevOps'];
    const groups = {};

    categories.forEach(c => groups[c] = []);
    this.technologies.forEach(t => {
      const cat = t.category || 'Frontend';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    });

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
    this.technologies.forEach(tech => {
      if (tech.hidden) return;
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
    const TARGET_PX = 13;
    const worldFontSize = Math.round(TARGET_PX / this.scale);
    const clampedFont = Math.max(10, Math.min(worldFontSize, 22));

    ctx.font = `${isActive ? 700 : 500} ${clampedFont}px 'DM Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const labelY = y + R + 7;
    const labelAlpha = isActive ? 1 : 0.8;

    // Background pill for readability
    const metrics = ctx.measureText(tech.name);
    const pw = metrics.width + 10;
    const ph = clampedFont + 6;
    ctx.fillStyle = `rgba(11,14,26,0.72)`;
    ctx.beginPath();
    ctx.roundRect(x - pw / 2, labelY - 2, pw, ph, 4);
    ctx.fill();

    ctx.fillStyle = isActive ? tech.color : `rgba(200,212,235,${labelAlpha})`;
    ctx.fillText(tech.name, x, labelY + 1);
  }

  /* ─── Info Panel ─── */
  renderInfoPanel(tech) {
    const panel = document.getElementById('infoPanel');

    if (!tech) {
      panel.innerHTML = `
        <div class="info-empty">
          <div class="info-empty-icon">◎</div>
          <p>Clique em um nó no mapa para ver os detalhes da tecnologia</p>
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

    const connects = tech.connects
      .map(id => this.technologies.find(t => t.id === id))
      .filter(Boolean)
      .map(t => `<span class="connect-chip" style="color:${t.color};border-color:${t.color}40">${t.name}</span>`)
      .join('');

    panel.innerHTML = `
      <div class="tech-detail">
        <div class="tech-detail-header">
          <div class="tech-detail-icon">${tech.icon}</div>
          <div>
            <div class="tech-detail-name">${tech.name}</div>
            <div class="tech-detail-version">${tech.version}</div>
          </div>
        </div>

        <div class="tech-category-badge" style="background:${catColor}22;color:${catColor};border:1px solid ${catColor}44">
          ${tech.category}
        </div>

        <p class="tech-detail-desc">${tech.description}</p>

        <div class="tech-detail-label">Características</div>
        <div class="feature-tags">
          ${tech.features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
        </div>

        ${connects ? `
          <div class="tech-detail-label" style="margin-top:1rem">Integra-se com</div>
          <div class="connects-list">${connects}</div>
        ` : ''}
      </div>`;
  }

  /* ─── Layers Section ─── */
  renderLayers() {
    const container = document.getElementById('layersGrid');
    if (!container) return;

    const layerColors = {
      'Frontend': '#4f8ef7',
      'Backend': '#2ecf8c',
      'Database': '#a78bfa',
      'External APIs': '#f59e0b',
      'DevOps': '#f87171'
    };

    const layerIcons = {
      'Frontend': '🎨',
      'Backend': '⚙️',
      'Database': '🗄️',
      'External APIs': '🌐',
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
            ${techs.map(t => `
              <span class="layer-tech-chip">
                <span style="color:${t.color}">${t.icon}</span>
                ${t.name}
              </span>`).join('')}
          </div>
        </div>`;
    }).join('');
  }

  /* ─── Data Flow Section ─── */
  renderDataFlow() {
    const container = document.getElementById('flowItems');
    if (!container) return;

    container.innerHTML = this.dataFlow.map(flow => `
      <div class="flow-item">
        <div class="flow-arrow-wrap">→</div>
        <div class="flow-content">
          <div class="flow-from-to">${flow.from} → ${flow.to}</div>
          <div class="flow-desc">${flow.description}</div>
          <span class="flow-method-badge">${flow.method}</span>
        </div>
      </div>`).join('');
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
document.addEventListener('DOMContentLoaded', () => {
  new TechMap();
  animateCounters();
});
