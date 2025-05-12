const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const fileupload = require('express-fileupload');
require('dotenv').config({path:'variables.env'});

const apiRouters = require('../routers');

require('dotenv').config({path: 'variables.env'});



mongoose.connect(process.env.DATABASE || 'mongodb://127.0.0.1:27017/Prova', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000 // Timeout de 5 segundos
  })
  .then(() => {
    console.log('Conectado ao MongoDB com sucesso!');
  })
  .catch(err => {
    console.error('Erro na conexão com MongoDB:', err.message);
  });
  
  mongoose.Promise = global.Promise;
  
  mongoose.connection.on('error', (error) => {
    console.error("ERRO na conexão com o MongoDB: " + error.message);
  });
  
  mongoose.connection.on('disconnected', () => {
    console.log('Desconectado do MongoDB!');
  });
  
//DATABASE=mongodb://127.0.0.1:27017/SD7

const server = express();
server.use(cors());
server.use(express.json());
server.use(express.urlencoded({extended:true}));
server.use(fileupload());
server.use('/', apiRouters);


const servico = server.listen(process.env.PORT, () => {
    console.log("Servidor rodando na porta " + servico.address().port);
});