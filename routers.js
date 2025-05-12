const express = require('express');
const router = express.Router();
// const userController = require('./controller/userController');
// const categoryController = require('./controller/categoryController');
// const adsController = require('./controller/adsController');
// const UserValidator = require('./validator/uservalidator');
const passageiroController = require('./controller/passageiroController');
const vooController = require('./controller/vooController');
const portaoController = require('./controller/portaoController');

router.get('/ping', (req, res) => {
    res.json({retorno: true});
});

// rotas de passageiro
router.post('/', [
    check('nome').notEmpty().withMessage('Nome é obrigatório'),
    check('cpf').isLength({ min: 11, max: 11 }).withMessage('CPF inválido'),
    check('vooId').isMongoId().withMessage('ID do voo inválido')
  ], passageiroController.createUser);
  
router.get('/', passageiroController.getAllUsers);
router.get('/:id', passageiroController.getUser);
router.put('/:id', passageiroController.editUser);
router.delete('/:id', passageiroController.deleteUser);

// rotas de voo
router.post('/', [
    check('numeroVoo').notEmpty().withMessage('Número do voo é obrigatório'),
    check('origem').notEmpty().withMessage('Origem é obrigatória'),
    check('destino').notEmpty().withMessage('Destino é obrigatório'),
    check('dataHoraPartida').isISO8601().withMessage('Data inválida'),
    check('portaoId').isMongoId().withMessage('ID do portão inválido')
  ], vooController.createVoo);
  
router.put('/:id/status', [
    check('novoStatus').isIn(['programado', 'embarque', 'concluido'])
  ], vooController.updateStatus);

router.put('/passageiros/:passageiroId/checkin', [
    check('vooId').isMongoId()
  ], vooController.updateCheckin);

router.get('/', vooController.getAllVoos);
router.get('/:id', vooController.getVoo);

// rotas de portao
router.post('/', [
    check('codigo').notEmpty().withMessage('Código é obrigatório'),
    check('terminal').notEmpty().withMessage('Terminal é obrigatório')
  ], portaoController.createPortao);
  
  router.get('/', portaoController.getAllPortoes);
  router.get('/:id', portaoController.getPortao);
  router.put('/:id', [
    check('codigo').optional().notEmpty(),
    check('terminal').optional().notEmpty(),
    check('disponivel').optional().isBoolean()
  ], portaoController.updatePortao);
  router.delete('/:id', portaoController.deletePortao);


module.exports = router;
