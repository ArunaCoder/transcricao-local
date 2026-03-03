const audioInput = document.getElementById("audioInput");
const transcreverBtn = document.getElementById("transcreverBtn");
const status = document.getElementById("status");
const resultado = document.getElementById("resultado");

transcreverBtn.addEventListener("click", async () => {
  if (!audioInput.files.length) {
    alert("Selecione um arquivo de áudio.");
    return;
  }

  const file = audioInput.files[0];
  const formData = new FormData();
  formData.append("audio", file);

  status.textContent = "Enviando áudio...";
  resultado.textContent = "";

  try {
    const response = await fetch("/transcrever", {
      method: "POST",
      body: formData,
    });

    status.textContent = "Processando transcrição...";

    const data = await response.json();

    if (response.ok) {
      status.textContent = "Transcrição concluída.";
      resultado.innerHTML = data.paragraphs
        .map((p) => `<p>${p.text}</p>`)
        .join("");
    } else {
      status.textContent = "Erro.";
      resultado.textContent = data.error;
    }
  } catch (err) {
    status.textContent = "Erro inesperado.";
    resultado.textContent = err.message;
  }
});
