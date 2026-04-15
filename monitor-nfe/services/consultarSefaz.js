const axios = require('axios');

async function consultarSefaz(chave) {
  console.log("🔎 Consultando chave:", chave);

  try {
    const response = await axios.post(
      process.env.SEFAZ_URL,
      {
        Chave: chave,
        CnpjCpfDestinatario: "",
        CnpjEmitente: "",
        NumeroNfe: "",
        TipoIdentificacao: "C"
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Origin": "https://uvt.sefaz.rn.gov.br",
          "Referer": "https://uvt.sefaz.rn.gov.br/",
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    const dados = response.data?.result?.[0];

    if (!dados) {
      throw new Error("Sem dados da SEFAZ");
    }

    const mensagem = dados.mensagem || "SEM RETORNO";

    const liberada =
      mensagem.toLowerCase().includes("liberar mercadoria") &&
      !mensagem.toLowerCase().includes("não");

    return {
      status: mensagem,
      mensagem,
      liberada
    };

  } catch (error) {
    console.error("❌ Erro SEFAZ:", error.response?.data || error.message);

    return {
      status: "ERRO",
      mensagem: error.message,
      liberada: false
    };
  }
}

module.exports = consultarSefaz;