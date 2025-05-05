document.addEventListener('DOMContentLoaded', function() {
  // ===== Elementos do DOM =====
  const searchBtn = document.getElementById('searchButton');
  const searchInput = document.getElementById('searchInput');
  const mediaType = document.getElementById('mediaType');
  const resultsDiv = document.getElementById('results');
  const modal = document.getElementById('movieModal');
  const closeModal = document.querySelector('.close-modal');
  const modalContent = document.querySelector('.modal-content');
  const loadingIndicator = document.getElementById('loadingIndicator');
  
  let currentMediaType = 'movie';

  // ===== Configuração da API =====
  const API_BASE_URL = 'http://localhost:3000/api';
  const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';
  const PLACEHOLDER_IMG = 'https://via.placeholder.com/300x450?text=Sem+Imagem';

  // ===== Busca Trending =====
  async function fetchTrending(type = 'movie') {
    try {
      showLoading(true);
      const response = await fetch(`${API_BASE_URL}/trending?type=${type}`);
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      displayResults(data.results);
    } catch (error) {
      console.error('Erro ao buscar em alta:', error);
      showError('Falha ao carregar conteúdos em alta. Tente novamente mais tarde.');
    } finally {
      showLoading(false);
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
        <img src="${item.poster_path ? `${IMG_BASE_URL}${item.poster_path}` : PLACEHOLDER_IMG}"
             alt="${item.title || item.name}"
             loading="lazy">
        <div class="media-info">
          <h3>${item.title || item.name}</h3>
          <p>${(item.release_date || item.first_air_date)?.substring(0,4) || 'N/A'}</p>
          <p>⭐ ${item.vote_average?.toFixed(1) || 'Sem avaliação'}</p>
        </div>
      </div>
    `).join('');

    // Adiciona event listeners aos cards
    document.querySelectorAll('.media-card').forEach(card => {
      card.addEventListener('click', () => {
        openMediaDetails(card.dataset.id, card.dataset.type);
      });
    });
  }

  // ===== Busca Manual =====
  async function searchMedia() {
    const query = searchInput.value.trim();
    if (!query) {
      showError('Por favor, digite um termo para busca');
      return;
    }

    try {
      showLoading(true);
      searchBtn.disabled = true;
      
      const response = await fetch(
        `${API_BASE_URL}/search?query=${encodeURIComponent(query)}&type=${currentMediaType}`
      );
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      displayResults(data.results);
    } catch (error) {
      console.error('Erro na busca:', error);
      showError('Falha na busca. Verifique sua conexão e tente novamente.');
    } finally {
      showLoading(false);
      searchBtn.disabled = false;
    }
  }

  // ===== Abre Modal Detalhes =====
  async function openMediaDetails(id, type) {
    try {
      showLoading(true, modalContent);
      modal.classList.remove('hidden');
      
      const [detailsResponse, creditsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/details?id=${id}&type=${type}`),
        fetch(`${API_BASE_URL}/credits?id=${id}&type=${type}`)
      ]);
      
      if (!detailsResponse.ok || !creditsResponse.ok) {
        throw new Error('Erro ao carregar detalhes');
      }
      
      const [details, credits] = await Promise.all([
        detailsResponse.json(),
        creditsResponse.json()
      ]);
      
      renderModalDetails(details, credits);
    } catch (error) {
      console.error('Erro ao abrir detalhes:', error);
      modalContent.innerHTML = `
        <div class="error">
          <p>Erro ao carregar detalhes</p>
          <button class="retry-btn">Tentar novamente</button>
        </div>
      `;
      
      modalContent.querySelector('.retry-btn').addEventListener('click', () => {
        openMediaDetails(id, type);
      });
    } finally {
      showLoading(false, modalContent);
    }
  }

  // ===== Preenche o Modal =====
  function renderModalDetails(details, credits) {
    const modalBody = modal.querySelector('.modal-body');
    
    // Template para os detalhes
    modalBody.innerHTML = `
      <div class="modal-poster">
        <img src="${details.poster_path ? `${IMG_BASE_URL}${details.poster_path}` : PLACEHOLDER_IMG}"
             alt="${details.title || details.name}">
      </div>
      <div class="modal-info">
        <h2 id="modal-title">${details.title || details.name}</h2>
        <div class="meta-info">
          <span id="modal-year">${(details.release_date || details.first_air_date)?.substring(0,4) || 'N/A'}</span>
          <span id="modal-runtime">
            ${details.runtime ? `${Math.floor(details.runtime/60)}h ${details.runtime%60}m` : 
             details.number_of_seasons ? `${details.number_of_seasons} temporada(s)` : 'N/A'}
          </span>
          <span id="modal-rating">⭐ ${details.vote_average?.toFixed(1) || 'N/A'}</span>
        </div>
        <p id="modal-overview">${details.overview || 'Sinopse não disponível'}</p>
        <div class="cast-container">
          <h3>Elenco Principal</h3>
          ${credits.cast?.length ? 
            credits.cast.slice(0,6).map(actor => `
              <div class="actor">
                <p><strong>${actor.name}</strong></p>
                <p>${actor.character || 'Personagem'}</p>
              </div>
            `).join('') : '<p>Informações de elenco não disponíveis</p>'}
        </div>
        <p id="modal-id">ID TMDB: ${details.id}</p>
      </div>
    `;
  }

  // ===== Helpers =====
  function showLoading(show, element = resultsDiv) {
    if (show) {
      element.innerHTML = '<div class="loading-spinner"></div>';
    } else if (element === resultsDiv && !element.hasChildNodes()) {
      element.innerHTML = '<p class="no-results">Nenhum conteúdo encontrado</p>';
    }
  }

  function showError(message) {
    resultsDiv.innerHTML = `<div class="error">${message}</div>`;
  }

  // ===== Event Listeners =====
  // Carrega conteúdo inicial
  fetchTrending();
  
  // Muda tipo de mídia
  mediaType.addEventListener('change', e => {
    currentMediaType = e.target.value;
    fetchTrending(currentMediaType);
  });
  
  // Busca manual
  searchBtn.addEventListener('click', searchMedia);
  searchInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') searchMedia();
  });
  
  // Fecha modal
  closeModal.addEventListener('click', () => modal.classList.add('hidden'));
  window.addEventListener('click', e => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  // ===== Dark Mode Toggle =====
  const themeToggle = document.createElement('button');
  themeToggle.id = 'themeToggle';
  themeToggle.textContent = '🌙';
  document.body.appendChild(themeToggle);

  // Aplica tema salvo ou preferência do sistema
  const applyTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    document.documentElement.classList.toggle('dark-theme', savedTheme === 'dark');
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
  };

  // Alterna entre os temas
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
  });

  // Inicializa tema
  applyTheme();
});
