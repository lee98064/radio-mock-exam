<template>
  <div class="app-shell">
    <header class="top-bar">
      <div class="top-bar__brand">
        <span class="brand__title">Raido 模擬測驗</span>
        <small class="brand__subtitle">支援手機版的快速練習工具</small>
      </div>

      <div class="top-bar__controls">
        <nav class="mode-toggle" aria-label="選擇模式">
          <button
            v-for="mode in modes"
            :key="mode.id"
            type="button"
            class="mode-toggle__button"
            :class="{ 'mode-toggle__button--active': activeMode === mode.id }"
            @click="selectMode(mode.id)"
          >
            {{ mode.label }}
          </button>
        </nav>

        <button type="button" class="history-button" @click="openHistory">查看歷史紀錄</button>

        <template v-if="activeMode === 'practice'">
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
        </template>
      </div>
    </header>

    <main class="app-main">
      <section v-if="!activeMode" class="mode-intro">
        <h2>選擇模式開始練習</h2>
        <p>可以先進行練習模式複習題目，或選擇考試模式模擬正式測驗。</p>
        <div class="mode-intro__actions">
          <button type="button" class="primary-action" @click="selectMode('practice')">開始練習</button>
          <button type="button" class="secondary-action" @click="selectMode('exam')">開始考試</button>
        </div>
      </section>

      <template v-else-if="activeMode === 'practice'">
        <QuizCard
          v-if="currentQuestion"
          :question="currentQuestion"
          :wrong-choices="wrongChoices"
          :is-correct="isCorrect"
          :reveal-explanation="revealExplanation"
          :show-back-button="true"
          :can-go-back="canGoBack"
          @answer="handleAnswer"
          @next="handleNext"
          @back="handleBack"
        />

        <section v-else class="empty-state">
          <h2>尚未有題目</h2>
          <p>請確認題庫內有符合該等級的題目，或嘗試選擇其他等級。</p>
        </section>
      </template>

      <ExamMode v-else @exit="handleExitExam" />
    </main>
    <HistoryPanel :open="showHistory" @close="closeHistory" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import QuizCard from '@/components/QuizCard.vue';
import ExamMode from '@/components/ExamMode.vue';
import HistoryPanel from '@/components/HistoryPanel.vue';
import { useQuizStore } from '@/stores/quizStore';

const quizStore = useQuizStore();
const { currentQuestion, wrongChoices, isCorrect, revealExplanation, levels, progress, canGoBack } =
  storeToRefs(quizStore);

const activeLevel = computed(() => quizStore.level);
const levelOptions = computed(() => levels.value);

const modes = [
  { id: 'practice', label: '練習模式' },
  { id: 'exam', label: '考試模式' }
];

const activeMode = ref(null);
const showHistory = ref(false);

watch(activeMode, (mode) => {
  if (mode === 'practice') {
    quizStore.initialize();
  }
});

function onLevelChange(event) {
  const value = event.target.value;
  const candidate = Number(value);
  quizStore.setLevel(Number.isNaN(candidate) ? value : candidate);
}

function selectMode(modeId) {
  if (activeMode.value === modeId) return;
  activeMode.value = modeId;
}

function handleAnswer(choiceIndex) {
  quizStore.submitAnswer(choiceIndex);
}

function handleNext() {
  quizStore.pickNextQuestion();
}

function handleBack() {
  quizStore.goToPreviousQuestion();
}

function handleExitExam() {
  activeMode.value = null;
}

function openHistory() {
  showHistory.value = true;
}

function closeHistory() {
  showHistory.value = false;
}
</script>

<style scoped lang="scss">
.app-shell {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(160deg, #eff6ff 0%, #ffffff 40%, #e2e8f0 100%);
  padding-bottom: env(safe-area-inset-bottom);
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
  flex-wrap: wrap;
  gap: 1rem;
}

.mode-toggle {
  display: inline-flex;
  padding: 0.25rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.16);
  gap: 0.25rem;
  flex-shrink: 0;
}

.mode-toggle__button {
  border: none;
  border-radius: 999px;
  padding: 0.4rem 1.1rem;
  background: transparent;
  color: var(--text-muted);
  font-weight: 600;
  transition: background 0.2s ease, color 0.2s ease;
}

.mode-toggle__button--active {
  background: #ffffff;
  color: var(--brand-color-dark);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.18);
}

.history-button {
  border: none;
  border-radius: 999px;
  padding: 0.45rem 1.2rem;
  background: rgba(148, 163, 184, 0.2);
  color: var(--brand-color-dark);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
  flex-shrink: 0;
}

.history-button:hover {
  background: rgba(148, 163, 184, 0.3);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
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
  color: var(--text);
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
  padding: clamp(1rem, 4vw, 3rem) clamp(0.75rem, 5vw, 3rem) clamp(2rem, 6vw, 4rem);
  width: min(100%, 960px);
  margin: 0 auto;
  overflow-y: auto;
}

.mode-intro {
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  padding: 2.5rem clamp(1.5rem, 5vw, 3rem);
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
  text-align: center;
  color: var(--text-muted);
}

.mode-intro h2 {
  margin: 0 0 0.75rem;
  color: var(--text);
  font-size: clamp(1.4rem, 5vw, 1.8rem);
}

.mode-intro__actions {
  margin-top: 1.75rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.primary-action,
.secondary-action {
  border-radius: 999px;
  padding: 0.75rem 1.75rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.primary-action {
  background: var(--brand-color);
  color: #fff;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.25);
}

.primary-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 28px rgba(37, 99, 235, 0.28);
}

.secondary-action {
  background: rgba(148, 163, 184, 0.18);
  color: var(--text);
}

.secondary-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(100, 116, 139, 0.2);
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

@media (max-width: 920px) {
  .app-main {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .top-bar {
    gap: 1rem;
    padding: 1rem 1.25rem;
  }

  .top-bar__controls {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .progress {
    min-width: 140px;
  }

  .app-main {
    padding: 1rem 1.25rem 2.5rem;
  }
}

@media (max-width: 600px) {
  .app-shell {
    min-height: 100dvh;
  }

  .top-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
  }

  .top-bar__controls {
    gap: 0.75rem;
  }

  .history-button {
    width: 100%;
    text-align: center;
  }

  .progress {
    width: 100%;
  }

  .app-main {
    padding: 0.75rem 1rem 2.25rem;
  }
}

@media (max-width: 420px) {
  .top-bar__brand {
    gap: 0.25rem;
  }

  .brand__title {
    font-size: 1.2rem;
  }

  .brand__subtitle {
    font-size: 0.8rem;
  }

  .app-main {
    padding: 0.75rem 0.85rem 2rem;
  }
}
</style>
