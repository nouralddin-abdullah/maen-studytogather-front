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
    myRoomsOnly: false,
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
      let result;
      if (filters.myRoomsOnly) {
        // "My Rooms" mode — backend returns { item: [...] } without pagination params
        result = await roomService.getMyRooms();
        let fetchedRooms = result.item || result.data || [];

        // Apply manual search
        if (filters.search) {
          const s = filters.search.toLowerCase();
          fetchedRooms = fetchedRooms.filter(
            (r) =>
              (r.name && r.name.toLowerCase().includes(s)) ||
              (r.description && r.description.toLowerCase().includes(s))
          );
        }

        // Apply manual sort
        if (filters.sortBy) {
          fetchedRooms.sort((a, b) => {
            let valA = a[filters.sortBy];
            let valB = b[filters.sortBy];

            // Handle dates
            if (filters.sortBy === "createdAt") {
              valA = new Date(valA).getTime() || 0;
              valB = new Date(valB).getTime() || 0;
            }

            if (valA < valB) return filters.order === "asc" ? -1 : 1;
            if (valA > valB) return filters.order === "asc" ? 1 : -1;
            return 0;
          });
        }

        // Mock a meta object since the endpoint doesn't return one
        set({
          rooms: fetchedRooms,
          meta: {
            currentPage: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          isLoading: false,
        });
      } else {
        // Normal "Discover" mode
        result = await roomService.discover({
          page: filters.page,
          limit: filters.limit,
          sortBy: filters.sortBy,
          order: filters.order,
          ...(filters.search ? { search: filters.search } : {}),
        });
        set({
          rooms: result.data || [],
          meta: result.meta || { currentPage: 1, totalPages: 1 },
          isLoading: false,
        });
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "فشل تحميل الغرف. حاول مرة أخرى.";
      set({ error: message, isLoading: false, rooms: [] });
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
   * Toggle 'My Rooms' filter
   */
  toggleMyRooms: (myRoomsOnly) => {
    get().fetchRooms({ myRoomsOnly, page: 1, search: "" });
  },

  /**
   * Clear error.
   */
  clearError: () => set({ error: null }),
}));

export default useRoomsStore;
