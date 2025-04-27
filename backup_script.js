document.addEventListener('DOMContentLoaded', function() {
    // ========== [PARTE 1: ELEMENTOS DO DOM] ========== //
    const searchBtn = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    const resultsDiv = document.getElementById('results');
    
    let lastSearchType = 'movie';  // default
    
  // Busca os Trending (filmes ou séries) e exibe no page load
async function fetchTrending(type = 'movie') {
  try {
    const resp = await fetch(`/api/trending?type=${type}`); // Faz a requisição para o servidor
    if (!resp.ok) throw new Error('Erro ao buscar trending');
    const data = await resp.json();
    displayResults(data.results);  // Exibe os resultados
  } catch (err) {
    console.error('Erro no fetchTrending:', err);
  }
}
  
  +   // Já puxa os Trending de Filmes ao abrir a página
+   fetchTrending('movie');
  
  document.getElementById('mediaType').addEventListener('change', (e) => {
  fetchTrending(e.target.value);
});
  
  // No topo do script já deve existir:

const displayResults = (items) => {
  if (!items || items.length === 0) {
    resultsDiv.innerHTML = '<p class="no-results">Nenhum resultado encontrado</p>';
    return;
  }

  resultsDiv.innerHTML = items.map(item => {
    const posterUrl = item.poster_path
      ? 'https://image.tmdb.org/t/p/w500' + item.poster_path
      : 'placeholder.jpg';

    return `
      <div class="media-card" data-id="${item.id}" data-type="${lastSearchType}">
        <img src="${posterUrl}" alt="${item.title || item.name}">
        <div class="media-info">
          <h3>${item.title || item.name}</h3>
          <p>${(item.release_date || item.first_air_date)?.substring(0, 4) || 'N/A'}</p>
          <p>⭐ ${item.vote_average?.toFixed(1) || 'Sem avaliação'}</p>
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.media-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      openMediaDetails(id, lastSearchType);
    });
  });
};  

// <-- Aqui, você pode estar fechando a função com '}' extra.
         // ===== [ADICIONE AQUI] ===== //
    document.querySelectorAll('.media-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            const type = card.dataset.type;
            openMediaDetails(id, type); // Isso substitui o console.log anterior
        });
    });
    // ===== [ATÉ AQUI] ===== //

const searchMedia = async () => {
  // 1) pega o que o usuário digitou
  const query = searchInput.value.trim();
  const type  = document.getElementById('mediaType').value;
  lastSearchType = type;
  if (!query) return;

  // 2) bloco try/catch TODO dentro da função
  try {
    searchBtn.disabled = true;
    resultsDiv.innerHTML = '<div class="loading">Carregando...</div>';

    const response = await fetch(
      `/api/search?query=${encodeURIComponent(query)}&type=${type}`
    );
    if (!response.ok) throw new Error('Erro na resposta da API');

    const data = await response.json();
    displayResults(data.results);
  } catch (error) {
    console.error('Erro na busca:', error);
    resultsDiv.innerHTML = `<p class="error">Erro: ${error.message}</p>`;
  } finally {
    searchBtn.disabled = false;
  }
};  // ← aqui você só fecha a função DEPOIS de todo o try/catch

    // ========== [PARTE 3: EVENT 	LISTENERS ORIGINAIS] ========== //
    searchBtn.addEventListener('click', searchMedia);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchMedia();
    });

    // ========== [DARK MODE SIMPLIFICADO E FUNCIONAL] ========== //
    // 1. Cria o botão
    const themeToggle = document.createElement('button');
    themeToggle.id = 'themeToggle';
    themeToggle.innerHTML = '🌙';
    themeToggle.style.position = 'fixed';
    themeToggle.style.bottom = '20px';
    themeToggle.style.right = '20px';
    themeToggle.style.zIndex = '1000';
    themeToggle.style.background = 'rgba(0,0,0,0.5)';
    themeToggle.style.border = 'none';
    themeToggle.style.borderRadius = '50%';
    themeToggle.style.width = '40px';
    themeToggle.style.height = '40px';
    themeToggle.style.fontSize = '20px';
    themeToggle.style.cursor = 'pointer';
    document.body.appendChild(themeToggle);

    // 2. Verifica e aplica o tema inicial
    const currentTheme = localStorage.getItem('theme') || 
                       (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark-theme');
        themeToggle.textContent = '☀️';
    }

    // 3. Alternância do tema
    themeToggle.addEventListener('click', () => {
        const isDark = !document.documentElement.classList.contains('dark-theme');
        document.documentElement.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggle.textContent = isDark ? '☀️' : '🌙';
    });
});

// Variáveis globais
const modal = document.getElementById('movieModal');
const closeModal = document.querySelector('.close-modal');

// Função para abrir o modal com os detalhes
async function openMediaDetails(id, type) {
  try {
    // Mostra um loader enquanto carrega
    //modal.querySelector('.modal-body').innerHTML = '<div class="loading">Carregando...</div>';
    modal.style.display = 'block';
    
    // Busca os detalhes na API
    const detailsResponse = await fetch(`/api/details?id=${id}&type=${type}`);
    const details = await detailsResponse.json();
    
    // Busca o elenco (opcional)
    const creditsResponse = await fetch(`/api/credits?id=${id}&type=${type}`);
    const credits = await creditsResponse.json();
    
    // Preenche o modal
    renderModalDetails(details, credits);
    
  } catch (error) {
    console.error('Erro ao carregar detalhes:', error);
    modal.querySelector('.modal-body').innerHTML = `<div class="error">Erro ao carregar detalhes</div>`;
  }
}

// Função para renderizar os detalhes no modal
function renderModalDetails(details, credits) {
  const isMovie = !!details.title;

  // — Informações básicas —
  document.getElementById('modal-title').textContent  = details.title || details.name;
  document.getElementById('modal-year').textContent   = 
    (isMovie ? details.release_date : details.first_air_date)?.substring(0,4) || 'N/A';
  document.getElementById('modal-rating').textContent = `⭐ ${details.vote_average?.toFixed(1)}`;
  document.getElementById('modal-overview').textContent = details.overview || 'Sinopse não disponível.';

  // — Runtime ou temporadas —
  const runtimeEl = document.getElementById('modal-runtime');
  if (isMovie) {
    runtimeEl.textContent = `${Math.floor(details.runtime/60)}h ${details.runtime%60}m`;
  } else {
    runtimeEl.textContent = `${details.number_of_seasons} temporada(s)`;
  }

  // — Poster —
  const posterUrl = details.poster_path
    ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
    : 'placeholder.jpg';
  document.querySelector('.modal-poster').innerHTML = `<img src="${posterUrl}" alt="${details.title || details.name}">`;

  // — Elenco —
  const castContainer = document.querySelector('.cast-container');
  castContainer.innerHTML = '<h3>Elenco Principal</h3>';
  const cast = credits.cast?.slice(0,5).map(actor => `
    <div class="actor">
      <p><strong>${actor.name}</strong></p>
      <p>${actor.character || 'Personagem'}</p>
    </div>
  `).join('');
  castContainer.innerHTML += cast || '<p>Informações de elenco não disponíveis</p>';

  // — ID TMDB —
  document.getElementById('modal-id').textContent = `ID TMDB: ${details.id}`;
}
// Fechar ao clicar fora
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});


