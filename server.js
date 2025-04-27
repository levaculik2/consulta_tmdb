require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.TMDB_API_KEY;

// Middlewares
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================
// ROTA PARA BUSCAR TRENDING
// ==========================
app.get('/api/trending', async (req, res) => {
  const { type } = req.query; // 'movie' ou 'tv'
  if (!type) {
    return res.status(400).json({ error: 'Parâmetro "type" é obrigatório (movie ou tv)' });
  }
  
  try {
    const url = `https://api.themoviedb.org/3/trending/${type}/week?api_key=${API_KEY}&language=pt-BR`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar trending:', error.message);
    res.status(500).json({ error: 'Erro ao buscar trending' });
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

  try {
    const url = `https://api.themoviedb.org/3/search/${type}?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Erro na busca TMDB:', error.message);
    res.status(500).json({ error: 'Erro ao buscar no TMDB' });
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

  try {
    const url = `https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=pt-BR`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar detalhes:', error.message);
    res.status(500).json({ error: 'Erro ao buscar detalhes' });
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
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar créditos:', error.message);
    res.status(500).json({ error: 'Erro ao buscar créditos' });
  }
});

// ==========================
// ROTA PARA QUALQUER OUTRA PÁGINA
// ==========================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================
// INICIA O SERVIDOR
// ==========================
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

