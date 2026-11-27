import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  useSearchStore,
  durationToBucket,
  isEmptySnapshot,
  MAX_RECENT_SEARCHES,
  DEFAULT_PRICE_RANGE,
  type SearchSnapshot,
} from './use-search-store';

describe('use-search-store', () => {
  beforeEach(() => {
    localStorage.clear();
    useSearchStore.setState({
      query: '',
      sortBy: 'relevance',
      selectedCategories: [],
      selectedLevels: [],
      selectedDurations: [],
      priceRange: DEFAULT_PRICE_RANGE,
      minRating: 0,
      recentSearches: [],
      savedSearches: [],
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('durationToBucket', () => {
    it('maps boundary values correctly', () => {
      expect(durationToBucket(0)).toBe('short');
      expect(durationToBucket(179)).toBe('short');
      expect(durationToBucket(180)).toBe('medium');
      expect(durationToBucket(599)).toBe('medium');
      expect(durationToBucket(600)).toBe('medium');
      expect(durationToBucket(601)).toBe('long');
      expect(durationToBucket(1000)).toBe('long');
    });
  });

  describe('isEmptySnapshot', () => {
    it('returns true for an untouched snapshot', () => {
      const snap: SearchSnapshot = {
        query: '',
        sortBy: 'relevance',
        selectedCategories: [],
        selectedLevels: [],
        selectedDurations: [],
        priceRange: DEFAULT_PRICE_RANGE,
        minRating: 0,
      };
      expect(isEmptySnapshot(snap)).toBe(true);
    });

    it('returns false when query is non-empty', () => {
      const snap: SearchSnapshot = {
        query: 'react',
        sortBy: 'relevance',
        selectedCategories: [],
        selectedLevels: [],
        selectedDurations: [],
        priceRange: DEFAULT_PRICE_RANGE,
        minRating: 0,
      };
      expect(isEmptySnapshot(snap)).toBe(false);
    });

    it('returns false when any filter is active', () => {
      expect(
        isEmptySnapshot({
          query: '',
          sortBy: 'relevance',
          selectedCategories: ['Dev'],
          selectedLevels: [],
          selectedDurations: [],
          priceRange: DEFAULT_PRICE_RANGE,
          minRating: 0,
        }),
      ).toBe(false);

      expect(
        isEmptySnapshot({
          query: '',
          sortBy: 'relevance',
          selectedCategories: [],
          selectedLevels: ['Beginner'],
          selectedDurations: [],
          priceRange: DEFAULT_PRICE_RANGE,
          minRating: 0,
        }),
      ).toBe(false);

      expect(
        isEmptySnapshot({
          query: '',
          sortBy: 'relevance',
          selectedCategories: [],
          selectedLevels: [],
          selectedDurations: ['short'],
          priceRange: DEFAULT_PRICE_RANGE,
          minRating: 0,
        }),
      ).toBe(false);

      expect(
        isEmptySnapshot({
          query: '',
          sortBy: 'relevance',
          selectedCategories: [],
          selectedLevels: [],
          selectedDurations: [],
          priceRange: { min: 10, max: null },
          minRating: 0,
        }),
      ).toBe(false);

      expect(
        isEmptySnapshot({
          query: '',
          sortBy: 'relevance',
          selectedCategories: [],
          selectedLevels: [],
          selectedDurations: [],
          priceRange: DEFAULT_PRICE_RANGE,
          minRating: 4,
        }),
      ).toBe(false);
    });
  });

  describe('activeFilterCount', () => {
    it('ignores query and sortBy in count', () => {
      const store = useSearchStore.getState();
      expect(store.activeFilterCount()).toBe(0);

      store.setQuery('soroban');
      store.setSortBy('price-low');
      expect(useSearchStore.getState().activeFilterCount()).toBe(0);
    });

    it('increments count for each active filter type', () => {
      const store = useSearchStore.getState();

      store.toggleCategory('Design');
      expect(useSearchStore.getState().activeFilterCount()).toBe(1);

      store.toggleCategory('Development');
      expect(useSearchStore.getState().activeFilterCount()).toBe(2);

      store.toggleLevel('Intermediate');
      expect(useSearchStore.getState().activeFilterCount()).toBe(3);

      store.toggleDuration('medium');
      expect(useSearchStore.getState().activeFilterCount()).toBe(4);

      store.setMinRating(3.5);
      expect(useSearchStore.getState().activeFilterCount()).toBe(5);

      store.setPriceRange({ min: 10, max: 50 });
      expect(useSearchStore.getState().activeFilterCount()).toBe(6);

      store.clearFilters();
      expect(useSearchStore.getState().activeFilterCount()).toBe(0);
    });
  });

  describe('addRecentSearch & clearHistory', () => {
    it('does not add recent search when snapshot is empty', () => {
      const store = useSearchStore.getState();
      store.addRecentSearch();
      expect(useSearchStore.getState().recentSearches).toHaveLength(0);
    });

    it('caps recent searches at MAX_RECENT_SEARCHES (5) and keeps newest first', () => {
      const queries = ['search-1', 'search-2', 'search-3', 'search-4', 'search-5', 'search-6'];

      queries.forEach((q) => {
        useSearchStore.getState().setQuery(q);
        useSearchStore.getState().addRecentSearch();
      });

      const { recentSearches } = useSearchStore.getState();
      expect(recentSearches).toHaveLength(MAX_RECENT_SEARCHES);
      expect(recentSearches[0].query).toBe('search-6');
      expect(recentSearches[1].query).toBe('search-5');
      expect(recentSearches[2].query).toBe('search-4');
      expect(recentSearches[3].query).toBe('search-3');
      expect(recentSearches[4].query).toBe('search-2');
    });

    it('deduplicates recent searches when identical query and filters are added', () => {
      useSearchStore.getState().setQuery('stellar');
      useSearchStore.getState().addRecentSearch();

      useSearchStore.getState().setQuery('rust');
      useSearchStore.getState().addRecentSearch();

      useSearchStore.getState().setQuery('stellar');
      useSearchStore.getState().addRecentSearch();

      const { recentSearches } = useSearchStore.getState();
      expect(recentSearches).toHaveLength(2);
      expect(recentSearches[0].query).toBe('stellar');
      expect(recentSearches[1].query).toBe('rust');
    });

    it('clears history with clearHistory', () => {
      useSearchStore.getState().setQuery('stellar');
      useSearchStore.getState().addRecentSearch();
      expect(useSearchStore.getState().recentSearches).toHaveLength(1);

      useSearchStore.getState().clearHistory();
      expect(useSearchStore.getState().recentSearches).toHaveLength(0);
    });
  });

  describe('savedSearches', () => {
    it('saves and removes searches', () => {
      useSearchStore.getState().setQuery('soroban contracts');
      useSearchStore.getState().toggleCategory('Development');
      useSearchStore.getState().saveSearch('My Dev Search');

      const saved = useSearchStore.getState().savedSearches;
      expect(saved).toHaveLength(1);
      expect(saved[0].name).toBe('My Dev Search');
      expect(saved[0].query).toBe('soroban contracts');
      expect(saved[0].selectedCategories).toEqual(['Development']);

      useSearchStore.getState().removeSavedSearch(saved[0].id);
      expect(useSearchStore.getState().savedSearches).toHaveLength(0);
    });
  });

  describe('applySearch', () => {
    it('restores all snapshot fields into the active search state', () => {
      const snap: SearchSnapshot = {
        query: 'advanced rust',
        sortBy: 'rating',
        selectedCategories: ['Programming', 'Security'],
        selectedLevels: ['Advanced'],
        selectedDurations: ['long'],
        priceRange: { min: 25, max: 100 },
        minRating: 4.5,
      };

      useSearchStore.getState().applySearch(snap);

      const state = useSearchStore.getState();
      expect(state.query).toBe(snap.query);
      expect(state.sortBy).toBe(snap.sortBy);
      expect(state.selectedCategories).toEqual(snap.selectedCategories);
      expect(state.selectedLevels).toEqual(snap.selectedLevels);
      expect(state.selectedDurations).toEqual(snap.selectedDurations);
      expect(state.priceRange).toEqual(snap.priceRange);
      expect(state.minRating).toBe(snap.minRating);
    });
  });
});
