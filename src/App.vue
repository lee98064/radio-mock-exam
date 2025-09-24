<template>
  <div class="app-shell">
    <header class="top-bar">
      <div class="top-bar__brand">
        <span class="brand__title">Raido 模擬測驗</span>
        <small class="brand__subtitle">支援手機版的快速練習工具</small>
      </div>

      <div class="top-bar__controls">
        <label class="level-picker">
          <span>選擇等級</span>
          <select :value="String(activeLevel)" @change="onLevelChange">
            <option v-for="option in levelOptions" :key="option" :value="String(option)">
              {{ option }} 級
            </option>
          </select>
        </label>
        <div class="progress">
          <span class="progress__label">已完成 {{ progress.asked }} 題</span>
          <div class="progress__bar">
            <div class="progress__bar-fill" :style="{ width: progress.completion + '%' }"></div>
          </div>
        </div>
      </div>
    </header>

    <main class="app-main">
      <QuizCard
        v-if="currentQuestion"
        :question="currentQuestion"
        :wrong-choices="wrongChoices"
        :is-correct="isCorrect"
        :reveal-explanation="revealExplanation"
        @answer="handleAnswer"
        @next="handleNext"
      />

      <section v-else class="empty-state">
        <h2>尚未有題目</h2>
        <p>請確認題庫內有符合該等級的題目，或嘗試選擇其他等級。</p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import QuizCard from '@/components/QuizCard.vue';
import { useQuizStore } from '@/stores/quizStore';

const quizStore = useQuizStore();
const { currentQuestion, wrongChoices, isCorrect, revealExplanation, levels, progress } = storeToRefs(quizStore);

const activeLevel = computed(() => quizStore.level);
const levelOptions = computed(() => levels.value);

onMounted(() => {
  quizStore.initialize();
});

function onLevelChange(event) {
  const value = event.target.value;
  const candidate = Number(value);
  quizStore.setLevel(Number.isNaN(candidate) ? value : candidate);
}

function handleAnswer(choiceIndex) {
  quizStore.submitAnswer(choiceIndex);
}

function handleNext() {
  quizStore.pickNextQuestion();
}
</script>

<style scoped lang="scss">
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(160deg, #eff6ff 0%, #ffffff 40%, #e2e8f0 100%);
}

.top-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
  justify-content: space-between;
  padding: clamp(1rem, 4vw, 1.5rem) clamp(1rem, 5vw, 3rem);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.top-bar__brand {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.brand__title {
  font-size: clamp(1.25rem, 4vw, 1.6rem);
  font-weight: 700;
  color: var(--brand-color-dark);
}

.brand__subtitle {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.top-bar__controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.level-picker {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.95rem;
  color: var(--text-muted);
}

.level-picker select {
  min-width: 120px;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: var(--surface);
  font-size: 1rem;
}

.progress {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 180px;
}

.progress__label {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.progress__bar {
  width: 100%;
  height: 0.4rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.3);
  overflow: hidden;
}

.progress__bar-fill {
  height: 100%;
  background: var(--brand-color);
  transition: width 0.2s ease;
}

.app-main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: clamp(1rem, 5vw, 3rem);
}

.empty-state {
  padding: 3rem 2rem;
  background: var(--surface);
  border-radius: 1.5rem;
  text-align: center;
  color: var(--text-muted);
  max-width: 480px;
}

.empty-state h2 {
  margin-top: 0;
  color: var(--text);
}

@media (max-width: 768px) {
  .top-bar {
    padding: 1rem 1.25rem;
  }

  .top-bar__controls {
    width: 100%;
    justify-content: space-between;
  }

  .progress {
    min-width: 140px;
  }

  .app-main {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .top-bar__controls {
    flex-direction: column;
    align-items: flex-start;
  }

  .progress {
    width: 100%;
  }

  .progress__bar {
    height: 0.5rem;
  }

  .level-picker select {
    width: 100%;
  }

  .app-main {
    padding: 1rem 0.75rem 2rem;
  }
}
</style>
