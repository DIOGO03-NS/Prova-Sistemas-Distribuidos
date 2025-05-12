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

// 4. ATUALIZAR PASSAGEIRO
const editUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const dadosAtualizados = matchedData(req);
    const passageiroAtualizado = await Passageiro.findByIdAndUpdate(
      req.params.id,
      dadosAtualizados,
      { new: true, runValidators: true }
    ).populate('vooId');

    if (!passageiroAtualizado) {
      return res.status(404).json({ message: 'Passageiro não encontrado' });
    }

    res.json({
      message: 'Passageiro atualizado com sucesso!',
      passageiro: passageiroAtualizado
    });

  } catch (error) {
    console.error('Erro ao atualizar passageiro:', error);
    res.status(500).json({ 
      message: 'Erro ao atualizar passageiro',
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

module.exports = {
  createUser,
  getAllUsers,
  getUser,
  editUser,
  deleteUser
};