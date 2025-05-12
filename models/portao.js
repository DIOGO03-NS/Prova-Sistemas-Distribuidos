const { default: mongoose } = require("mongoose");

const portaoSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true,  // Garante que cada código de portão seja único
    uppercase: true,  // Armazena em maiúsculas automaticamente
    trim: true  // Remove espaços extras
  },
  disponivel: {
    type: Boolean,
    default: true,  
    required: true
  }
});

const modelName = 'Portao';

// Verifica se o modelo já existe para evitar redefinição
if (mongoose.connection && mongoose.connection.models[modelName]) {
  module.exports = mongoose.connection.models[modelName];
} else {
  module.exports = mongoose.model(modelName, portaoSchema);
}