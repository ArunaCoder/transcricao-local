require("dotenv").config();
const { mergeShortParagraphs } = require("./utils/mergeParagraphs");
const applyDictionaryCorrections = require("./utils/applyDictionaryCorrections");
function loadDictionary() {
  const raw = fs.readFileSync("./dictionary.json", "utf-8");
  return JSON.parse(raw);
}

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

    const paragraphs = paragraphsResponse.data.paragraphs;

    const mergedParagraphs = mergeShortParagraphs(paragraphs, {
      minLength: 400,
    });

    const adjustedParagraphs = applyDictionaryCorrections(
      mergedParagraphs,
      loadDictionary()
    );

    // 5. Limpar arquivo local
    fs.unlinkSync(filePath);

    // 6. Retornar parágrafos ajustados
    res.json({ paragraphs: adjustedParagraphs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/dictionary", (req, res) => {
  try {
    const raw = fs.readFileSync("./dictionary.json", "utf-8");
    const dictionary = JSON.parse(raw);
    res.json(dictionary);
  } catch (err) {
    console.error("Erro ao carregar dicionário:", err);
    res.status(500).json({ error: "Erro ao carregar dicionário" });
  }
});

app.post("/dictionary", (req, res) => {
  try {
    const { from, to, capitalizationMode, wholeWord = true } = req.body;

    if (!from || !to || !capitalizationMode) {
      return res
        .status(400)
        .json({ error: "Campos obrigatórios: from, to, capitalizationMode" });
    }

    const raw = fs.readFileSync("./dictionary.json", "utf-8");
    const dictionary = JSON.parse(raw);

    const newRule = {
      id: Date.now().toString(),
      from,
      to,
      capitalizationMode,
      wholeWord,
    };

    dictionary.push(newRule);

    fs.writeFileSync("./dictionary.json", JSON.stringify(dictionary, null, 2));

    res.status(201).json(newRule);
  } catch (err) {
    console.error("Erro ao adicionar regra:", err);
    res.status(500).json({ error: "Erro ao adicionar regra." });
  }
});

app.delete("/dictionary/:id", (req, res) => {
  try {
    const { id } = req.params;

    const raw = fs.readFileSync("./dictionary.json", "utf-8");
    const dictionary = JSON.parse(raw);

    const updated = dictionary.filter((rule) => rule.id !== id);

    if (updated.length === dictionary.length) {
      return res.status(404).json({ error: "Regra não encontrada." });
    }

    fs.writeFileSync("./dictionary.json", JSON.stringify(updated, null, 2));

    res.json({ message: "Regra removida com sucesso." });
  } catch (err) {
    console.error("Erro ao remover regra:", err);
    res.status(500).json({ error: "Erro ao remover regra." });
  }
});

app.put("/dictionary/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { from, to, capitalizationMode, wholeWord = true } = req.body;

    if (!from || !to || !capitalizationMode) {
      return res.status(400).json({
        error: "Campos obrigatórios: from, to, capitalizationMode",
      });
    }

    const raw = fs.readFileSync("./dictionary.json", "utf-8");
    const dictionary = JSON.parse(raw);

    const index = dictionary.findIndex((rule) => rule.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Regra não encontrada." });
    }

    dictionary[index] = {
      id,
      from,
      to,
      capitalizationMode,
      wholeWord,
    };

    fs.writeFileSync("./dictionary.json", JSON.stringify(dictionary, null, 2));

    res.json(dictionary[index]);
  } catch (err) {
    console.error("Erro ao editar regra:", err);
    res.status(500).json({ error: "Erro ao editar regra." });
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
