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

  // Desabilita botão
  transcreverBtn.disabled = true;

  // Limpa status
  status.textContent = "";

  // Mostra loader dentro da caixa
  resultado.innerHTML = `
    <div id="loader" class="loader"></div>
    <div id="textoResultado"></div>
  `;

  try {
    const response = await fetch("/transcrever", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      document.getElementById("loader").remove();

      document.getElementById("textoResultado").innerHTML = data.paragraphs
        .map((p) => `<p>${p.text}</p>`)
        .join("");
    } else {
      resultado.textContent = data.error || "Erro.";
    }
  } catch (err) {
    resultado.textContent = "Erro inesperado: " + err.message;
  } finally {
    transcreverBtn.disabled = false;
  }
});
