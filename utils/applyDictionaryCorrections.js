// utils/applyDictionaryCorrections.js

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyReplacement(match, rule) {
  // Modo fixo: sempre retorna exatamente o "to"
  if (rule.capitalizationMode === "fixed") {
    return rule.to;
  }

  // Modo normalize: respeita padrão do texto original
  if (rule.capitalizationMode === "normalize") {
    // Tudo maiúsculo
    if (match === match.toUpperCase()) {
      return rule.to.toUpperCase();
    }

    // Primeira letra maiúscula
    if (match[0] === match[0].toUpperCase()) {
      return rule.to.charAt(0).toUpperCase() + rule.to.slice(1);
    }

    // Tudo minúsculo
    return rule.to;
  }

  // fallback de segurança
  return rule.to;
}

/**
 * Aplica regras de substituição "de → para"
 * - Preserva espaços iniciais nas regras
 * - Não reprocessa resultado no mesmo ciclo
 * - Não altera timestamps
 */
function applyDictionaryCorrections(paragraphs, dictionary) {
  return paragraphs.map((paragraph) => {
    let updatedText = paragraph.text;

    for (const rule of dictionary) {
      if (!rule.from) continue;

      // Agora sempre usamos busca case-insensitive
      const flags = "gi";

      const pattern = rule.wholeWord
        ? `\\b${escapeRegExp(rule.from)}\\b`
        : escapeRegExp(rule.from);

      const regex = new RegExp(pattern, flags);

      updatedText = updatedText.replace(regex, (match) =>
        applyReplacement(match, rule)
      );
    }

    return {
      ...paragraph,
      text: updatedText,
    };
  });
}

module.exports = applyDictionaryCorrections;
