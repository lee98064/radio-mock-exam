<template>
  <section class="exam-mode">
    <div v-if="status === 'idle'" class="exam-start">
      <header class="exam-start__intro">
        <h2>考試模式</h2>
        <p>依正式規則抽題作答，達到及格門檻即可通過本次測驗。</p>
      </header>

      <label class="exam-start__field">
        <span>選擇等級</span>
        <select v-model="selectedLevel">
          <option v-for="option in levelOptions" :key="option" :value="option">
            {{ option }} 級
          </option>
        </select>
      </label>

      <p v-if="selectedRule" class="exam-start__hint">
        本次考試將抽出 {{ selectedRule.total }} 題，需答對 {{ selectedRule.required }} 題才算及格。
        <span class="exam-start__pool">此等級共有 {{ availableCount }} 題</span>
      </p>
      <p v-if="selectedRule && selectedRule.total > availableCount" class="exam-start__warning">
        題庫題數不足，將以現有題目數量 {{ availableCount }} 題進行考試。
      </p>

      <p v-if="errorMessage" class="exam-start__error">{{ errorMessage }}</p>

      <button type="button" class="exam-start__action" :disabled="!canStart" @click="handleStart">
        開始考試
      </button>
      <button type="button" class="exam-start__exit" @click="handleExit">返回模式選擇</button>
    </div>

    <div v-else-if="status === 'in-progress'" class="exam-session">
      <header class="exam-session__header">
        <div class="exam-session__progress">
          <strong>第 {{ currentNumber }} / {{ totalQuestions }} 題</strong>
          <span>已作答 {{ answeredCount }} 題</span>
        </div>
        <div class="exam-session__requirement">
          <span>及格條件：{{ config?.required }} / {{ config?.total }} 題</span>
        </div>
        <div class="exam-session__bar">
          <div class="exam-session__bar-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </header>

      <article v-if="currentQuestion" class="exam-card">
        <header class="exam-card__header">
          <p class="exam-card__meta">
            <span class="exam-card__badge">{{ currentQuestion.level }} 級</span>
            <span v-if="currentQuestion.category" class="exam-card__category">{{ currentQuestion.category }}</span>
          </p>
          <h2 class="exam-card__prompt">{{ currentQuestion.prompt }}</h2>
        </header>

        <div class="exam-card__choices">
          <button
            v-for="choice in currentQuestion.choices"
            :key="choice.index"
            type="button"
            class="exam-choice"
            :class="{ 'exam-choice--selected': choice.index === currentSelection }"
            @click="handleChoice(choice.index)"
          >
            <span class="exam-choice__index">{{ choice.index }}</span>
            <span class="exam-choice__text">{{ choice.text }}</span>
          </button>
        </div>
      </article>

      <footer class="exam-session__footer">
        <button type="button" class="exam-footer__button" :disabled="!canGoPrevious" @click="goPrevious">
          上一題
        </button>
        <button
          type="button"
          class="exam-footer__button exam-footer__button--primary"
          :disabled="!canProceed"
          @click="goNext"
        >
          {{ nextLabel }}
        </button>
      </footer>
    </div>

    <div v-else-if="status === 'completed'" class="exam-result">
      <header class="exam-result__header" :class="{ 'exam-result__header--pass': results?.passed }">
        <h2>{{ results?.passed ? '恭喜通過！' : '未達標準' }}</h2>
        <p>
          等級 {{ results?.level }} 級 · 作答 {{ results?.total }} 題 · 正確 {{ results?.correct }} 題 · 錯誤
          {{ results?.incorrect }} 題
        </p>
        <p class="exam-result__requirement">及格門檻：{{ results?.required }} 題</p>
      </header>

      <section class="exam-result__summary">
        <h3>題目檢視</h3>
        <ul class="exam-result__list">
          <li v-for="detail in results?.details" :key="detail.id" :class="{ 'is-correct': detail.isCorrect }">
            <div class="exam-result__status" aria-hidden="true">
              <span class="dot"></span>
            </div>
            <div class="exam-result__content">
              <p class="exam-result__prompt">{{ detail.prompt }}</p>
              <p class="exam-result__answer">
                您的答案：<strong>{{ formatChoice(detail.selectedIndex) }}</strong>
                <span v-if="!detail.isCorrect"> · 正確答案：<strong>{{ formatChoice(detail.correctIndex) }}</strong></span>
              </p>
            </div>
          </li>
        </ul>
      </section>

      <footer class="exam-result__actions">
        <button type="button" @click="handleRetake">再考一次</button>
        <button type="button" class="exam-result__exit" @click="handleExit">返回模式選擇</button>
      </footer>
    </div>
  </section>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useExamStore, resolveExamRule } from '@/stores/examStore';
import { questionBank } from '@/utils/normalizeQuestionBank';

const emit = defineEmits(['exit']);

const examStore = useExamStore();
const { status, currentQuestion, currentIndex, totalQuestions, currentResponse, answeredCount, results, config, levels } =
  storeToRefs(examStore);

const levelOptions = computed(() => levels.value);
const selectedLevel = ref(levelOptions.value[0] ?? null);
const errorMessage = ref('');

const questionCountMap = (() => {
  const map = new Map();
  questionBank.forEach((question) => {
    const current = map.get(question.level) ?? 0;
    map.set(question.level, current + 1);
  });
  return map;
})();

const availableCount = computed(() => questionCountMap.get(selectedLevel.value) ?? 0);

const selectedRule = computed(() => {
  if (!selectedLevel.value) return null;
  return resolveExamRule(selectedLevel.value, availableCount.value);
});

const canStart = computed(() => Boolean(selectedLevel.value) && availableCount.value > 0);

watch(levelOptions, (next) => {
  if (!next.length) {
    selectedLevel.value = null;
    return;
  }
  if (!selectedLevel.value || !next.includes(selectedLevel.value)) {
    selectedLevel.value = next[0];
  }
});

watch(status, (value) => {
  if (value === 'completed' && results.value) {
    selectedLevel.value = results.value.level;
  }
});

const currentNumber = computed(() => currentIndex.value + 1);
const currentSelection = computed(() => currentResponse.value?.selectedIndex ?? null);
const canGoPrevious = computed(() => currentIndex.value > 0);
const isLastQuestion = computed(() => currentNumber.value === totalQuestions.value);
const canProceed = computed(() => currentSelection.value !== null);
const nextLabel = computed(() => (isLastQuestion.value ? '交卷' : '下一題'));
const progressPercent = computed(() => {
  if (!totalQuestions.value) return 0;
  return Math.round((currentNumber.value / totalQuestions.value) * 100);
});

function handleStart() {
  if (!selectedLevel.value) {
    errorMessage.value = '請先選擇等級';
    return;
  }
  try {
    examStore.startExam(selectedLevel.value);
    errorMessage.value = '';
  } catch (error) {
    errorMessage.value = error?.message ?? '啟動考試時發生錯誤';
  }
}

function handleChoice(choiceIndex) {
  examStore.selectAnswer(choiceIndex);
}

function goPrevious() {
  if (!canGoPrevious.value) return;
  examStore.goPrevious();
}

function goNext() {
  if (!canProceed.value) return;
  if (isLastQuestion.value) {
    examStore.submitExam();
  } else {
    examStore.goNext();
  }
}

function handleRetake() {
  if (!results.value?.level) return;
  selectedLevel.value = results.value.level;
  handleStart();
}

function handleExit() {
  examStore.reset();
  errorMessage.value = '';
  emit('exit');
}

function formatChoice(value) {
  if (value === null || value === undefined) return '未作答';
  return `${value}`;
}

onUnmounted(() => {
  examStore.reset();
});
</script>

<style scoped lang="scss">
.exam-mode {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.exam-start {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12);
}

.exam-start__intro h2 {
  margin: 0 0 0.4rem;
  font-size: clamp(1.4rem, 5vw, 1.8rem);
  color: var(--text);
}

.exam-start__intro p {
  margin: 0;
  color: var(--text-muted);
}

.exam-start__field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.95rem;
  color: var(--text-muted);
}

.exam-start__field select {
  padding: 0.6rem 0.85rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(148, 163, 184, 0.4);
  font-size: 1rem;
}

.exam-start__hint {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.6;
}

.exam-start__pool {
  display: block;
  font-size: 0.9rem;
  color: rgba(30, 41, 59, 0.7);
}

.exam-start__warning {
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  background: rgba(248, 113, 113, 0.12);
  color: #b91c1c;
  font-size: 0.95rem;
}

.exam-start__error {
  margin: 0;
  color: #b91c1c;
  font-weight: 600;
}

.exam-start__action,
.exam-start__exit {
  border: none;
  border-radius: 999px;
  padding: 0.75rem 1.65rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.exam-start__action {
  background: var(--brand-color);
  color: #fff;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.25);
}

.exam-start__action:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(37, 99, 235, 0.28);
}

.exam-start__action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.exam-start__action:disabled:hover {
  transform: none;
  box-shadow: none;
}

.exam-start__exit {
  background: rgba(148, 163, 184, 0.18);
  color: var(--text);
}

.exam-start__exit:hover {
  transform: translateY(-1px);
}

.exam-session {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.exam-session__header {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 1.25rem;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.1);
}

.exam-session__progress {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  color: var(--text);
}

.exam-session__progress strong {
  font-size: 1.1rem;
}

.exam-session__progress span {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.exam-session__requirement {
  font-size: 0.95rem;
  color: var(--text-muted);
}

.exam-session__bar {
  width: 100%;
  height: 0.45rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.25);
  overflow: hidden;
}

.exam-session__bar-fill {
  height: 100%;
  background: var(--brand-color);
  transition: width 0.2s ease;
}

.exam-card {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  padding: clamp(1.5rem, 4vw, 2.25rem);
  background: var(--surface);
  border-radius: 1.25rem;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
}

.exam-card__header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.exam-card__meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.exam-card__badge {
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

.exam-card__category {
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  background: var(--surface-muted);
}

.exam-card__prompt {
  margin: 0;
  font-size: clamp(1.2rem, 4vw, 1.6rem);
  line-height: 1.5;
  color: var(--text);
}

.exam-card__choices {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.exam-choice {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 1rem;
  border: 2px solid transparent;
  background: var(--surface-muted);
  text-align: left;
  font-size: 1rem;
  transition: border 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.exam-choice:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px -18px rgba(15, 23, 42, 0.4);
  border-color: rgba(37, 99, 235, 0.35);
}

.exam-choice--selected {
  border-color: var(--brand-color);
  background: rgba(37, 99, 235, 0.12);
}

.exam-choice__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: #fff;
  border: 2px solid rgba(15, 23, 42, 0.08);
  font-weight: 600;
}

.exam-choice__text {
  flex: 1;
  line-height: 1.5;
}

.exam-session__footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.exam-footer__button {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  background: rgba(148, 163, 184, 0.25);
  color: var(--text);
  transition: background 0.15s ease, color 0.15s ease;
}

.exam-footer__button:hover:enabled {
  background: rgba(148, 163, 184, 0.35);
}

.exam-footer__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.exam-footer__button--primary {
  background: var(--brand-color);
  color: #fff;
}

.exam-footer__button--primary:hover:enabled {
  background: var(--brand-color-dark);
}

.exam-result {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.exam-result__header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: clamp(1.5rem, 4vw, 2rem);
  border-radius: 1.5rem;
  background: rgba(248, 113, 113, 0.12);
  color: #b91c1c;
}

.exam-result__header--pass {
  background: rgba(34, 197, 94, 0.14);
  color: #15803d;
}

.exam-result__header h2 {
  margin: 0;
  font-size: clamp(1.4rem, 4vw, 1.8rem);
}

.exam-result__header p {
  margin: 0;
  color: inherit;
}

.exam-result__requirement {
  font-size: 0.95rem;
  opacity: 0.9;
}

.exam-result__summary {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 1.5rem;
  padding: clamp(1.25rem, 3vw, 1.75rem);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12);
}

.exam-result__summary h3 {
  margin: 0 0 1rem;
  color: var(--text);
}

.exam-result__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.exam-result__list li {
  display: flex;
  gap: 1rem;
  background: rgba(241, 245, 249, 0.8);
  padding: 1rem;
  border-radius: 1rem;
}

.exam-result__list li.is-correct {
  background: rgba(34, 197, 94, 0.12);
}

.exam-result__status .dot {
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background: #f97316;
  margin-top: 0.4rem;
}

.exam-result__list li.is-correct .exam-result__status .dot {
  background: #22c55e;
}

.exam-result__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.exam-result__prompt {
  margin: 0;
  color: var(--text);
  font-weight: 600;
}

.exam-result__answer {
  margin: 0;
  color: var(--text-muted);
}

.exam-result__actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.exam-result__actions button {
  border-radius: 999px;
  padding: 0.75rem 1.75rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.exam-result__actions button:hover {
  transform: translateY(-1px);
}

.exam-result__actions button:first-child {
  background: var(--brand-color);
  color: #fff;
}

.exam-result__exit {
  background: rgba(148, 163, 184, 0.18);
  color: var(--text);
}

@media (max-width: 640px) {
  .exam-card {
    padding: 1.25rem;
  }

  .exam-card__choices {
    gap: 0.75rem;
  }

  .exam-choice {
    padding: 0.85rem;
  }

  .exam-session__footer {
    flex-direction: column;
  }

  .exam-footer__button {
    width: 100%;
  }

  .exam-result__list {
    max-height: 300px;
  }

  .exam-result__actions {
    flex-direction: column;
  }

  .exam-result__actions button {
    width: 100%;
    text-align: center;
  }
}
</style>
