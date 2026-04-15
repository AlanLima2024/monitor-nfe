require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');

const sequelize = require('./config/database');
const Nfe = require('./models/Nfe');
const User = require('./models/User');
const Email = require('./models/Email');

sequelize.sync().then(() => {
  console.log('🟢 Banco sincronizado');
});

require('./monitor');

const app = express();

// 🔧 CONFIGURAÇÕES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

// 🔐 SESSÃO
app.use(session({
  secret: 'segredo_super',
  resave: false,
  saveUninitialized: false
}));

// 🔐 MIDDLEWARE DE AUTENTICAÇÃO
function auth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

// =========================
// 🔑 ROTAS DE LOGIN
// =========================

app.get('/', auth, async (req, res) => {
  const nfe = await Nfe.findAll({
    where: { userId: req.session.userId }
  });

  const emails = await Email.findAll({
    where: { userId: req.session.userId }
  });

  res.render('dashboard', { nfe, emails });
});
// TELA LOGIN
app.get('/login', (req, res) => {
  res.render('login');
});

// CADASTRO
app.post('/register', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.render('login', { erro: 'Preencha todos os campos' });
    }

    const existe = await User.findOne({ where: { email } });

    if (existe) {
      return res.render('login', { erro: 'Email já cadastrado' });
    }

    const hash = await bcrypt.hash(senha, 10);

    await User.create({
      email,
      senha: hash
    });

    return res.render('login', { sucesso: 'Cadastro realizado com sucesso!' });

  } catch (err) {
    console.log(err);
    res.render('login', { erro: 'Erro ao cadastrar' });
  }
});

// LOGIN
app.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) return res.send('Usuário não encontrado');

    const valido = await bcrypt.compare(senha, user.senha);

    if (!valido) return res.send('Senha inválida');

    req.session.userId = user.id;

    res.redirect('/dashboard');

  } catch (err) {
    res.send('Erro no login');
  }
});

// LOGOUT
app.get('/login', (req, res) => {
  res.render('login', { erro: null, sucesso: null });
});

app.post('/emails', auth, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send('Digite um email');
    }

    const lista = email.split(',');

    // 🔥 REGEX DE EMAIL
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (let e of lista) {
      const emailLimpo = e.trim();

      if (!regexEmail.test(emailLimpo)) {
        return res.status(400).send(`Email inválido: ${emailLimpo}`);
      }

      await Email.create({
        email: emailLimpo,
        userId: req.session.userId
      });
    }

    res.sendStatus(200);

  } catch (err) {
    console.log(err);
    res.status(500).send('Erro ao cadastrar email');
  }
});

// =========================
// 📦 ROTAS PROTEGIDAS
// =========================

// DASHBOARD
app.get('/dashboard', auth, async (req, res) => {

  const nfe = await Nfe.findAll({
    where: { userId: req.session.userId },
    order: [['updatedAt', 'DESC']]
  });

  // ✅ CRIA PRIMEIRO
  const stats = {
    liberadas: nfe.filter(n => n.liberada).length,
    bloqueadas: nfe.filter(n => !n.liberada && n.status !== 'PENDENTE').length,
    pendentes: nfe.filter(n => n.status === 'PENDENTE').length
  };
  const emails = await Email.findAll({
        where: { userId: req.session.userId }
    });

  // ✅ USA DEPOIS
  res.render('dashboard', { nfe, stats, emails });
});

// CADASTRAR NFE
app.post('/nfe', auth, async (req, res) => {
  const { chave } = req.body;

  // 🔒 Validação da chave
  if (!chave || !/^\d{44}$/.test(chave)) {
    return res.status(400).send('A chave da NF-e deve conter exatamente 44 dígitos');
  }

  try {
    // 🔥 VERIFICA SE JÁ EXISTE
    const existe = await Nfe.findOne({
      where: {
        chave,
        userId: req.session.userId
      }
    });

    if (existe) {
      return res.status(400).send('Essa NF-e já foi cadastrada!');
    }

    // ✅ Cria se não existir
    const nfe = await Nfe.create({
      chave,
      userId: req.session.userId
    });

    res.json(nfe);

  } catch (err) {
    console.log(err);
    res.status(500).send('Erro ao cadastrar NFe');
  }
});

// LISTAR NFE
app.get('/nfe', auth, async (req, res) => {
  const lista = await Nfe.findAll({
    where: { userId: req.session.userId }
  });

  res.json(lista);
});
app.delete('/emails/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const email = await Email.findOne({
      where: {
        id,
        userId: req.session.userId // 🔒 segurança
      }
    });

    if (!email) {
      return res.status(404).send('Email não encontrado');
    }

    await email.destroy();

    res.sendStatus(200);

  } catch (err) {
    console.log(err);
    res.status(500).send('Erro ao remover email');
  }
});
sequelize.authenticate()
  .then(() => console.log('🟢 Conectado ao MySQL'))
  .catch(err => console.error('🔴 Erro no banco:', err));

// =========================
// 🚀 START
// =========================
const PORT = process.env.PORT || 3000;

sequelize.sync().then(() => {
  app.listen(3000, () => {
    console.log('🚀 Servidor rodando na porta 3000');
  });
});