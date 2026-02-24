import { create } from "zustand";
import { roomService } from "@/services";

/**
 * Rooms store — manages discover page state (rooms list, pagination, filters).
 */
const useRoomsStore = create((set, get) => ({
  rooms: [],
  meta: null,
  isLoading: false,
  error: null,

  // Filters / query
  filters: {
    page: 1,
    limit: 12,
    sortBy: "currentNumParticipents",
    order: "desc",
    search: "",
  },

  /**
   * Fetch rooms from discover endpoint.
   * Merges current filters with any overrides.
   */
  fetchRooms: async (overrides = {}) => {
    const filters = { ...get().filters, ...overrides };

    // Persist the merged filters
    set({ filters, isLoading: true, error: null });

    try {
      const result = await roomService.discover({
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        order: filters.order,
        ...(filters.search ? { search: filters.search } : {}),
      });

      set({
        rooms: result.data,
        meta: result.meta,
        isLoading: false,
      });
    } catch (error) {
      const message =
        error.response?.data?.message || "فشل تحميل الغرف. حاول مرة أخرى.";
      set({ error: message, isLoading: false });
    }
  },

  /**
   * Set search query and refetch (resets to page 1).
   */
  setSearch: (search) => {
    get().fetchRooms({ search, page: 1 });
  },

  /**
   * Go to a specific page.
   */
  setPage: (page) => {
    get().fetchRooms({ page });
  },

  /**
   * Change sort criteria.
   */
  setSort: (sortBy, order = "desc") => {
    get().fetchRooms({ sortBy, order, page: 1 });
  },

  /**
   * Clear error.
   */
  clearError: () => set({ error: null }),
}));

export default useRoomsStore;
