document.addEventListener('DOMContentLoaded', function() {
}); 
  // ===== Elementos do DOM =====
  const searchBtn   = document.getElementById('searchButton');
  const searchInput = document.getElementById('searchInput');
  const mediaType   = document.getElementById('mediaType');
  const resultsDiv  = document.getElementById('results');
  const modal       = document.getElementById('movieModal');
  const closeModal  = document.querySelector('.close-modal');
  
  let currentMediaType = 'movie';

  // ===== Busca Trending =====
  async function fetchTrending(type = 'movie') {
    try {
      resultsDiv.innerHTML = '<div class="loading">Carregando...</div>';
      const resp = await fetch(`http://localhost:3000/api/trending?type=${type}`);
      if (!resp.ok) throw new Error('Erro na resposta');
      const data = await resp.json();
      displayResults(data.results);
    } catch (err) {
      console.error('Erro ao buscar em alta:', err);
      resultsDiv.innerHTML = `<div class="error">Erro: ${err.message}</div>`;
    }
  }

  // ===== Exibe Cards =====
  function displayResults(items) {
    if (!items || items.length === 0) {
      resultsDiv.innerHTML = '<p class="no-results">Nenhum resultado encontrado</p>';
      return;
    }
    resultsDiv.innerHTML = items.map(item => `
      <div class="media-card" data-id="${item.id}" data-type="${item.media_type || currentMediaType}">
        <img src="${item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : 'https://via.placeholder.com/300x450?text=Sem+Imagem'}"
             alt="${item.title || item.name}">
        <div class="media-info">
          <h3>${item.title || item.name}</h3>
          <p>${(item.release_date || item.first_air_date)?.substring(0,4) || 'N/A'}</p>
          <p>⭐ ${item.vote_average?.toFixed(1) || 'Sem avaliação'}</p>
        </div>
      </div>
    `).join('');
    document.querySelectorAll('.media-card').forEach(card => {
      card.addEventListener('click', () => {
        openMediaDetails(card.dataset.id, card.dataset.type);
      });
    });
  }

  // ===== Busca Manual =====
  async function searchMedia() {
    const query = searchInput.value.trim();
    if (!query) return;
    try {
      searchBtn.disabled = true;
      resultsDiv.innerHTML = '<div class="loading">Carregando...</div>';
      const resp = await fetch(
        `http://localhost:3000/api/search?query=${encodeURIComponent(query)}&type=${currentMediaType}`
      );
      if (!resp.ok) throw new Error('Erro na busca');
      const data = await resp.json();
      displayResults(data.results);
    } catch (err) {
      console.error('Erro na busca:', err);
      resultsDiv.innerHTML = `<div class="error">Erro: ${err.message}</div>`;
    } finally {
      searchBtn.disabled = false;
    }
  }

  // ===== Abre Modal Detalhes =====
  async function openMediaDetails(id, type) {
    try {
      modal.classList.remove('hidden');
      // NÃO APAGAMOS O HTML do modal-body aqui!

      const [detailsRes, creditsRes] = await Promise.all([
        fetch(`http://localhost:3000/api/details?id=${id}&type=${type}`),
        fetch(`http://localhost:3000/api/credits?id=${id}&type=${type}`)
      ]);
      if (!detailsRes.ok || !creditsRes.ok) throw new Error('Erro ao carregar detalhes');

      const details = await detailsRes.json();
      const credits = await creditsRes.json();
      renderModalDetails(details, credits);
    } catch (err) {
      console.error('Erro ao abrir detalhes:', err);
      modal.querySelector('.modal-body').innerHTML = `
        <div class="error">
          <p>Erro ao carregar detalhes</p>
          <button onclick="location.reload()">Tentar novamente</button>
        </div>
      `;
    }
  }

  // ===== Preenche o Modal =====
  function renderModalDetails(details, credits) {
    const modalEl = document.getElementById('movieModal');
    const getEl = sel => {
      const e = modalEl.querySelector(sel);
      if (!e) console.error(`Elemento não encontrado no modal: ${sel}`);
      return e;
    };

    const els = {
      title: getEl('#modal-title'),
      year: getEl('#modal-year'),
      runtime: getEl('#modal-runtime'),
      rating: getEl('#modal-rating'),
      overview: getEl('#modal-overview'),
      posterImg: getEl('.modal-poster img'),
      castContainer: getEl('.cast-container'),
      modalIdSpan: getEl('#modal-id')     // <— corrige aqui
    };

    if (!els.title || !els.posterImg) {
      modalEl.querySelector('.modal-body').innerHTML = `
        <div class="error">
          <p>Erro: Elementos do modal não carregados</p>
          <button onclick="location.reload()">Recarregar Página</button>
        </div>
      `;
      return;
    }

    // Preenche campos
    const isMovie = !!details.title;
    els.title.textContent    = details.title || details.name;
    els.year.textContent     = (details.release_date || details.first_air_date)?.substring(0,4) || 'N/A';
    els.rating.textContent   = `⭐ ${details.vote_average?.toFixed(1)}`;
    els.overview.textContent = details.overview || 'Sinopse não disponível';
    els.runtime.textContent  = isMovie
      ? (details.runtime ? `${Math.floor(details.runtime/60)}h ${details.runtime%60}m` : 'N/A')
      : (details.number_of_seasons ? `${details.number_of_seasons} temporada(s)` : 'N/A');

    // Poster
    els.posterImg.src = details.poster_path
      ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
      : 'https://via.placeholder.com/500x750?text=Sem+Poster';
    els.posterImg.alt = details.title || details.name;

    // Decora elenco
    els.castContainer.innerHTML = '<h3>Elenco Principal</h3>';
    if (credits.cast?.length) {
      credits.cast.slice(0,6).forEach(a => {
        const div = document.createElement('div');
        div.className = 'actor';
        div.innerHTML = `<p><strong>${a.name}</strong></p><p>${a.character || 'Personagem'}</p>`;
        els.castContainer.appendChild(div);
      });
    } else {
      els.castContainer.innerHTML += '<p>Informações de elenco não disponíveis</p>';
    }

    // ID TMDB no formato completo
    if (els.modalIdSpan) {
      els.modalIdSpan.textContent = `ID TMDB: ${details.id}`;
    }
  }

  // ===== Event Listeners =====
  fetchTrending();
  mediaType.addEventListener('change', e => {
    currentMediaType = e.target.value;
    fetchTrending(currentMediaType);
  });
  searchBtn.addEventListener('click', searchMedia);
  searchInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') searchMedia();
  });
  closeModal.addEventListener('click', () => modal.classList.add('hidden'));
   
   // Fechar ao clicar fora
  window.addEventListener('click', e => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  // ===== Dark Mode Toggle =====
const themeToggle = document.createElement('button');
themeToggle.id = 'themeToggle';
themeToggle.textContent = '🌙';
document.body.appendChild(themeToggle);

// Aplica tema salvo ou preferência do sistema
const savedTheme = localStorage.getItem('theme') 
  || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark-theme');
  themeToggle.textContent = '☀️';
}

// Alterna entre os temas
themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.classList.toggle('dark-theme');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  themeToggle.textContent = isDark ? '☀️' : '🌙';
});
	
