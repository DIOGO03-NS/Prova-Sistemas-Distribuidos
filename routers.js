const express = require('express');
const router = express.Router();
const { check } = require('express-validator'); // Adicione esta linha
const passageiroController = require('./controller/passageiroController');
const vooController = require('./controller/vooController');
const portaoController = require('./controller/portaoController');
const relatoriosController = require('./controller/relatoriosController');

router.get('/ping', (req, res) => {
    res.json({retorno: true});
});

// Rotas de passageiro
router.post('/passageiros', [ // Adicionei um prefixo para evitar conflitos
    check('nome').notEmpty().withMessage('Nome é obrigatório'),
    check('cpf').isLength({ min: 11, max: 11 }).withMessage('CPF inválido'),
    check('vooId').isMongoId().withMessage('ID do voo inválido')
], passageiroController.createUser);
  
router.get('/passageiros', passageiroController.getAllUsers);
router.get('/passageiros/:id', passageiroController.getUser);
router.put('/passageiros/:id', passageiroController.editUser);
router.delete('/passageiros/:id', passageiroController.deleteUser);
router.patch('/passageiros/:id/checkin', passageiroController.realizarCheckIn);

// Rotas de voo
router.post('/voos', [ // Prefixo adicionado
    check('numeroVoo').notEmpty().withMessage('Número do voo é obrigatório'),
    check('origem').notEmpty().withMessage('Origem é obrigatória'),
    check('destino').notEmpty().withMessage('Destino é obrigatório'),
    check('dataHoraPartida').isISO8601().withMessage('Data inválida'),
    check('portaoId').isMongoId().withMessage('ID do portão inválido')
], vooController.createVoo);
  
router.put('/voos/:id/status', [
    check('novoStatus').isIn(['programado', 'embarque', 'concluido'])
], vooController.updateStatus);

router.put('/voos/passageiros/:passageiroId/checkin', [
    check('vooId').isMongoId()
], vooController.updateCheckin);

router.get('/voos', vooController.getAllVoos);
router.get('/voos/:id', vooController.getVoo);
router.delete('/voos/:id', vooController.deleteVoo);

// Rotas de portao
router.post('/portoes', [ // Prefixo adicionado
    check('codigo').notEmpty().withMessage('Código é obrigatório'),
    check('terminal').notEmpty().withMessage('Terminal é obrigatório')
], portaoController.createPortao);
  
router.get('/portoes', portaoController.getAllPortoes);
router.get('/portoes/:id', portaoController.getPortao);
router.put('/portoes/:id', [
    check('codigo').optional().notEmpty(),
    check('terminal').optional().notEmpty(),
    check('disponivel').optional().isBoolean()
], portaoController.updatePortao);
router.delete('/portoes/:id', portaoController.deletePortao);

// routes.js
router.get('/hoje', relatoriosController.listarVoosHoje);
router.get('/voos/:idVoo/passageiros', relatoriosController.listarPassageirosPorVoo);
router.get('/relatorio/diario', relatoriosController.relatorioDiario);
router.get('/relatorio/portoes', relatoriosController.listarPortoesAtribuidos);

module.exports = router;