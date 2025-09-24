import { defineStore } from 'pinia';
import { availableLevels, questionBank } from '@/utils/normalizeQuestionBank';

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export const useQuizStore = defineStore('quiz', {
  state: () => ({
    level: availableLevels[0] ?? null,
    currentQuestion: null,
    askedIds: new Set(),
    wrongChoices: [],
    isCorrect: false,
    revealExplanation: false,
    history: [],
    historyIndex: -1
  }),
  getters: {
    levels: () => availableLevels,
    questionsByLevel(state) {
      if (state.level === null || state.level === undefined) return questionBank;
      return questionBank.filter((item) => item.level === state.level);
    },
    progress(state) {
      const poolSize = this.questionsByLevel.length;
      const answered = state.askedIds.size ?? 0;
      return {
        asked: answered,
        total: poolSize,
        completion: poolSize ? Math.round((answered / poolSize) * 100) : 0
      };
    },
    canGoBack(state) {
      return state.historyIndex > 0;
    },
    canGoForward(state) {
      return state.historyIndex < state.history.length - 1;
    }
  },
  actions: {
    initialize() {
      if (this.history.length && this.historyIndex >= 0) {
        this.applyHistoryEntry(this.history[this.historyIndex]);
        return;
      }

      if (!this.currentQuestion && this.questionsByLevel.length) {
        this.pickNextQuestion();
      }
    },
    setLevel(level) {
      this.level = level;
      this.resetSession();
      this.pickNextQuestion();
    },
    resetSession() {
      this.askedIds = new Set();
      this.wrongChoices = [];
      this.isCorrect = false;
      this.revealExplanation = false;
      this.currentQuestion = null;
      this.history = [];
      this.historyIndex = -1;
    },
    applyHistoryEntry(entry) {
      if (!entry) return;

      this.currentQuestion = entry.question;
      this.wrongChoices = entry.wrongChoices.slice();
      this.isCorrect = entry.isCorrect;
      this.revealExplanation = entry.revealExplanation;
    },
    updateCurrentHistory(patch = {}) {
      if (this.historyIndex < 0 || this.historyIndex >= this.history.length) return;
      const currentEntry = this.history[this.historyIndex];
      const updated = {
        ...currentEntry,
        ...patch,
        wrongChoices: patch.wrongChoices ? patch.wrongChoices.slice() : currentEntry.wrongChoices.slice()
      };
      this.history.splice(this.historyIndex, 1, updated);
      this.applyHistoryEntry(updated);
    },
    pickNextQuestion() {
      const pool = this.questionsByLevel;
      if (!pool.length) {
        this.currentQuestion = null;
        return;
      }

      if (this.canGoForward) {
        this.historyIndex += 1;
        this.applyHistoryEntry(this.history[this.historyIndex]);
        return;
      }

      const unanswered = pool.filter((item) => !this.askedIds.has(item.id));
      const sourcePool = unanswered.length ? unanswered : pool;
      const nextQuestion = randomFrom(sourcePool);
      if (!nextQuestion) return;

      if (!unanswered.length) {
        this.askedIds = new Set();
      }

      const entry = {
        question: nextQuestion,
        wrongChoices: [],
        isCorrect: false,
        revealExplanation: false
      };

      this.history.push(entry);
      this.historyIndex = this.history.length - 1;
      this.applyHistoryEntry(entry);
    },
    submitAnswer(choiceIndex) {
      if (!this.currentQuestion) return false;
      const currentEntry = this.history[this.historyIndex];
      if (!currentEntry) return false;

      if (choiceIndex === this.currentQuestion.answerIndex) {
        this.isCorrect = true;
        this.revealExplanation = true;
        const updated = new Set(this.askedIds);
        updated.add(this.currentQuestion.id);
        this.askedIds = updated;
        this.updateCurrentHistory({
          isCorrect: true,
          revealExplanation: true,
          wrongChoices: this.wrongChoices
        });
        return true;
      }

      if (!this.wrongChoices.includes(choiceIndex)) {
        const wrongChoices = [...this.wrongChoices, choiceIndex];
        this.wrongChoices = wrongChoices;
        this.updateCurrentHistory({ wrongChoices });
      }
      return false;
    },
    goToPreviousQuestion() {
      if (!this.canGoBack) return;
      this.historyIndex -= 1;
      this.applyHistoryEntry(this.history[this.historyIndex]);
    }
  }
});
