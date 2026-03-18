import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_TICKETS_TOTAL = 'tickets_total_v1';

export async function getTicketsTotal(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEY_TICKETS_TOTAL);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  } catch {
    return 0;
  }
}

export async function setTicketsTotal(value: number): Promise<number> {
  const safe = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  await AsyncStorage.setItem(KEY_TICKETS_TOTAL, String(safe));
  return safe;
}

export async function addTickets(delta: number): Promise<number> {
  const cur = await getTicketsTotal();
  const next = cur + (Number.isFinite(delta) ? Math.floor(delta) : 0);
  return setTicketsTotal(next);
}
