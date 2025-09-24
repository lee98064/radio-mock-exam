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
    revealExplanation: false
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
    }
  },
  actions: {
    initialize() {
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
    },
    pickNextQuestion() {
      const pool = this.questionsByLevel;
      if (!pool.length) {
        this.currentQuestion = null;
        return;
      }
      const unanswered = pool.filter((item) => !this.askedIds.has(item.id));
      const sourcePool = unanswered.length ? unanswered : pool;
      const nextQuestion = randomFrom(sourcePool);
      if (!nextQuestion) return;

      if (!unanswered.length) {
        this.askedIds = new Set();
      }

      this.currentQuestion = nextQuestion;
      this.wrongChoices = [];
      this.isCorrect = false;
      this.revealExplanation = false;
    },
    submitAnswer(choiceIndex) {
      if (!this.currentQuestion) return false;
      if (choiceIndex === this.currentQuestion.answerIndex) {
        this.isCorrect = true;
        this.revealExplanation = true;
        const updated = new Set(this.askedIds);
        updated.add(this.currentQuestion.id);
        this.askedIds = updated;
        return true;
      }

      if (!this.wrongChoices.includes(choiceIndex)) {
        this.wrongChoices = [...this.wrongChoices, choiceIndex];
      }
      return false;
    }
  }
});
