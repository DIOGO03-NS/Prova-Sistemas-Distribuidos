const { default: mongoose } = require("mongoose");

const modelSchema = new mongoose.modelSchema({
    nome: {
        type: String, 
        required: true
    },
    cpf: {
        type: String, 
        required: true,
        unique: true
    },
    vooId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Voo'
    },
    statusCheckIn: {
        type: String, 
        enum: ['pendente', 'realizado'], 
        default: 'pendente',
        required: true
    }
});


const modelName = 'Passageiro';

if(mongoose.connection && mongoose.connection.models[modelName]){
    module.exports = mongoose.connection.models[modelName];
}else{
    module.exports = mongoose.model(modelName, modelSchema);
}