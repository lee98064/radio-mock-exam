<template>
  <transition name="history-fade">
    <div v-if="open" class="history-overlay" @click.self="close">
      <section class="history-panel">
        <header class="history-panel__header">
          <div>
            <h2>歷史紀錄</h2>
            <p>檢視過往考試成績與答題明細。</p>
          </div>
          <button type="button" class="history-panel__close" @click="close" aria-label="關閉歷史紀錄">×</button>
        </header>

        <section v-if="loading" class="history-panel__state">讀取中，請稍候...</section>
        <section v-else-if="errorMessage" class="history-panel__state history-panel__state--error">
          {{ errorMessage }}
        </section>
        <section v-else-if="!attempts.length" class="history-panel__state">目前尚無紀錄。</section>

        <ul v-else class="history-list">
          <li v-for="attempt in attempts" :key="attempt.id" class="history-item">
            <header class="history-item__header" :class="{ 'is-pass': attempt.passed }">
              <div class="history-item__summary">
                <strong>{{ attempt.level }} 級</strong>
                <span>{{ formatStatus(attempt) }}</span>
              </div>
              <time :datetime="isoString(attempt.finishedAt)">{{ formatDate(attempt.finishedAt) }}</time>
            </header>

            <div class="history-item__body">
              <p>總題數 {{ attempt.total }} · 答對 {{ attempt.correct }} 題 · 答錯 {{ attempt.incorrect }} 題 · 及格門檻 {{ attempt.required }} 題</p>
              <details>
                <summary>查看答題明細</summary>
                <ul class="history-detail-list">
                  <li v-for="detail in attempt.questions" :key="detail.id" :class="{ 'is-correct': detail.isCorrect }">
                    <div class="history-detail__status" aria-hidden="true">
                      <span class="dot"></span>
                    </div>
                    <div class="history-detail__content">
                      <p class="history-detail__prompt">{{ detail.prompt }}</p>
                      <p class="history-detail__answer">
                        您的答案：<strong>{{ formatAnswer(detail.selectedIndex, detail.selectedText) }}</strong>
                        <span v-if="!detail.isCorrect">
                          · 正確答案：<strong>{{ formatAnswer(detail.correctIndex, detail.correctText) }}</strong>
                        </span>
                      </p>
                    </div>
                  </li>
                </ul>
              </details>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </transition>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue';
import { getExamAttempts } from '@/utils/historyStorage';

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const attempts = ref([]);
const loading = ref(false);
const errorMessage = ref('');

function close() {
  emit('close');
}

async function loadHistory() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const data = await getExamAttempts();
    attempts.value = data;
  } catch (error) {
    console.warn('[HistoryPanel] 無法載入歷史紀錄', error);
    errorMessage.value = '載入歷史紀錄時發生錯誤';
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      loadHistory();
    }
  }
);

onMounted(() => {
  if (props.open) {
    loadHistory();
  }
});

function formatDate(timestamp) {
  if (!timestamp) return '----';
  try {
    return new Intl.DateTimeFormat('zh-TW', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(timestamp));
  } catch (error) {
    return new Date(timestamp).toLocaleString();
  }
}

function isoString(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toISOString();
}

function formatStatus(attempt) {
  return attempt.passed ? '已通過' : '未通過';
}

function formatAnswer(index, text) {
  if (index === null || index === undefined) return '未作答';
  return text ? `${index}. ${text}` : `${index}`;
}
</script>

<style scoped lang="scss">
.history-fade-enter-active,
.history-fade-leave-active {
  transition: opacity 0.2s ease;
}

.history-fade-enter-from,
.history-fade-leave-to {
  opacity: 0;
}

.history-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: flex-end;
  background: rgba(15, 23, 42, 0.32);
  backdrop-filter: blur(2px);
  z-index: 50;
}

.history-panel {
  width: min(420px, 100%);
  max-height: 100vh;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.98);
  padding: clamp(1.5rem, 4vw, 2rem);
  box-shadow: -16px 0 40px rgba(15, 23, 42, 0.18);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.history-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.history-panel__header h2 {
  margin: 0;
  color: var(--text);
}

.history-panel__header p {
  margin: 0.25rem 0 0;
  color: var(--text-muted);
}

.history-panel__close {
  border: none;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  font-size: 1.4rem;
  line-height: 1;
  background: rgba(148, 163, 184, 0.25);
  color: var(--text);
  cursor: pointer;
}

.history-panel__state {
  padding: 1rem;
  border-radius: 1rem;
  background: rgba(148, 163, 184, 0.15);
  color: var(--text-muted);
  text-align: center;
}

.history-panel__state--error {
  color: #b91c1c;
  background: rgba(248, 113, 113, 0.18);
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.history-item {
  border-radius: 1.25rem;
  background: rgba(248, 250, 252, 0.95);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
  overflow: hidden;
}

.history-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: rgba(148, 163, 184, 0.18);
  color: var(--text);
}

.history-item__header.is-pass {
  background: rgba(34, 197, 94, 0.18);
  color: #166534;
}

.history-item__summary {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.history-item__summary strong {
  font-size: 1.1rem;
}

.history-item__summary span {
  font-size: 0.95rem;
  color: inherit;
}

.history-item__body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  color: var(--text-muted);
}

.history-item__body p {
  margin: 0;
}

.history-detail-list {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 240px;
  overflow-y: auto;
}

.history-detail-list li {
  display: flex;
  gap: 0.75rem;
  background: rgba(226, 232, 240, 0.7);
  padding: 0.75rem;
  border-radius: 0.75rem;
}

.history-detail-list li.is-correct {
  background: rgba(34, 197, 94, 0.12);
}

.history-detail__status .dot {
  display: inline-block;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: #dc2626;
  margin-top: 0.4rem;
}

.history-detail-list li.is-correct .history-detail__status .dot {
  background: #22c55e;
}

.history-detail__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.history-detail__prompt {
  margin: 0;
  color: var(--text);
  font-weight: 600;
}

.history-detail__answer {
  margin: 0;
  color: var(--text-muted);
}

@media (max-width: 600px) {
  .history-panel {
    width: 100%;
    border-radius: 0;
  }
}
</style>
