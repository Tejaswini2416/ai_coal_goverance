import { create } from "zustand";
import { TelanganaMine, MOCK_TELANGANA_MINES } from "../api/tenants";
import { useAuthStore } from "./auth-store";

export interface TenantState {
  selectedMineId: string;
  selectedMine: TelanganaMine | null;
  minesList: TelanganaMine[];
  setSelectedMineId: (mineId: string) => void;
  setMinesList: (mines: TelanganaMine[]) => void;
  selectMine: (mine: TelanganaMine) => void;
}

const defaultMine =
  MOCK_TELANGANA_MINES.find((m) => m.id === "11111111-1111-4111-a111-111111111111") ||
  MOCK_TELANGANA_MINES[0];

export const useTenantStore = create<TenantState>((set, get) => ({
  selectedMineId: defaultMine.id,
  selectedMine: defaultMine,
  minesList: MOCK_TELANGANA_MINES,

  setSelectedMineId: (mineId: string) => {
    const mine = get().minesList.find((m) => m.id === mineId) || null;
    set({
      selectedMineId: mineId,
      selectedMine: mine,
    });
    if (mine) {
      useAuthStore.getState().setActiveMine(mine.id, mine.name, mine.area);
    }
  },

  setMinesList: (mines: TelanganaMine[]) => {
    const currentId = get().selectedMineId;
    const currentMine = mines.find((m) => m.id === currentId) || mines[0] || null;
    set({
      minesList: mines,
      selectedMine: currentMine,
      selectedMineId: currentMine ? currentMine.id : currentId,
    });
  },

  selectMine: (mine: TelanganaMine) => {
    set({
      selectedMineId: mine.id,
      selectedMine: mine,
    });
    useAuthStore.getState().setActiveMine(mine.id, mine.name, mine.area);
  },
}));
