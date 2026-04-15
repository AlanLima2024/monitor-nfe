const nodemailer = require('nodemailer');
const Email = require('../models/Email');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function enviarEmail(chave, userId) {

  console.log('🔥 USER RECEBIDO:', userId);

  const lista = await Email.findAll({
    where: { userId }
  });

  console.log('🔥 EMAILS DO BANCO:', lista.map(e => ({
    email: e.email,
    userId: e.userId
  })));

  const destinos = lista.map(e => e.email);

  console.log('📧 Destinos:', destinos);

  if (destinos.length === 0) {
    console.log('⚠️ Nenhum email cadastrado');
    return;
  }

  await transporter.sendMail({
    from: 'Monitor NF-e',
    to: destinos.join(','),
    subject: 'NF-e LIBERADA ✅',
    text: `A NF-e ${chave} foi liberada para mercadoria!`
  });

  console.log('📧 Email enviado para:', destinos);
}

module.exports = enviarEmail;