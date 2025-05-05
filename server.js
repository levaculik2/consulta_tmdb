require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit'); // Adicionando rate limiting para segurança

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.TMDB_API_KEY;

// Configuração de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares
app.use(cors());
app.use(express.json()); // Adicionando suporte a JSON
app.use(express.static(path.join(__dirname, 'public')));
app.use(limiter); // Aplicando rate limiting a todas as rotas

// Função auxiliar para fazer requisições à API TMDB
const fetchFromTMDB = async (url, errorMessage) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`${errorMessage}:`, error.message);
    throw new Error(errorMessage);
  }
};

// ==========================
// ROTA PARA BUSCAR TRENDING
// ==========================
app.get('/api/trending', async (req, res) => {
  const { type = 'movie' } = req.query; // 'movie' ou 'tv', padrão para 'movie'
  
  if (type !== 'movie' && type !== 'tv') {
    return res.status(400).json({ error: 'Parâmetro "type" deve ser "movie" ou "tv"' });
  }

  try {
    const url = `https://api.themoviedb.org/3/trending/${type}/week?api_key=${API_KEY}&language=pt-BR`;
    const data = await fetchFromTMDB(url, 'Erro ao buscar trending');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================
// ROTA PARA BUSCA MANUAL
// ==========================
app.get('/api/search', async (req, res) => {
  const { query, type = 'movie' } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Parâmetro "query" é obrigatório' });
  }

  if (type !== 'movie' && type !== 'tv' && type !== 'multi') {
    return res.status(400).json({ error: 'Parâmetro "type" deve ser "movie", "tv" ou "multi"' });
  }

  try {
    const url = `https://api.themoviedb.org/3/search/${type}?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR&page=1`;
    const data = await fetchFromTMDB(url, 'Erro ao buscar no TMDB');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================
// ROTA PARA DETALHES DE FILMES/SÉRIES
// ==========================
app.get('/api/details', async (req, res) => {
  const { id, type } = req.query;

  if (!id || !type) {
    return res.status(400).json({ error: 'Parâmetros "id" e "type" são obrigatórios' });
  }

  if (type !== 'movie' && type !== 'tv') {
    return res.status(400).json({ error: 'Parâmetro "type" deve ser "movie" ou "tv"' });
  }

  try {
    const url = `https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=pt-BR&append_to_response=videos,images`;
    const data = await fetchFromTMDB(url, 'Erro ao buscar detalhes');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================
// ROTA PARA ELENCO (CREDITS)
// ==========================
app.get('/api/credits', async (req, res) => {
  const { id, type } = req.query;

  if (!id || !type) {
    return res.status(400).json({ error: 'Parâmetros "id" e "type" são obrigatórios' });
  }

  try {
    const url = `https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${API_KEY}&language=pt-BR`;
    const data = await fetchFromTMDB(url, 'Erro ao buscar créditos');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================
// ROTA PARA RECOMENDAÇÕES
// ==========================
app.get('/api/recommendations', async (req, res) => {
  const { id, type } = req.query;

  if (!id || !type) {
    return res.status(400).json({ error: 'Parâmetros "id" e "type" são obrigatórios' });
  }

  try {
    const url = `https://api.themoviedb.org/3/${type}/${id}/recommendations?api_key=${API_KEY}&language=pt-BR&page=1`;
    const data = await fetchFromTMDB(url, 'Erro ao buscar recomendações');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================
// ROTA PARA QUALQUER OUTRA PÁGINA
// ==========================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

// ==========================
// INICIA O SERVIDOR
// ==========================
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
