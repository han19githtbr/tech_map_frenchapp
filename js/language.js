/**
 * Language Manager for TechMap
 * Gerencia a troca de idiomas da aplicação
 */

class LanguageManager {
  constructor() {
    this.currentLanguage = localStorage.getItem('techmap-lang') || 'pt';
    this.data = null;
    this.techMapInstance = null;
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
    this.currentLanguage = lang;
    localStorage.setItem('techmap-lang', lang);
    this.updateLanguageButtons();
    this.applyLanguage();
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
    // Para camadas, o nome pode estar no objeto ou precisar ser traduzido
    if (layer.translations && layer.translations[this.currentLanguage]) {
      return layer.translations[this.currentLanguage].name;
    }
    if (layer.name) {
      return layer.name;
    }
    return 'Unknown';
  }

  getDataFlowInfo(flow) {
    // Traduz os nomes de from/to no fluxo de dados
    const translations = this.data.dataFlow[this.currentLanguage] || [];
    const translated = translations.find(f => f.from === flow.from);
    return translated || flow;
  }

  applyLanguage() {
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

    // Atualizar labels no header
    document.querySelectorAll('.nav-link').forEach(link => {
      const section = link.dataset.section;
      const labels = {
        pt: { '#map-section': 'Mapa', '#layers-section': 'Camadas', '#flow-section': 'Fluxo', '#overview-section': 'Visão Geral' },
        en: { '#map-section': 'Map', '#layers-section': 'Layers', '#flow-section': 'Flow', '#overview-section': 'Overview' },
        fr: { '#map-section': 'Carte', '#layers-section': 'Couches', '#flow-section': 'Flux', '#overview-section': 'Aperçu' }
      };
      if (labels[this.currentLanguage] && labels[this.currentLanguage][section]) {
        link.textContent = labels[this.currentLanguage][section];
      }
    });

    // Se TechMap já foi inicializado, recarrega os dados
    if (this.techMapInstance) {
      this.techMapInstance.reloadWithLanguage(this.currentLanguage);
    }
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
