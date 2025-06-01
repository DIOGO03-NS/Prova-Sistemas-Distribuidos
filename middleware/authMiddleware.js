const jwt = require('jsonwebtoken');
const Funcionario = require('../models/funcionario'); // Opcional: para verificar se o usuário ainda existe

// Middleware para proteger rotas (verifica se o token é válido)
exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seuSegredoSuperSecretoTemporario');

            // Opcional: Checar se o usuário do token ainda existe no banco
            const funcionarioAtual = await Funcionario.findById(decoded.id).select('-senha');
            if (!funcionarioAtual) {
                return res.status(401).json({ message: 'Usuário associado a este token não existe mais.' });
            }
            req.user = funcionarioAtual; // Adiciona o objeto do usuário (com id, nome, cargo) ao request
            next();

        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expirado. Por favor, faça login novamente.' });
            }
            if (error.name === 'JsonWebTokenError') {
                 return res.status(401).json({ message: 'Token inválido.' });
            }
            console.error('Erro na autenticação do token:', error);
            return res.status(401).json({ message: 'Não autorizado. Falha na autenticação do token.' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Não autorizado. Nenhum token fornecido.' });
    }
};

// Middleware para autorizar baseado no cargo
// Ex: authorize('admin') ou authorize('admin', 'gerente')
exports.authorize = (...cargosPermitidos) => {
    return (req, res, next) => {
        if (!req.user || !req.user.cargo) {
            return res.status(403).json({ message: 'Acesso negado. Usuário sem cargo definido.' });
        }
        if (!cargosPermitidos.includes(req.user.cargo)) {
            return res.status(403).json({
                message: `Acesso negado. Seu cargo (${req.user.cargo}) não tem permissão para acessar este recurso.`
            });
        }
        next();
    };
};