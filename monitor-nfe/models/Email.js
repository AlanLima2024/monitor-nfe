const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Email = sequelize.define('Email', {
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },        
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = Email;