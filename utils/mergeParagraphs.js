// utils/mergeParagraphs.js

const DEFAULT_CONNECTORS = [
  "Portanto,",
  "Assim,",
  "Logo,",
  "Dessa forma,",
  "Desse modo,",
  "Por isso,",
  "Contudo,",
  "Entretanto,",
  "No entanto,",
  "Ou seja,",
];

function startsWithConnector(text, connectors = DEFAULT_CONNECTORS) {
  if (!text) return false;
  const trimmed = text.trim().toLowerCase();
  return connectors.some((c) => trimmed.startsWith(c.toLowerCase()));
}

// Uma única passagem
function singlePass(paragraphs, minLength, connectors) {
  const result = [];
  let i = 0;
  let changed = false;

  while (i < paragraphs.length) {
    const current = { ...paragraphs[i] };
    const isShort = current.text.length < minLength;

    if (!isShort) {
      result.push(current);
      i++;
      continue;
    }

    const prev = result.length > 0 ? result[result.length - 1] : null;
    const next = i + 1 < paragraphs.length ? paragraphs[i + 1] : null;

    const currentStarts = startsWithConnector(current.text, connectors);
    const nextStarts = next
      ? startsWithConnector(next.text, connectors)
      : false;

    // 1) B começa com conectivo → preferir B + C
    if (currentStarts && next) {
      current.text += " " + next.text;
      current.end = next.end;
      result.push(current);
      i += 2;
      changed = true;
      continue;
    }

    // 2) C começa com conectivo → fazer A + B
    if (!currentStarts && nextStarts && prev) {
      prev.text += " " + current.text;
      prev.end = current.end;
      i++;
      changed = true;
      continue;
    }

    // 3) Regra padrão → B + C
    if (next) {
      current.text += " " + next.text;
      current.end = next.end;
      result.push(current);
      i += 2;
      changed = true;
      continue;
    }

    // 4) Último pequeno sem próximo
    if (prev) {
      prev.text += " " + current.text;
      prev.end = current.end;
      changed = true;
    } else {
      result.push(current);
    }

    i++;
  }

  return { result, changed };
}

function mergeShortParagraphs(paragraphs, options = {}) {
  const { minLength = 400, connectors = DEFAULT_CONNECTORS } = options;

  if (!Array.isArray(paragraphs) || paragraphs.length === 0) {
    return [];
  }

  let current = paragraphs.map((p) => ({ ...p }));
  let safetyCounter = 0;

  while (true) {
    const { result, changed } = singlePass(current, minLength, connectors);

    current = result;
    safetyCounter++;

    // Para quando não houver mais mudanças
    if (!changed) break;

    // Proteção contra loop infinito
    if (safetyCounter > 50) break;
  }

  return current;
}

module.exports = {
  mergeShortParagraphs,
};
