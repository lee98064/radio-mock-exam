import { defineStore } from 'pinia';
import { questionBank, availableLevels } from '@/utils/normalizeQuestionBank';
import { saveExamAttempt } from '@/utils/historyStorage';

export const EXAM_RULES = {
  1: { total: 50, pass: 40 },
  2: { total: 40, pass: 32 },
  3: { total: 35, pass: 25 }
};

function randomize(array) {
  const clone = array.slice();
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

export function resolveExamRule(level, poolSize) {
  const key = typeof level === 'number' ? level : Number(level);
  const rawRule = Number.isFinite(key) && EXAM_RULES[key] ? EXAM_RULES[key] : null;
  const desiredTotal = rawRule?.total ?? Math.min(poolSize, 30);
  const total = Math.min(desiredTotal, poolSize);
  const pass = rawRule?.pass ?? Math.ceil(total * 0.7);
  return {
    total,
    required: Math.min(pass, total)
  };
}

function generateAttemptId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `exam-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const useExamStore = defineStore('exam', {
  state: () => ({
    status: 'idle', // idle | in-progress | completed
    level: null,
    questions: [],
    responses: [],
    currentIndex: 0,
    startedAt: null,
    finishedAt: null,
    results: null,
    config: null
  }),
  getters: {
    currentQuestion(state) {
      return state.questions[state.currentIndex] ?? null;
    },
    totalQuestions(state) {
      return state.questions.length;
    },
    currentResponse(state) {
      return state.responses[state.currentIndex] ?? null;
    },
    answeredCount(state) {
      return state.responses.filter((entry) => entry && entry.selectedIndex !== null).length;
    },
    levels: () => availableLevels
  },
  actions: {
    reset() {
      this.status = 'idle';
      this.level = null;
      this.questions = [];
      this.responses = [];
      this.currentIndex = 0;
      this.startedAt = null;
      this.finishedAt = null;
      this.results = null;
      this.config = null;
    },
    startExam(level) {
      const pool = questionBank.filter((item) => item.level === level);
      if (!pool.length) {
        throw new Error('指定等級沒有題目可供考試');
      }
      const rule = resolveExamRule(level, pool.length);
      const questions = randomize(pool).slice(0, rule.total);
      this.level = level;
      this.config = {
        total: rule.total,
        required: rule.required,
        available: pool.length
      };
      this.questions = questions;
      this.responses = questions.map((item) => ({ questionId: item.id, selectedIndex: null }));
      this.currentIndex = 0;
      this.startedAt = Date.now();
      this.finishedAt = null;
      this.results = null;
      this.status = 'in-progress';
    },
    goTo(index) {
      if (index < 0 || index >= this.questions.length) return;
      this.currentIndex = index;
    },
    goNext() {
      const nextIndex = this.currentIndex + 1;
      if (nextIndex < this.questions.length) {
        this.currentIndex = nextIndex;
      }
    },
    goPrevious() {
      const prevIndex = this.currentIndex - 1;
      if (prevIndex >= 0) {
        this.currentIndex = prevIndex;
      }
    },
    selectAnswer(choiceIndex) {
      if (this.status !== 'in-progress') return;
      const question = this.currentQuestion;
      if (!question) return;
      const response = {
        questionId: question.id,
        selectedIndex: choiceIndex
      };
      this.responses.splice(this.currentIndex, 1, response);
    },
    async submitExam() {
      if (this.status !== 'in-progress') return;
      const total = this.questions.length;
      let correct = 0;
      const details = this.questions.map((question, index) => {
        const response = this.responses[index] ?? { selectedIndex: null };
        const selectedChoice = question.choices.find((choice) => choice.index === response.selectedIndex) ?? null;
        const correctChoice = question.choices.find((choice) => choice.index === question.answerIndex) ?? null;
        const isCorrect = response.selectedIndex === question.answerIndex;
        if (isCorrect) correct += 1;
        return {
          id: question.id,
          prompt: question.prompt,
          level: question.level,
          selectedIndex: response.selectedIndex,
          correctIndex: question.answerIndex,
          selectedText: selectedChoice?.text ?? null,
          correctText: correctChoice?.text ?? null,
          isCorrect
        };
      });
      const incorrect = total - correct;
      const required = this.config?.required ?? 0;
      const passed = correct >= required;
      this.results = {
        level: this.level,
        total,
        correct,
        incorrect,
        required,
        passed,
        details,
        startedAt: this.startedAt,
        finishedAt: Date.now()
      };
      this.finishedAt = this.results.finishedAt;
      this.status = 'completed';

      const record = {
        id: generateAttemptId(),
        level: this.results.level,
        total: this.results.total,
        correct: this.results.correct,
        incorrect: this.results.incorrect,
        required: this.results.required,
        passed: this.results.passed,
        startedAt: this.results.startedAt,
        finishedAt: this.results.finishedAt,
        questions: this.results.details.map((detail) => ({
          id: detail.id,
          prompt: detail.prompt,
          selectedIndex: detail.selectedIndex,
          selectedText: detail.selectedText,
          correctIndex: detail.correctIndex,
          correctText: detail.correctText,
          isCorrect: detail.isCorrect
        }))
      };

      await saveExamAttempt(record);
    }
  }
});
