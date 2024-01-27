const express = require('express');
const http = require('http');

const app = express();

// ... (seu código de roteamento aqui)

const server = http.createServer(app).listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
