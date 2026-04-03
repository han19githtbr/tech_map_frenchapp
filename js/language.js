/**
 * Language Manager for TechMap
 * Gerencia a troca de idiomas da aplicação
 */

class LanguageManager {
  constructor(allData) {
    this.currentLanguage = localStorage.getItem('techmap-lang') || 'pt';
    this.allData = allData || {};
    this.techMapInstance = null;
    console.log(`[LanguageManager] Inicializado com idioma: ${this.currentLanguage}`);
    console.log(`[LanguageManager] allData recebido:`, allData);
    this.initLanguageButtons();
    this.updateLanguageButtons();
    // Aplicar tradução inicial
    console.log('[LanguageManager] Aplicando tradução inicial da página...');
    this.applyLanguageToAllElements();
  }

  initLanguageButtons() {
    console.log('[LanguageManager.initLanguageButtons] Inicializando botões de idioma...');
    
    // Desktop language buttons
    const langBtns = document.querySelectorAll('.header-nav .lang-btn');
    console.log(`[LanguageManager.initLanguageButtons] Encontrados ${langBtns.length} botões no header`);
    
    langBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lang = e.target.dataset.lang;
        console.log(`[LanguageManager.initLanguageButtons] Desktop botão ${lang} clicado`);
        this.changeLanguage(lang);
      });
    });

    // Mobile language buttons
    const mobileLangBtns = document.querySelectorAll('.language-selector-mobile .lang-btn');
    console.log(`[LanguageManager.initLanguageButtons] Encontrados ${mobileLangBtns.length} botões mobile`);
    
    mobileLangBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lang = e.target.dataset.lang;
        console.log(`[LanguageManager.initLanguageButtons] Mobile botão ${lang} clicado`);
        this.changeLanguage(lang);
      });
    });
  }

  changeLanguage(lang) {
    if (!['pt', 'en', 'fr'].includes(lang)) lang = 'pt';
    if (this.currentLanguage === lang) {
      console.log(`[LanguageManager.changeLanguage] Idioma já é ${lang}, ignorando`);
      return;
    }
    
    console.log(`[LanguageManager.changeLanguage] *** MUDANDO IDIOMA PARA: ${lang} ***`);
    this.currentLanguage = lang;
    localStorage.setItem('techmap-lang', lang);
    this.updateLanguageButtons();
    
    // Aplicar tradução IMEDIATAMENTE
    this.applyLanguageToAllElements();
    
    // Forçar re-render do TechMap
    if (this.techMapInstance) {
      console.log('[LanguageManager.changeLanguage] Recarregando TechMap com novo idioma');
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
    console.log('[LanguageManager.setData] Dados recebidos, atualizando allData');
    this.allData = data;
    console.log('[LanguageManager.setData] Aplicando tradução após receber dados');
    this.applyLanguageToAllElements();
  }

  setTechMapInstance(instance) {
    this.techMapInstance = instance;
    console.log('[LanguageManager.setTechMapInstance] TechMap instance setado');
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
    const translations = this.allData.dataFlow[this.currentLanguage] || [];
    const translated = translations.find(f => f.from === flow.from);
    return translated || flow;
  }

  getCategoryName(categoryId) {
    const categories = this.allData.categories[this.currentLanguage] || [];
    return categories.find(cat => cat === categoryId) || categoryId;
  }

  getUIString(path) {
    // Get nested string from UI translations (e.g., "hero.title")
    const keys = path.split('.');
    let value = this.allData.ui[this.currentLanguage];
    for (const key of keys) {
      value = value?.[key];
    }
    return value || path;
  }

  applyLanguageToAllElements() {
    const lang = this.currentLanguage;
    console.log(`[applyLanguageToAllElements] Traduzindo página para ${lang}`);
    
    if (!this.allData || !this.allData.ui) {
      console.error('[applyLanguageToAllElements] ERROR: this.allData.ui é null/undefined', { allData: this.allData });
      return;
    }

    const ui = this.allData.ui[lang];
    if (!ui) {
      console.error(`[applyLanguageToAllElements] ERROR: UI para idioma ${lang} não encontrada`);
      console.log('[applyLanguageToAllElements] Idiomas disponíveis:', Object.keys(this.allData.ui));
      return;
    }

    try {
      // HEADER NAVIGATION
      console.log('[applyLanguageToAllElements] → Traduzindo header...');
      const navLinks = document.querySelectorAll('.nav-link');
      console.log(`   Encontrados ${navLinks.length} nav-links`);
      navLinks.forEach(link => {
        const section = link.dataset.section;
        if (section === '#map-section' && ui.header?.mapa) {
          console.log(`   "${link.textContent}" → "${ui.header.mapa}"`);
          link.textContent = ui.header.mapa;
        }
        if (section === '#layers-section' && ui.header?.camadas) {
          link.textContent = ui.header.camadas;
        }
        if (section === '#flow-section' && ui.header?.fluxo) {
          link.textContent = ui.header.fluxo;
        }
        if (section === '#overview-section' && ui.header?.visaoGeral) {
          link.textContent = ui.header.visaoGeral;
        }
      });
      
      const backBtn = document.querySelector('.back-btn');
      if (backBtn && ui.header?.voltar) {
        backBtn.textContent = ui.header.voltar;
      }

      // HERO SECTION
      console.log('[applyLanguageToAllElements] → Traduzindo hero section...');
      const heroBadge = document.querySelector('.hero-badge');
      if (heroBadge && ui.hero?.badge) {
        console.log(`   Badge: "${heroBadge.textContent}" → "${ui.hero.badge}"`);
        heroBadge.textContent = ui.hero.badge;
      }
      
      const h1 = document.querySelector('.hero h1');
      if (h1 && ui.hero?.title) {
        if (lang === 'en') {
          h1.innerHTML = `${ui.hero.title}<br><em>${ui.hero.titleEmphasis}</em>`;
        } else {
          h1.innerHTML = `${ui.hero.titleEmphasis}<br><em>${ui.hero.title}</em>`;
        }
        console.log(`   H1 traduzido para ${lang}`);
      }
      
      const heroPara = document.querySelector('.hero > p');
      if (heroPara && ui.hero?.description) {
        heroPara.textContent = ui.hero.description;
      }

      // STATS
      console.log('[applyLanguageToAllElements] → Traduzindo stats...');
      const stats = document.querySelectorAll('.stat small');
      if (stats[0] && ui.hero?.stats?.tecnologias) stats[0].textContent = ui.hero.stats.tecnologias;
      if (stats[1] && ui.hero?.stats?.camadas) stats[1].textContent = ui.hero.stats.camadas;
      if (stats[2] && ui.hero?.stats?.apisExternas) stats[2].textContent = ui.hero.stats.apisExternas;
      if (stats[3] && ui.hero?.stats?.typescript) stats[3].textContent = ui.hero.stats.typescript;

      // CONTROL BUTTONS
      console.log('[applyLanguageToAllElements] → Traduzindo control buttons...');
      document.querySelectorAll('.control-btn').forEach(btn => {
        const category = btn.dataset.category;
        let text = '';
        if (category === 'all' && ui.controls?.todas) text = ui.controls.todas;
        else if (category === 'Frontend' && ui.controls?.frontend) text = ui.controls.frontend;
        else if (category === 'Backend' && ui.controls?.backend) text = ui.controls.backend;
        else if (category === 'Database' && ui.controls?.database) text = ui.controls.database;
        else if (category === 'External API' && ui.controls?.apisExternas) text = ui.controls.apisExternas;
        else if (category === 'DevOps' && ui.controls?.devops) text = ui.controls.devops;
        
        if (text) {
          const dot = btn.querySelector('.dot');
          if (dot) {
            btn.innerHTML = dot.outerHTML + text;
          } else {
            btn.textContent = text;
          }
        }
      });

      // SECTIONS
      console.log('[applyLanguageToAllElements] → Traduzindo sections...');
      const sectionLabels = document.querySelectorAll('.section-label');
      const sectionTitles = document.querySelectorAll('.section-title');
      const sectionSubs = document.querySelectorAll('.section-sub');
      
      if (sectionLabels[0] && ui.sections?.mapaSectionLabel) sectionLabels[0].textContent = ui.sections.mapaSectionLabel;
      if (sectionLabels[1] && ui.sections?.cama) sectionLabels[1].textContent = ui.sections.cama;
      if (sectionLabels[2] && ui.sections?.fluxoLabel) sectionLabels[2].textContent = ui.sections.fluxoLabel;
      if (sectionLabels[3] && ui.sections?.visaoLabel) sectionLabels[3].textContent = ui.sections.visaoLabel;

      if (sectionTitles[0] && ui.sections?.camadasTitle) sectionTitles[0].textContent = ui.sections.camadasTitle;
      if (sectionTitles[1] && ui.sections?.fluxoTitle) sectionTitles[1].textContent = ui.sections.fluxoTitle;
      if (sectionTitles[2] && ui.sections?.visaoTitle) sectionTitles[2].textContent = ui.sections.visaoTitle;

      if (sectionSubs[0] && ui.sections?.camadasSub) sectionSubs[0].textContent = ui.sections.camadasSub;
      if (sectionSubs[1] && ui.sections?.fluxoSub) sectionSubs[1].textContent = ui.sections.fluxoSub;

      // TOOLBAR
      const toolbarHint = document.querySelector('.toolbar-hint');
      if (toolbarHint && ui.sections?.mapaSectionHint) toolbarHint.textContent = ui.sections.mapaSectionHint;
      
      const resetBtn = document.querySelector('.reset-btn');
      if (resetBtn && ui.sections?.mapaReset) resetBtn.textContent = ui.sections.mapaReset;
      
      const infoEmpty = document.querySelector('.info-empty p');
      if (infoEmpty && ui.sections?.mapaEmpty) infoEmpty.textContent = ui.sections.mapaEmpty;

      console.log('[applyLanguageToAllElements] ✓ TRADUÇÃO CONCLUÍDA COM SUCESSO!');
    } catch (err) {
      console.error('[applyLanguageToAllElements] ✗ ERRO DURANTE TRADUÇÃO:', err);
    }
  }

  translateHeader() {
    console.log('[translateHeader] Iniciando tradução do header...');
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
      if (key && this.uiStrings?.header[key]) {
        const newText = this.uiStrings.header[key];
        console.log(`[translateHeader] Traduzindo ${section} para: ${newText}`);
        link.textContent = newText;
      }
    });

    // Traduzir botão voltar
    const backBtn = document.querySelector('.back-btn');
    if (backBtn && this.uiStrings?.header.voltar) {
      console.log(`[translateHeader] Traduzindo botão voltar para: ${this.uiStrings.header.voltar}`);
      backBtn.textContent = this.uiStrings.header.voltar;
    }
    console.log('[translateHeader] Tradução do header concluída');
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
