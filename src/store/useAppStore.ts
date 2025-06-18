import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProcessedVehicle, SearchFilters } from '@/types/rdw';

interface AppState {
  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Search state
  searchFilters: SearchFilters;
  searchResults: ProcessedVehicle[];
  isSearching: boolean;
  searchQuery: string;
  setSearchFilters: (filters: SearchFilters) => void;
  setSearchResults: (results: ProcessedVehicle[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;

  // Vehicle cache
  vehicleCache: Map<string, ProcessedVehicle>;
  addVehicleToCache: (kenteken: string, vehicle: ProcessedVehicle) => void;
  getVehicleFromCache: (kenteken: string) => ProcessedVehicle | undefined;

  // Recent searches
  recentSearches: string[];
  addRecentSearch: (kenteken: string) => void;
  clearRecentSearches: () => void;

  // Favorites
  favorites: string[];
  addFavorite: (kenteken: string) => void;
  removeFavorite: (kenteken: string) => void;
  isFavorite: (kenteken: string) => boolean;

  // UI state
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: Date;
  }>;
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      isDarkMode: false,
      toggleDarkMode: () => {
        set((state) => ({ isDarkMode: !state.isDarkMode }));
        // Update document class for Tailwind dark mode
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark');
        }
      },

      // Search state
      searchFilters: {},
      searchResults: [],
      isSearching: false,
      searchQuery: '',
      setSearchFilters: (filters) => set({ searchFilters: filters }),
      setSearchResults: (results) => set({ searchResults: results }),
      setIsSearching: (isSearching) => set({ isSearching }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      clearSearch: () => set({ 
        searchFilters: {}, 
        searchResults: [], 
        searchQuery: '',
        isSearching: false 
      }),

      // Vehicle cache
      vehicleCache: new Map(),
      addVehicleToCache: (kenteken, vehicle) => {
        const cache = new Map(get().vehicleCache);
        cache.set(kenteken, vehicle);
        set({ vehicleCache: cache });
      },
      getVehicleFromCache: (kenteken) => {
        return get().vehicleCache.get(kenteken);
      },

      // Recent searches
      recentSearches: [],
      addRecentSearch: (kenteken) => {
        const current = get().recentSearches;
        const filtered = current.filter(k => k !== kenteken);
        const updated = [kenteken, ...filtered].slice(0, 10); // Keep max 10 recent searches
        set({ recentSearches: updated });
      },
      clearRecentSearches: () => set({ recentSearches: [] }),

      // Favorites
      favorites: [],
      addFavorite: (kenteken) => {
        const current = get().favorites;
        if (!current.includes(kenteken)) {
          set({ favorites: [...current, kenteken] });
        }
      },
      removeFavorite: (kenteken) => {
        const current = get().favorites;
        set({ favorites: current.filter(k => k !== kenteken) });
      },
      isFavorite: (kenteken) => {
        return get().favorites.includes(kenteken);
      },

      // UI state
      activeTab: 'trekgewicht',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Notifications
      notifications: [],
      addNotification: (notification) => {
        const id = Date.now().toString();
        const newNotification = {
          ...notification,
          id,
          timestamp: new Date(),
        };
        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));

        // Auto remove after 5 seconds for non-error notifications
        if (notification.type !== 'error') {
          setTimeout(() => {
            get().removeNotification(id);
          }, 5000);
        }
      },
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id),
        }));
      },
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'rdw-app-storage',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        searchFilters: state.searchFilters,
        recentSearches: state.recentSearches,
        favorites: state.favorites,
        activeTab: state.activeTab,
      }),
    }
  )
);

// Initialize dark mode on load
if (typeof document !== 'undefined') {
  const isDark = useAppStore.getState().isDarkMode;
  if (isDark) {
    document.documentElement.classList.add('dark');
  }
} 