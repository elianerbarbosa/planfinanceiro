'use strict';

/* =====================================================
   main.js — Planejamento Financeiro
   Módulos:
     1. Gráfico Plotly
     2. Menu mobile / submenu
     3. Scroll suave
     4. Animação de entrada (IntersectionObserver)
     5. Formulário de contato (fetch + FormSubmit)
     6. Animação de digitação
     7. Ano no footer
   ===================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ─────────────────────────────────────────────
     1. GRÁFICO PLOTLY
  ───────────────────────────────────────────── */
  function initGrafico() {
    const plotEl = document.getElementById('myPlot');
    if (!plotEl || typeof Plotly === 'undefined') return;

    const data = [{
      labels: ['40% mais pobres', '50% intermediários', '10% mais ricos'],
      values: [40, 50, 10],
      type: 'pie',
      hole: 0.4,
      marker: {
        colors: ['#72c8cd', '#4a9fa3', '#1a7075']
      },
      textfont: { color: '#fff' }
    }];

    const layout = {
      title: {
        text: 'Distribuição de Grupos de Renda (%)',
        font: { color: '#72c8cd', size: 16 }
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor:  'transparent',
      legend: { font: { color: '#ddd' } },
      margin: { t: 50, b: 20, l: 20, r: 20 }
    };

    const config = { responsive: true, displayModeBar: false };

    Plotly.newPlot('myPlot', data, layout, config);
  }

  // Plotly carrega de forma assíncrona — aguardar se necessário
  if (typeof Plotly !== 'undefined') {
    initGrafico();
  } else {
    // Tentar de novo após o script externo carregar
    window.addEventListener('load', initGrafico);
  }


  /* ─────────────────────────────────────────────
     2. MENU MOBILE E SUBMENU
  ───────────────────────────────────────────── */
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu    = document.getElementById('nav-menu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', function () {
      const isOpen = navMenu.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      const icon = menuToggle.querySelector('i');
      icon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
    });

    // Fechar ao clicar fora
    document.addEventListener('click', function (e) {
      if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        navMenu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.querySelector('i').className = 'fas fa-bars';
      }
    });

    // Fechar com Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.querySelector('i').className = 'fas fa-bars';
        menuToggle.focus();
      }
    });
  }

  // Submenu acessível via teclado (Enter/Espaço no item pai)
  document.querySelectorAll('.has-submenu > a').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const li = this.parentElement;
      const isOpen = li.classList.toggle('submenu-open');
      this.setAttribute('aria-expanded', String(isOpen));
    });
  });


  /* ─────────────────────────────────────────────
     3. SCROLL SUAVE
  ───────────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const headerH = document.querySelector('header')?.offsetHeight || 80;
      window.scrollTo({
        top: target.offsetTop - headerH,
        behavior: 'smooth'
      });

      // Fechar menu mobile se estiver aberto
      if (navMenu && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.querySelector('i').className = 'fas fa-bars';
      }
    });
  });


  /* ─────────────────────────────────────────────
     4. ANIMAÇÃO DE ENTRADA (IntersectionObserver)
  ───────────────────────────────────────────── */
  // Animação de entrada — sempre visível, efeito suave ao rolar no GitHub Pages
  const SELETORES = '.knowledge-card, .planning-card, .investment-item, .investment-type';

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });

    document.querySelectorAll(SELETORES).forEach(function (el) {
      obs.observe(el);
    });
  } else {
    // Fallback: mostrar tudo sem animação
    document.querySelectorAll(SELETORES).forEach(function (el) {
      el.classList.add('visible');
    });
  }


  /* ─────────────────────────────────────────────
     5. FORMULÁRIO DE CONTATO
        Usa fetch para não redirecionar a página.
        Requer ativação prévia do e-mail no FormSubmit.
  ───────────────────────────────────────────── */
  const form       = document.getElementById('contact-form');
  const msgEl      = document.getElementById('form-message');

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Validação básica
      let valid = true;
      form.querySelectorAll('[required]').forEach(function (field) {
        if (!field.value.trim()) {
          valid = false;
          field.classList.add('is-invalid');
        } else {
          field.classList.remove('is-invalid');
          if (field.type === 'email') {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
            if (!re.test(field.value)) {
              valid = false;
              field.classList.add('is-invalid');
            }
          }
        }
      });

      if (!valid) {
        showMsg('Por favor, preencha todos os campos corretamente.', 'error');
        form.querySelector('.is-invalid')?.focus();
        return;
      }

      // Estado de carregamento
      const btn     = form.querySelector('.submit-btn');
      const btnText = btn.querySelector('.btn-text');
      btn.disabled  = true;
      btn.classList.add('loading');
      if (btnText) btnText.textContent = 'Enviando…';

      try {
        const formData = new FormData(form);
        const res = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' }
        });

        if (res.ok || res.redirected) {
          showMsg('✅ Mensagem enviada com sucesso! Retornarei em breve.', 'success');
          form.reset();
        } else {
          throw new Error('Status ' + res.status);
        }
      } catch {
        showMsg('⚠️ Não foi possível enviar. Tente pelo WhatsApp ou e-mail direto.', 'error');
      } finally {
        btn.disabled = false;
        btn.classList.remove('loading');
        if (btnText) btnText.textContent = 'ENVIAR';
      }
    });

    // Limpar classe inválida ao digitar
    form.querySelectorAll('.form-control').forEach(function (field) {
      field.addEventListener('input', function () {
        this.classList.remove('is-invalid');
        if (msgEl) msgEl.className = 'form-message';
      });
    });
  }

  function showMsg(text, type) {
    if (!msgEl) return;
    msgEl.textContent  = text;
    msgEl.className    = 'form-message ' + type;
    msgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    // Auto-remover após 7s
    setTimeout(function () { msgEl.className = 'form-message'; }, 7000);
  }


  /* ─────────────────────────────────────────────
     6. ANIMAÇÃO DE DIGITAÇÃO
        (Aplica-se a elementos com classe .digitando)
  ───────────────────────────────────────────── */
  function ativaLetra(el) {
    if (!el) return;
    const texto = el.textContent.trim();
    el.textContent = '';
    texto.split('').forEach(function (letra, i) {
      setTimeout(function () { el.textContent += letra; }, 75 * i);
    });
  }

  const digitando = document.querySelector('.digitando');
  if (digitando) ativaLetra(digitando);


  /* ─────────────────────────────────────────────
     7. ANO DINÂMICO NO FOOTER
  ───────────────────────────────────────────── */
  const anoEl = document.getElementById('ano');
  if (anoEl) anoEl.textContent = new Date().getFullYear();

  console.info('%c💰 Planejamento Financeiro — Eliane R. Barbosa', 'color:#72c8cd;font-weight:700;');
});
