/**
 * Language Manager for TechMap
 * Gerencia a troca de idiomas da aplicação
 */

class LanguageManager {
  constructor() {
    this.currentLanguage = localStorage.getItem('techmap-lang') || 'pt';
    this.data = null;
    this.techMapInstance = null;
    this.uiStrings = null;
    this.initLanguageButtons();
    this.updateLanguageButtons();
  }

  initLanguageButtons() {
    // Desktop language buttons
    const langBtns = document.querySelectorAll('.header-nav .lang-btn');
    langBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.changeLanguage(e.target.dataset.lang);
      });
    });

    // Mobile language buttons
    const mobileLangBtns = document.querySelectorAll('.language-selector-mobile .lang-btn');
    mobileLangBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.changeLanguage(e.target.dataset.lang);
      });
    });
  }

  changeLanguage(lang) {
    if (!['pt', 'en', 'fr'].includes(lang)) lang = 'pt';
    if (this.currentLanguage === lang) return; // Não fiz nada se é o mesmo idioma
    
    this.currentLanguage = lang;
    localStorage.setItem('techmap-lang', lang);
    this.updateLanguageButtons();
    
    // Se os dados ainda não carregaram, marca para aplicar quando chegarem
    if (!this.data) {
      this._pendingLanguageApply = true;
      return;
    }
    
    // Aplicar mudanças imediatamente
    this.applyLanguage();
    
    // Forçar re-render do TechMap
    if (this.techMapInstance) {
      this.techMapInstance.reloadWithLanguage(this.currentLanguage);
    }
  }

  updateLanguageButtons() {
    // Desktop buttons
    document.querySelectorAll('.header-nav .lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === this.currentLanguage);
    });

    // Mobile buttons
    document.querySelectorAll('.language-selector-mobile .lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === this.currentLanguage);
    });
  }

  setData(data) {
    this.data = data;
    this.uiStrings = data.ui[this.currentLanguage];
    // Se houve troca de idioma antes dos dados carregarem, aplica agora
    if (this._pendingLanguageApply) {
      this._pendingLanguageApply = false;
      this.applyLanguage();
    }
  }

  setTechMapInstance(instance) {
    this.techMapInstance = instance;
  }

  getTechName(tech) {
    if (tech.translations && tech.translations[this.currentLanguage]) {
      return tech.translations[this.currentLanguage].name;
    }
    return tech.name || 'Unknown';
  }

  getTechDescription(tech) {
    if (tech.translations && tech.translations[this.currentLanguage]) {
      return tech.translations[this.currentLanguage].description;
    }
    return tech.description || '';
  }

  getTechFeatures(tech) {
    if (tech.translations && tech.translations[this.currentLanguage]) {
      return tech.translations[this.currentLanguage].features;
    }
    return tech.features || [];
  }

  getLayerName(layer) {
    if (layer.translations && layer.translations[this.currentLanguage]) {
      return layer.translations[this.currentLanguage].name;
    }
    if (layer.name) {
      return layer.name;
    }
    return 'Unknown';
  }

  getDataFlowInfo(flow) {
    const translations = this.data.dataFlow[this.currentLanguage] || [];
    const translated = translations.find(f => f.from === flow.from);
    return translated || flow;
  }

  getCategoryName(categoryId) {
    const categories = this.data.categories[this.currentLanguage] || [];
    return categories.find(cat => cat === categoryId) || categoryId;
  }

  getUIString(path) {
    // Get nested string from UI translations (e.g., "hero.title")
    const keys = path.split('.');
    let value = this.data.ui[this.currentLanguage];
    for (const key of keys) {
      value = value?.[key];
    }
    return value || path;
  }

  applyLanguage() {
    // Atualizar strings de UI para o idioma selecionado
    this.uiStrings = this.data.ui[this.currentLanguage] || this.data.ui['pt'];

    // Traduzir header/navigation
    this.translateHeader();

    // Traduzir hero section
    this.translateHero();

    // Traduzir botões de filtro
    this.translateControls();

    // Traduzir seções
    this.translateSections();

    // Traduzir overview cards
    this.translateOverview();

    // Traduzir legenda
    this.translateLegend();

    // Traduzir footer
    this.translateFooter();

    // Atualizar nomes de tecnologias visíveis
    this.updateTechCards();
  }

  translateHeader() {
    // Traduzir links de navegação
    const sectionKeyMap = {
      '#map-section': 'mapa',
      '#layers-section': 'camadas',
      '#flow-section': 'fluxo',
      '#overview-section': 'visaoGeral'
    };

    document.querySelectorAll('.nav-link').forEach(link => {
      const section = link.dataset.section;
      const key = sectionKeyMap[section];
      if (key && this.uiStrings.header[key]) {
        link.textContent = this.uiStrings.header[key];
      }
    });

    // Traduzir botão voltar
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
      backBtn.textContent = this.uiStrings.header.voltar;
    }
  }

  translateHero() {
    // Hero badge
    const heroBadge = document.querySelector('.hero-badge');
    if (heroBadge) {
      heroBadge.textContent = this.uiStrings.hero.badge;
    }

    // Hero title
    const h1 = document.querySelector('.hero h1');
    if (h1) {
      const titleText = this.currentLanguage === 'en' 
        ? `${this.uiStrings.hero.title}<br><em>${this.uiStrings.hero.titleEmphasis}</em>`
        : `${this.uiStrings.hero.titleEmphasis}<br><em>${this.uiStrings.hero.title}</em>`;
      h1.innerHTML = titleText;
    }

    // Hero description
    const heroPara = document.querySelector('.hero > p');
    if (heroPara) {
      heroPara.textContent = this.uiStrings.hero.description;
    }

    // Stats
    const stats = document.querySelectorAll('.stat small');
    const statKeys = ['tecnologias', 'camadas', 'apisExternas', 'typescript'];
    stats.forEach((stat, idx) => {
      if (statKeys[idx]) {
        stat.textContent = this.uiStrings.hero.stats[statKeys[idx]];
      }
    });
  }

  translateControls() {
    // Botões de filtro
    const controlBtns = document.querySelectorAll('.control-btn');
    const btnMap = {
      'all': 'todas',
      'Frontend': 'frontend',
      'Backend': 'backend',
      'Database': 'database',
      'External API': 'apisExternas',
      'DevOps': 'devops'
    };

    controlBtns.forEach(btn => {
      const category = btn.dataset.category;
      const key = btnMap[category];
      if (key && this.uiStrings.controls[key]) {
        // Preservar o dot se existir
        const dot = btn.querySelector('.dot');
        if (dot) {
          btn.innerHTML = dot.outerHTML + this.uiStrings.controls[key];
        } else {
          btn.textContent = this.uiStrings.controls[key];
        }
      }
    });
  }

  translateSections() {
    // Map Section
    const mapLabel = document.querySelector('[class*="section-label"]');
    if (mapLabel) {
      mapLabel.textContent = this.uiStrings.sections.mapaSectionLabel;
    }

    // Toolbar hint
    const toolbarHint = document.querySelector('.toolbar-hint');
    if (toolbarHint) {
      toolbarHint.textContent = this.uiStrings.sections.mapaSectionHint;
    }

    // Reset button
    const resetBtn = document.querySelector('.reset-btn');
    if (resetBtn) {
      resetBtn.textContent = this.uiStrings.sections.mapaReset;
    }

    // Info panel empty message
    const infoEmpty = document.querySelector('.info-empty p');
    if (infoEmpty) {
      infoEmpty.textContent = this.uiStrings.sections.mapaEmpty;
    }

    // Layers Section
    const sectionLabels = document.querySelectorAll('.section-label');
    if (sectionLabels[1]) sectionLabels[1].textContent = this.uiStrings.sections.cama;

    const sectionTitles = document.querySelectorAll('.section-title');
    if (sectionTitles[0]) sectionTitles[0].textContent = this.uiStrings.sections.camadasTitle;

    const sectionSubs = document.querySelectorAll('.section-sub');
    if (sectionSubs[0]) sectionSubs[0].textContent = this.uiStrings.sections.camadasSub;

    // Flow Section
    if (sectionLabels[2]) sectionLabels[2].textContent = this.uiStrings.sections.fluxoLabel;
    if (sectionTitles[1]) sectionTitles[1].textContent = this.uiStrings.sections.fluxoTitle;
    if (sectionSubs[1]) sectionSubs[1].textContent = this.uiStrings.sections.fluxoSub;

    // Overview Section
    if (sectionLabels[3]) sectionLabels[3].textContent = this.uiStrings.sections.visaoLabel;
    if (sectionTitles[2]) sectionTitles[2].textContent = this.uiStrings.sections.visaoTitle;
  }

  translateOverview() {
    const overviewCards = document.querySelectorAll('.overview-card');
    const cardData = [
      { title: 'frontendTitle', content: 'frontendContent' },
      { title: 'backendTitle',  content: 'backendContent' },
      { title: 'integracoesTitle', content: 'integracoesContent' },
      { title: 'devopsTitle',  content: 'devopsContent' }
    ];

    overviewCards.forEach((card, idx) => {
      if (!cardData[idx]) return;

      const h3 = card.querySelector('h3');
      if (h3) {
        h3.textContent = this.uiStrings.overview[cardData[idx].title];
      }

      const p = card.querySelector('p');
      if (p && this.uiStrings.overview[cardData[idx].content]) {
        p.innerHTML = this.uiStrings.overview[cardData[idx].content];
      }
    });

    // Principais Integrações box
    const integracoesBox = document.querySelector('.integrations-box h3');
    if (integracoesBox) {
      integracoesBox.textContent = this.uiStrings.overview.principaisIntegracoes;
    }

    // Traduzir itens da lista de integrações
    const integrationList = document.querySelectorAll('.integration-list li');
    const integrationKeys = [
      'frontendBackend',
      'backendDatabase',
      'backendApis',
      'autenticacao',
      'realtime',
      'imagens'
    ];

    integrationList.forEach((li, idx) => {
      if (integrationKeys[idx]) {
        li.innerHTML = '<span class="check">✓</span>' + this.getIntegrationText(integrationKeys[idx]);
      }
    });
  }

  getIntegrationText(key) {
    const text = this.uiStrings.overview[key];
    if (key === 'frontendBackend' || key === 'backendDatabase' || key === 'backendApis' || key === 'autenticacao' || key === 'realtime' || key === 'imagens') {
      const [label, desc] = text.split(' — ');
      return `<strong>${label}</strong> — ${desc}`;
    }
    return text;
  }

  translateLegend() {
    const legendItems = document.querySelectorAll('.legend-item');
    const legendLabels = ['Frontend', 'Backend', 'Database', 'External API', 'DevOps'];
    
    legendItems.forEach((item, idx) => {
      if (legendLabels[idx]) {
        const categoryName = this.getCategoryOrLegendName(legendLabels[idx]);
        if (item.querySelector('.legend-dot')) {
          item.innerHTML = item.querySelector('.legend-dot').outerHTML + categoryName;
        } else {
          item.textContent = categoryName;
        }
      }
    });
  }

  getCategoryOrLegendName(name) {
    // Mapa de categoria canônica (EN/PT) → chave no array de categories do idioma
    const canonicalIndex = ['Frontend', 'Backend', 'Database', 'External API', 'DevOps'];
    const idx = canonicalIndex.indexOf(name);
    if (idx !== -1) {
      const categories = this.data.categories[this.currentLanguage] || [];
      return categories[idx] || name;
    }
    return name;
  }

  translateFooter() {
    const footerText = document.querySelector('.footer-inner p');
    if (footerText) {
      const boldText = footerText.querySelector('strong')?.textContent || 'French Game';
      footerText.innerHTML = `${this.uiStrings.footer.text} <strong>${boldText}</strong>`;
    }
  }

  updateTechCards() {
    // Atualizar nomes de tecnologias visíveis
    const techCards = document.querySelectorAll('[data-tech-id]');
    techCards.forEach(card => {
      const techId = card.dataset.techId;
      const tech = this.data.technologies.find(t => t.id === techId);
      if (tech) {
        const nameEl = card.querySelector('[data-field="name"]');
        const descEl = card.querySelector('[data-field="description"]');
        if (nameEl) nameEl.textContent = this.getTechName(tech);
        if (descEl) descEl.textContent = this.getTechDescription(tech);
      }
    });
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }
}

// Inicializa o gerenciador de idiomas quando DOM estiver pronto
let languageManager;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    languageManager = new LanguageManager();
  });
} else {
  languageManager = new LanguageManager();
}
