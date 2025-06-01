const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const funcionarioSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'O campo nome é obrigatório.'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'O campo email é obrigatório.'],
        unique: true,
        lowercase: true,
        trim: true,
        // A validação do formato do email será feita no controller/rota
    },
    senha: {
        type: String,
        required: [true, 'O campo senha é obrigatório.'],
        minlength: [6, 'A senha deve ter no mínimo 6 caracteres.'],
        select: false // Para não retornar a senha em queries por padrão
    },
    cargo: {
        type: String,
        enum: ['admin', 'funcionario'], // Defina os cargos possíveis
        default: 'funcionario',
        required: [true, 'O campo cargo é obrigatório.']
    }
}, { timestamps: true });

// Middleware para criptografar a senha ANTES de salvar
funcionarioSchema.pre('save', async function(next) {
    if (!this.isModified('senha')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
});

// Método para comparar a senha fornecida com a senha armazenada (hash)
funcionarioSchema.methods.comparePassword = async function(senhaFornecida) {
    return await bcrypt.compare(senhaFornecida, this.senha);
};

const modelName = 'Funcionario';
if (mongoose.connection && mongoose.connection.models[modelName]) {
    module.exports = mongoose.connection.models[modelName];
} else {
    module.exports = mongoose.model(modelName, funcionarioSchema);
}