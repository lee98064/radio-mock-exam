<template>
  <section class="quiz-card">
    <header class="quiz-card__header">
      <p class="quiz-card__meta">
        <span class="quiz-card__badge">{{ question.level }} 級</span>
        <span v-if="question.category" class="quiz-card__category">{{ question.category }}</span>
      </p>
      <h2 class="quiz-card__prompt">{{ question.prompt }}</h2>
    </header>

    <div class="quiz-card__choices">
      <button
        v-for="choice in question.choices"
        :key="choice.index"
        class="choice"
        :class="choiceClass(choice.index)"
        :disabled="isChoiceDisabled(choice.index)"
        type="button"
        @click="() => emit('answer', choice.index)"
      >
        <strong class="choice__index">{{ choice.index }}</strong>
        <span class="choice__text">{{ choice.text }}</span>
      </button>
    </div>

    <Transition name="fade-slide">
      <div v-if="revealExplanation && explanationLines.length" class="quiz-card__explanation">
        <h3>解析</h3>
        <p v-for="(line, index) in explanationLines" :key="index">{{ line }}</p>
      </div>
    </Transition>

    <footer class="quiz-card__footer">
      <button
        class="next-button"
        type="button"
        :disabled="!isCorrect"
        @click="() => emit('next')"
      >
        下一題
      </button>
    </footer>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  question: {
    type: Object,
    required: true
  },
  wrongChoices: {
    type: Array,
    default: () => []
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  revealExplanation: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['answer', 'next']);

const explanationLines = computed(() => {
  if (!props.question?.explanation) return [];
  return props.question.explanation.split('\n');
});

function choiceClass(choiceIndex) {
  return {
    'choice--correct': props.isCorrect && choiceIndex === props.question.answerIndex,
    'choice--incorrect': props.wrongChoices.includes(choiceIndex)
  };
}

function isChoiceDisabled(choiceIndex) {
  if (props.isCorrect) {
    return true;
  }
  return props.wrongChoices.includes(choiceIndex);
}
</script>

<style scoped lang="scss">
.quiz-card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: clamp(1.5rem, 4vw, 2rem);
  background: var(--surface);
  border-radius: 1.25rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  width: 100%;
  max-width: 720px;
}

.quiz-card__header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.quiz-card__meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.quiz-card__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3rem;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.15);
  color: var(--brand-color-dark);
  font-weight: 600;
}

.quiz-card__category {
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  background: var(--surface-muted);
}

.quiz-card__prompt {
  font-size: clamp(1.2rem, 4vw, 1.6rem);
  line-height: 1.5;
  margin: 0;
  color: var(--text);
}

.quiz-card__choices {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.choice {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  border: 2px solid transparent;
  border-radius: 1rem;
  background: var(--surface-muted);
  text-align: left;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border 0.15s ease;
  color: inherit;
}

.choice:enabled:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px -18px rgba(15, 23, 42, 0.5);
  border-color: rgba(37, 99, 235, 0.35);
}

.choice:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.choice__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: var(--surface);
  border: 2px solid rgba(15, 23, 42, 0.08);
  font-size: 1.1rem;
}

.choice__text {
  flex: 1;
  font-size: 1rem;
  line-height: 1.5;
}

.choice--correct {
  border-color: var(--correct);
  background: rgba(22, 163, 74, 0.12);
}

.choice--incorrect {
  border-color: var(--incorrect);
  background: rgba(220, 38, 38, 0.1);
}

.quiz-card__explanation {
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  background: rgba(37, 99, 235, 0.08);
  color: var(--brand-color-dark);
  line-height: 1.6;
}

.quiz-card__explanation h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 700;
}

.quiz-card__explanation p {
  margin: 0.35rem 0;
}

.quiz-card__footer {
  display: flex;
  justify-content: flex-end;
}

.next-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 999px;
  background: var(--brand-color);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  transition: background 0.15s ease;
}

.next-button:enabled:hover {
  background: var(--brand-color-dark);
}

.next-button:disabled {
  background: rgba(148, 163, 184, 0.6);
  cursor: not-allowed;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 640px) {
  .quiz-card {
    gap: 1.1rem;
    padding: 1.1rem;
    border-radius: 1rem;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.1);
  }

  .choice {
    gap: 0.75rem;
    padding: 0.75rem 0.85rem;
  }

  .quiz-card__prompt {
    font-size: 1.15rem;
  }

  .choice__index {
    width: 2rem;
    height: 2rem;
    font-size: 1rem;
  }

  .choice__text {
    font-size: 0.95rem;
  }

  .next-button {
    padding: 0.65rem 1.35rem;
  }
}

@media (max-height: 700px) and (max-width: 640px) {
  .quiz-card {
    gap: 1rem;
  }

  .quiz-card__header {
    gap: 0.5rem;
  }

  .quiz-card__meta {
    font-size: 0.85rem;
  }

  .quiz-card__prompt {
    font-size: 1.05rem;
  }
}
</style>
