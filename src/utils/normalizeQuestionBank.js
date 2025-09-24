import rawBank from '../題庫.json';

const OPTION_PATTERN = /^\s*[\(（](\d)[\)）]\s*(.*)$/;

function sanitizeText(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('\n');
}

function normalizeLevel(row) {
  const rawLevel = row['等級\n'] ?? row['等級'] ?? row.level;
  const numericLevel = Number(rawLevel);
  if (Number.isFinite(numericLevel)) {
    return numericLevel;
  }
  return sanitizeText(rawLevel);
}

function deriveGroupKey(row) {
  return (
    row['索引3'] ||
    row['索引號1'] ||
    row['索引'] ||
    row['Column9'] ||
    `${row['題號'] ?? ''}-${row['分類\\n'] ?? row['分類'] ?? ''}`
  );
}

function parseOption(row) {
  const prompt = sanitizeText(row['題目']);
  const columnLabel = sanitizeText(row['Column6']);
  const promptMatch = OPTION_PATTERN.exec(prompt);
  const columnMatch = OPTION_PATTERN.exec(columnLabel);
  const indexMatch = columnMatch ?? promptMatch;

  if (!indexMatch) return null;

  const index = Number(indexMatch[1]);
  const optionText = promptMatch ? sanitizeText(promptMatch[2]) : prompt;

  if (!Number.isFinite(index) || !optionText) return null;

  return {
    index,
    text: optionText
  };
}

function extractQuestionRow(row) {
  const answerRaw = sanitizeText(row['答案']);
  const answerMatch = answerRaw.match(/(\d)/);
  const answerIndex = answerMatch ? Number(answerMatch[1]) : undefined;

  return {
    id: deriveGroupKey(row) || `row-${Math.random().toString(36).slice(2)}`,
    prompt: sanitizeText(row['題目']),
    level: normalizeLevel(row),
    category: sanitizeText(row['分類\n'] ?? row['分類']),
    answerIndex,
    choices: [],
    explanationLines: []
  };
}

function finalizeQuestion(question) {
  if (!question) return null;
  if (!question.prompt) return null;
  if (!Number.isFinite(question.answerIndex)) return null;
  if (!question.choices.length) return null;

  return {
    id: question.id,
    prompt: question.prompt,
    level: question.level,
    category: question.category,
    answerIndex: question.answerIndex,
    choices: question.choices
      .slice()
      .sort((a, b) => a.index - b.index),
    explanation: question.explanationLines.join('\n')
  };
}

function normalizeQuestionBank() {
  const normalized = [];
  let current = null;

  for (const row of rawBank) {
    const hasQuestionNumber = Boolean(sanitizeText(row['題號']));
    const hasAnswer = Boolean(sanitizeText(row['答案']));

    if (hasQuestionNumber && hasAnswer) {
      const completed = finalizeQuestion(current);
      if (completed) normalized.push(completed);
      current = extractQuestionRow(row);
      continue;
    }

    if (!current) continue;

    const option = parseOption(row);
    if (option) {
      current.choices.push(option);
      continue;
    }

    const explanation = sanitizeText(row['題目']);
    if (explanation && explanation !== 'o') {
      current.explanationLines.push(explanation);
    }
  }

  const pending = finalizeQuestion(current);
  if (pending) normalized.push(pending);

  return normalized;
}

export const questionBank = normalizeQuestionBank();

export const availableLevels = Array.from(
  new Set(questionBank.map((item) => item.level))
).sort((a, b) => {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
});
