const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Nfe = sequelize.define('Nfe', {
  chave: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    unique: 'unique_chave_user' // 🔥 chave composta
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'PENDENTE'
  },
  mensagem: {
    type: DataTypes.STRING
  },
  liberada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ultima_consulta: {
    type: DataTypes.DATE
  },
  userId: {
  type: DataTypes.INTEGER,
  allowNull: false,
  unique: 'unique_chave_user'
}
});

module.exports = Nfe;