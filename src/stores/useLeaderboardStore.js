import { create } from "zustand";
import { leaderboardService } from "@/services";

/**
 * Leaderboard Zustand store.
 */
const useLeaderboardStore = create((set, get) => ({
  period: "daily",
  entries: [],
  myRank: null,
  page: 1,
  totalItems: 0,
  isLoading: false,

  /**
   * Switch period tab and re-fetch from page 1.
   */
  setPeriod(period) {
    set({ period, entries: [], page: 1, totalItems: 0, myRank: null });
    get().fetchLeaderboard();
  },

  /**
   * Fetch leaderboard list + current user rank for the active period.
   */
  async fetchLeaderboard() {
    const { period, page } = get();
    set({ isLoading: true });

    try {
      const [listRes, rankRes] = await Promise.all([
        leaderboardService.getLeaderboard(period, page, 50),
        leaderboardService.getMyRank(period),
      ]);

      set({
        entries: listRes.data || [],
        totalItems: listRes.total || 0,
        myRank: rankRes,
      });
    } catch (err) {
      console.error("Leaderboard fetch failed:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Load next page and append results.
   */
  async loadMore() {
    const { period, page, entries, totalItems, isLoading } = get();
    if (isLoading || entries.length >= totalItems) return;

    const nextPage = page + 1;
    set({ isLoading: true, page: nextPage });

    try {
      const res = await leaderboardService.getLeaderboard(period, nextPage, 50);
      set({
        entries: [...entries, ...(res.data || [])],
        totalItems: res.total || totalItems,
      });
    } catch (err) {
      console.error("Load more failed:", err);
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useLeaderboardStore;
