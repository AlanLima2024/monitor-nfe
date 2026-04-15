const cron = require('node-cron');
const Nfe = require('./models/Nfe');
const consultarSefaz = require('./services/consultarSefaz');
const enviarEmail = require('./services/email');

// Executa a cada 5 minutos
cron.schedule('*/5 * * * *', async () => {
  console.log('🔄 Monitorando NFEs...');

  try {
    const notas = await Nfe.findAll({
      where: { liberada: false }
    });

    if (notas.length === 0) {
      console.log('📭 Nenhuma NFe pendente.');
      return;
    }

    for (const nota of notas) {
      console.log('➡️ Processando:', nota.chave);

      try {
        const resultado = await consultarSefaz(nota.chave);

        console.log('📦 Resultado:', resultado);

        // 🚨 DISPARA EMAIL SOMENTE QUANDO MUDA PARA LIBERADA
        if (resultado.liberada && !nota.liberada) {
          console.log(`✅ LIBERADA: ${nota.chave}`);

          await enviarEmail(nota.chave, nota.userId); // 🔥 ESSA LINHA
        }

        // 🔄 Atualiza dados no banco
        await nota.update({
          status: resultado.status,
          mensagem: resultado.mensagem,
          liberada: resultado.liberada,
          ultima_consulta: new Date()
        });

      } catch (erroNota) {
        console.log(`❌ Erro na nota ${nota.chave}:`, erroNota.message);
      }
    }

  } catch (erro) {
    console.log('❌ Erro geral no monitor:', erro.message);
  }
});