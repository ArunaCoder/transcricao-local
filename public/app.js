const audioInput = document.getElementById("audioInput");
const dropZone = document.getElementById("dropZone");
const transcreverBtn = document.getElementById("transcreverBtn");
const statusContainer = document.getElementById("statusContainer");
const statusText = document.getElementById("statusText");
const textoResultado = document.getElementById("textoResultado");
const loader = document.getElementById("loader");
const statusSpinner = document.getElementById("statusSpinner");
const successIcon = document.getElementById("successIcon");

// --- Lógica de Drag and Drop ---
dropZone.addEventListener("click", () => audioInput.click());

audioInput.addEventListener("change", () => {
  if (audioInput.files.length) {
    updateThumbnail(audioInput.files[0]);
  }
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drop-zone--over");
});

["dragleave", "dragend"].forEach((type) => {
  dropZone.addEventListener(type, () => {
    dropZone.classList.remove("drop-zone--over");
  });
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  if (e.dataTransfer.files.length) {
    audioInput.files = e.dataTransfer.files;
    updateThumbnail(e.dataTransfer.files[0]);
  }
  dropZone.classList.remove("drop-zone--over");
});

function updateThumbnail(file) {
  let prompt = dropZone.querySelector(".drop-zone__prompt");
  prompt.textContent = `Ficheiro selecionado: ${file.name}`;
}

// --- Lógica de Transcrição ---
transcreverBtn.addEventListener("click", async () => {
  if (!audioInput.files.length) {
    alert("Por favor, selecione ou arraste um arquivo de áudio.");
    return;
  }

  const file = audioInput.files[0];
  const formData = new FormData();
  formData.append("audio", file);

  // --- RESET DE UI (Importante para não mostrar o check antes da hora) ---
  transcreverBtn.disabled = true;

  // Mostra o container e o spinner, mas ESCONDE o ícone de sucesso
  statusContainer.classList.remove("hidden");
  statusContainer.classList.remove("status-success", "status-error");

  statusSpinner.classList.remove("hidden"); // Mostra o spinner
  successIcon.classList.add("hidden"); // GARANTE que o check está escondido

  statusText.textContent = "Iniciando upload para o servidor...";
  loader.classList.remove("hidden");
  textoResultado.innerHTML = "";

  try {
    const statusUpdates = setTimeout(() => {
      if (transcreverBtn.disabled) {
        statusText.textContent =
          "AssemblyAI processando áudio (isso pode levar alguns minutos)...";
      }
    }, 4000);

    const response = await fetch("/transcrever", {
      method: "POST",
      body: formData,
    });

    clearTimeout(statusUpdates);
    const data = await response.json();

    if (response.ok) {
      // --- FINALIZAÇÃO COM SUCESSO ---
      statusText.textContent = "Transcrição concluída com sucesso!";
      statusContainer.classList.add("status-success");

      // Inverte: Esconde o spinner e mostra o check
      statusSpinner.classList.add("hidden");
      successIcon.classList.remove("hidden");

      textoResultado.innerHTML = data.paragraphs
        .map((p) => `<p>${p.text}</p>`)
        .join("");
    } else {
      throw new Error(data.error || "Erro desconhecido no processamento.");
    }
  } catch (err) {
    // --- FINALIZAÇÃO COM ERRO ---
    statusText.textContent = "Erro: " + err.message;
    statusContainer.classList.add("status-error");
    statusSpinner.classList.add("hidden"); // Para o spinner se der erro
    successIcon.classList.add("hidden"); // Garante que o check não aparece no erro
    textoResultado.innerHTML = `<p style="color:red; text-align:center;">Erro: ${err.message}</p>`;
  } finally {
    loader.classList.add("hidden");
    transcreverBtn.disabled = false;
  }
});
