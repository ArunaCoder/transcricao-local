// utils/applyDictionaryCorrections.js

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

      const flags = rule.caseSensitive ? "g" : "gi";

      // NÃO usamos trim() para preservar espaços intencionais
      const pattern = rule.wholeWord
        ? `\\b${escapeRegExp(rule.from)}\\b`
        : escapeRegExp(rule.from);

      const regex = new RegExp(pattern, flags);

      updatedText = updatedText.replace(regex, rule.to);
    }

    return {
      ...paragraph,
      text: updatedText,
    };
  });
}

module.exports = applyDictionaryCorrections;
