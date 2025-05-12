const { default: mongoose } = require("mongoose");

const vooSchema = new mongoose.Schema({
    numeroVoo: {
        type: String,
        required: true,
        unique: true  
    },
    origem: {
        type: String,
        required: true
    },
    destino: {
        type: String,
        required: true
    },
    dataHoraPartida: {
        type: Date,
        required: true
    },
    portaoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Portao',
        required: true
    },
    status: {
        type: String,
        enum: ['programado', 'embarque', 'concluido'],
        default: 'programado',
        required: true
    }
});

const modelName = 'Voo';

if (mongoose.connection && mongoose.connection.models[modelName]) {
  module.exports = mongoose.connection.models[modelName];
} else {
  module.exports = mongoose.model(modelName, vooSchema);
}