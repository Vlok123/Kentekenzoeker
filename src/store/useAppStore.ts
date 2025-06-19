import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProcessedVehicle, SearchFilters } from '@/types/rdw';
import type { User } from '@/types/auth';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface AppState {
  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Search state
  searchQuery: string;
  searchFilters: SearchFilters;
  searchResults: ProcessedVehicle[];
  isSearching: boolean;
  setSearchQuery: (query: string) => void;
  setSearchFilters: (filters: SearchFilters) => void;
  clearSearch: () => void;

  // Vehicle cache
  vehicleCache: Record<string, ProcessedVehicle>;
  addVehicleToCache: (kenteken: string, vehicle: ProcessedVehicle) => void;
  getVehicleFromCache: (kenteken: string) => ProcessedVehicle | null;

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
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Authentication
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  
  // Saved data
  savedSearches: any[];
  savedVehicles: any[];
  setSavedSearches: (searches: any[]) => void;
  setSavedVehicles: (vehicles: any[]) => void;
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
      searchQuery: '',
      searchFilters: {},
      searchResults: [],
      isSearching: false,
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchFilters: (filters) => set({ searchFilters: filters }),
      clearSearch: () => set({ searchQuery: '', searchFilters: {} }),

      // Vehicle cache
      vehicleCache: {},
      addVehicleToCache: (kenteken, vehicle) =>
        set((state) => ({
          vehicleCache: { ...state.vehicleCache, [kenteken]: vehicle },
        })),
      getVehicleFromCache: (kenteken) => get().vehicleCache[kenteken] || null,

      // Recent searches
      recentSearches: [],
      addRecentSearch: (kenteken) =>
        set((state) => {
          const filtered = state.recentSearches.filter(k => k !== kenteken);
          return {
            recentSearches: [kenteken, ...filtered].slice(0, 10),
          };
        }),
      clearRecentSearches: () => set({ recentSearches: [] }),

      // Favorites
      favorites: [],
      addFavorite: (kenteken) =>
        set((state) => ({
          favorites: [...state.favorites, kenteken],
        })),
      removeFavorite: (kenteken) =>
        set((state) => ({
          favorites: state.favorites.filter(k => k !== kenteken),
        })),
      isFavorite: (kenteken) => get().favorites.includes(kenteken),

      // UI state
      activeTab: 'trekgewicht',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Notifications
      notifications: [],
      addNotification: (notification) => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNotification = { ...notification, id };
        
        set((state) => ({
          notifications: [
            ...state.notifications,
            newNotification,
          ],
        }));

        // Auto-remove notification after duration (default 5 seconds)
        const duration = notification.duration || 5000;
        setTimeout(() => {
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id),
          }));
        }, duration);
      },
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id),
        })),
      clearNotifications: () => set({ notifications: [] }),

      // Authentication
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      logout: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false,
        savedSearches: [],
        savedVehicles: []
      }),

      // Saved data
      savedSearches: [],
      savedVehicles: [],
      setSavedSearches: (searches) => set({ savedSearches: searches }),
      setSavedVehicles: (vehicles) => set({ savedVehicles: vehicles }),
    }),
    {
      name: 'rdw-app-storage',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        searchFilters: state.searchFilters,
        recentSearches: state.recentSearches,
        favorites: state.favorites,
        activeTab: state.activeTab,
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
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