import { create } from 'zustand';

export type ToastKind = 'success' | 'error' | 'info';

type ToastState = {
  message: string | null;
  kind: ToastKind;
  id: number;
  show: (message: string, kind?: ToastKind) => void;
  hide: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  kind: 'info',
  id: 0,
  show: (message, kind = 'info') => set((s) => ({ message, kind, id: s.id + 1 })),
  hide: () => set({ message: null }),
}));

export const toast = {
  success: (message: string) => useToastStore.getState().show(message, 'success'),
  error: (message: string) => useToastStore.getState().show(message, 'error'),
  info: (message: string) => useToastStore.getState().show(message, 'info'),
};
