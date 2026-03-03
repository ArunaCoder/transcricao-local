require("dotenv").config();
console.log("ARQUIVO SERVER ATIVO:", __filename);

const express = require("express");
const axios = require("axios");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

const ASSEMBLYAI_BASE_URL = "https://api.assemblyai.com/v2";
const headers = {
  authorization: process.env.ASSEMBLYAI_API_KEY,
};

app.post("/transcrever", upload.single("audio"), async (req, res) => {
  try {
    const filePath = req.file.path;

    // 1. Upload do áudio para AssemblyAI
    const uploadResponse = await axios({
      method: "post",
      url: `${ASSEMBLYAI_BASE_URL}/upload`,
      headers: {
        ...headers,
        "transfer-encoding": "chunked",
      },
      data: fs.createReadStream(filePath),
    });

    const audioUrl = uploadResponse.data.upload_url;

    const payload = {
      audio_url: audioUrl,
      language_detection: true,
      speech_models: ["universal-3-pro"],
      temperature: 0,
    };

    console.log("PAYLOAD ENVIADO:", payload);

    // 2. Criar transcrição
    const transcriptResponse = await axios.post(
      `${ASSEMBLYAI_BASE_URL}/transcript`,
      payload,
      { headers }
    );

    const transcriptId = transcriptResponse.data.id;

    // 3. Polling
    let completed = false;

    while (!completed) {
      await new Promise((r) => setTimeout(r, 3000));

      const polling = await axios.get(
        `${ASSEMBLYAI_BASE_URL}/transcript/${transcriptId}`,
        { headers }
      );

      if (polling.data.status === "completed") {
        completed = true;
      } else if (polling.data.status === "error") {
        throw new Error(polling.data.error);
      }
    }

    // 4. Buscar parágrafos oficiais
    const paragraphsResponse = await axios.get(
      `${ASSEMBLYAI_BASE_URL}/transcript/${transcriptId}/paragraphs`,
      { headers }
    );

    // 5. Limpar arquivo local
    fs.unlinkSync(filePath);

    // 6. Retornar parágrafos
    res.json(paragraphsResponse.data);

    // 4. Limpar arquivo local
    fs.unlinkSync(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
