import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QuizCategoryId } from '../data/quizData';

const KEY_STATS = 'quiz_correct_stats_v1';

type StatsMap = Record<string, number>;

export async function getCorrectStats(): Promise<Record<QuizCategoryId, number>> {
  try {
    const raw = await AsyncStorage.getItem(KEY_STATS);
    if (!raw) return {} as Record<QuizCategoryId, number>;
    const parsed = JSON.parse(raw) as StatsMap;
    const out: StatsMap = {};
    if (parsed && typeof parsed === 'object') {
      for (const k of Object.keys(parsed)) {
        const v = Number((parsed as any)[k]);
        out[k] = Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
      }
    }
    return out as Record<QuizCategoryId, number>;
  } catch {
    return {} as Record<QuizCategoryId, number>;
  }
}

export async function addCorrectAnswer(categoryId: QuizCategoryId, delta: number): Promise<Record<QuizCategoryId, number>> {
  const d = Math.max(0, Math.floor(Number(delta) || 0));
  if (!d) return await getCorrectStats();

  const current = await getCorrectStats();
  const prev = Math.max(0, Math.floor(Number((current as any)[categoryId]) || 0));
  const next = { ...(current as any), [categoryId]: prev + d } as Record<QuizCategoryId, number>;

  try {
    await AsyncStorage.setItem(KEY_STATS, JSON.stringify(next));
  } catch {}

  return next;
}

export async function resetCorrectStats() {
  try {
    await AsyncStorage.removeItem(KEY_STATS);
  } catch {}
}
