const mongoose = require('mongoose');
const Passageiro = require('../models/passageiro');
const { validationResult, matchedData } = require('express-validator');

// 1. CRIAR PASSAGEIRO
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nome, cpf, vooId } = matchedData(req);
    
    const novoPassageiro = await Passageiro.create({
      nome,
      cpf,
      vooId,
      statusCheckIn: 'pendente' // Valor padrão
    });

    res.status(201).json({
      message: 'Passageiro criado com sucesso!',
      passageiro: novoPassageiro
    });

  } catch (error) {
    console.error('Erro ao criar passageiro:', error);
    res.status(500).json({ 
      message: 'Erro ao criar passageiro',
      error: error.message 
    });
  }
};

// 2. BUSCAR TODOS PASSAGEIROS
const getAllUsers = async (req, res) => {
  try {
    const passageiros = await Passageiro.find().populate('vooId');
    res.json({ passageiros });
  } catch (error) {
    console.error('Erro ao buscar passageiros:', error);
    res.status(500).json({ 
      message: 'Erro ao buscar passageiros',
      error: error.message 
    });
  }
};

// 3. BUSCAR PASSAGEIRO POR ID
const getUser = async (req, res) => {
  try {
    const passageiro = await Passageiro.findById(req.params.id).populate('vooId');
    
    if (!passageiro) {
      return res.status(404).json({ message: 'Passageiro não encontrado' });
    }
    
    res.json({ passageiro });
  } catch (error) {
    console.error('Erro ao buscar passageiro:', error);
    res.status(500).json({ 
      message: 'Erro ao buscar passageiro',
      error: error.message 
    });
  }
};

// 4. ATUALIZAR PASSAGEIRO (Corrigida)
const editUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Erros de validação:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params; // Pega o ID dos parâmetros da rota

    // 1. Extrai dados validados SOMENTE do corpo da requisição.
    //    Você precisará listar os campos do seu modelo Passageiro que podem ser atualizados.
    const validatedDataFromRequest = matchedData(req, { locations: ['body'] });
    console.log('Dados recebidos do body para atualização (após matchedData):', JSON.stringify(validatedDataFromRequest, null, 2));

    // 2. Constrói o objeto de atualização apenas com os campos fornecidos e definidos.
    //    Substitua 'nome', 'email', 'dataNascimento', 'telefone', 'outroCampo'
    //    pelos campos reais do seu modelo Passageiro que podem ser atualizados.
    const updates = {};
    if (validatedDataFromRequest.nome !== undefined) updates.nome = validatedDataFromRequest.nome;
    if (validatedDataFromRequest.email !== undefined) updates.email = validatedDataFromRequest.email;
    if (validatedDataFromRequest.dataNascimento !== undefined) updates.dataNascimento = validatedDataFromRequest.dataNascimento;
    if (validatedDataFromRequest.telefone !== undefined) updates.telefone = validatedDataFromRequest.telefone;
    if (validatedDataFromRequest.vooId !== undefined) updates.vooId = validatedDataFromRequest.vooId; // Se vooId pode ser atualizado
    // Adicione outros campos atualizáveis aqui:
    // if (validatedDataFromRequest.outroCampo !== undefined) updates.outroCampo = validatedDataFromRequest.outroCampo;

    console.log('Objeto de atualização construído para o Mongoose:', JSON.stringify(updates, null, 2));

    // 3. Verifica se há algo para atualizar.
    //    Se o objeto 'updates' estiver vazio, significa que nenhum campo válido para atualização foi fornecido.
    if (Object.keys(updates).length === 0) {
      console.log('Nenhum dado válido para atualização foi fornecido após a validação e processamento.');
      // Você pode optar por buscar e retornar o passageiro existente ou enviar uma mensagem específica.
      // Para manter a consistência com uma atualização "bem-sucedida" que não altera nada:
      const passageiroExistente = await Passageiro.findById(id).populate('vooId');
      if (!passageiroExistente) {
        return res.status(404).json({ message: 'Passageiro não encontrado' });
      }
      return res.json({
        message: 'Nenhum campo fornecido para atualização ou os campos fornecidos não alteraram os dados existentes.',
        passageiro: passageiroExistente
      });
    }

    // 4. Atualiza o passageiro no banco de dados
    const passageiroAtualizado = await Passageiro.findByIdAndUpdate(
      id,
      updates, // Usa o objeto 'updates' construído
      { new: true, runValidators: true, context: 'query' }
    ).populate('vooId'); // Popula 'vooId' se necessário

    if (!passageiroAtualizado) {
      console.log('Passageiro não encontrado com o ID:', id);
      return res.status(404).json({ message: 'Passageiro não encontrado' });
    }

    console.log('Passageiro após a tentativa de atualização bem-sucedida:', JSON.stringify(passageiroAtualizado, null, 2));
    res.json({
      message: 'Passageiro atualizado com sucesso!',
      passageiro: passageiroAtualizado
    });

  } catch (error) {
    // Seu log de erro detalhado e tratamento de erros específicos (ValidationError, CastError)
    // são muito bons e foram mantidos.
    console.error('ERRO DETALHADO AO ATUALIZAR PASSAGEIRO:', {
      name: error.name,
      message: error.message,
      value: error.value,
      path: error.path,
      errors: error.errors,
      stack: error.stack
    });

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Erro de validação ao atualizar passageiro',
        errors: error.errors
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Erro de formato nos dados fornecidos (ex: ID inválido)',
        error: {
          field: error.path,
          value: error.value,
          kind: error.kind
        }
      });
    }

    res.status(500).json({
      message: 'Erro interno ao atualizar passageiro',
      error: error.message
    });
  }
};

// 5. DELETAR PASSAGEIRO
const deleteUser = async (req, res) => {
  try {
    const passageiro = await Passageiro.findByIdAndDelete(req.params.id);
    
    if (!passageiro) {
      return res.status(404).json({ message: 'Passageiro não encontrado' });
    }
    
    res.json({ message: 'Passageiro deletado com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar passageiro:', error);
    res.status(500).json({ 
      message: 'Erro ao deletar passageiro',
      error: error.message 
    });
  }
};

//realizar checkin
// https: .../chackin/id:passageiro/
const realizarCheckIn = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // 1. Encontra o passageiro E POPULA os dados do voo
    const passageiro = await Passageiro.findById(req.params.id).populate('vooId');
    
    if (!passageiro) {
      return res.status(404).json({ message: 'Passageiro não encontrado' });
    }

    // 2. Verifica check-in já realizado
    if (passageiro.statusCheckIn === 'realizado') {
      return res.status(400).json({ message: 'Check-in já realizado' });
    }
    
    // 3. Verifica status do voo (agora acessando o objeto populado)
    if (passageiro.vooId.status !== 'embarque') {
      return res.status(400).json({ 
        message: 'Check-in só permitido quando o voo está em embarque. Status atual: ' + passageiro.vooId.status
      });
    }
    
    // 4. Atualiza usando findByIdAndUpdate para evitar race conditions
    const passageiroAtualizado = await Passageiro.findByIdAndUpdate(
      req.params.id,
      { statusCheckIn: 'realizado' },
      { new: true, runValidators: true }
    ).populate('vooId');

    res.json({ 
      message: 'Check-in realizado com sucesso!',
      passageiro: passageiroAtualizado 
    });

  } catch (error) {
    console.error('Erro ao fazer check-in:', error);
    res.status(500).json({ 
      message: 'Erro ao fazer check-in',
      error: error.message 
    });
  }
};
module.exports = {
  createUser,
  getAllUsers,
  getUser,
  editUser,
  deleteUser,
  realizarCheckIn
};