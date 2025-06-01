const Funcionario = require('../models/funcionario');
const jwt = require('jsonwebtoken');
const { validationResult, matchedData } = require('express-validator');

// Função para gerar o token JWT
const gerarToken = (id, nome, cargo) => {
    return jwt.sign(
        { id, nome, cargo },
        process.env.JWT_SECRET || 'seuSegredoSuperSecretoTemporario', // Use uma variável de ambiente para o segredo!
        { expiresIn: '2m' } // Token expira em 2 minutos
    );
};

// Rota de Cadastro (Signup)
exports.signup = async (req, res) => {
    console.log('Conteúdo de req.body:', req.body); // <--- ADICIONE ESTA LINHA PARA DEBUG

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Erros de validação encontrados:', errors.array()); // Para ver os erros no console do servidor
        return res.status(400).json({ errors: errors.array() });
    }

    const { nome, email, senha, cargo } = matchedData(req);

    try {
        const funcionarioExistente = await Funcionario.findOne({ email });
        if (funcionarioExistente) {
            return res.status(400).json({ message: 'Este email já está cadastrado.' });
        }

        const novoFuncionario = await Funcionario.create({
            nome,
            email,
            senha,
            cargo: cargo || 'funcionario' // Define 'funcionario' como padrão se não especificado
        });

        const token = gerarToken(novoFuncionario._id, novoFuncionario.nome, novoFuncionario.cargo);

        res.status(201).json({
            message: 'Funcionário cadastrado com sucesso!',
            token,
            data: {
                id: novoFuncionario._id,
                nome: novoFuncionario.nome,
                email: novoFuncionario.email,
                cargo: novoFuncionario.cargo
            }
        });

    } catch (error) {
        console.error('Erro ao cadastrar funcionário:', error);
        res.status(500).json({ message: 'Erro interno no servidor ao tentar cadastrar.', error: error.message });
    }
};

// Rota de Login
exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, senha } = matchedData(req);

    try {
        const funcionario = await Funcionario.findOne({ email }).select('+senha'); // Inclui a senha para comparação

        if (!funcionario) {
            return res.status(401).json({ message: 'Credenciais inválidas (email não encontrado).' });
        }

        const senhaCorreta = await funcionario.comparePassword(senha);

        if (!senhaCorreta) {
            return res.status(401).json({ message: 'Credenciais inválidas (senha incorreta).' });
        }

        const token = gerarToken(funcionario._id, funcionario.nome, funcionario.cargo);

        res.status(200).json({
            message: 'Login bem-sucedido!',
            token,
            data: { // Opcional: retornar dados do usuário logado
                id: funcionario._id,
                nome: funcionario.nome,
                email: funcionario.email,
                cargo: funcionario.cargo
            }
        });

    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ message: 'Erro interno no servidor ao tentar fazer login.', error: error.message });
    }
};