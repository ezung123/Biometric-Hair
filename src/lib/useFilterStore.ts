// ══════════════════════════════════════════════════════════════════════════════
// src/lib/useFilterStore.ts
// UNIFIED FILTER STORE WITH LOCAL PERSISTENCE
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import type { AudienceFilter, LengthFilter, FilterOptions } from './filterStyles';

const STORAGE_KEY_AUDIENCE = 'biometric_hair_filter_audience';
const STORAGE_KEY_LENGTH = 'biometric_hair_filter_length';

function getInitialFilters(): FilterOptions {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const savedAudience = window.localStorage.getItem(STORAGE_KEY_AUDIENCE) as AudienceFilter | null;
      const savedLength = window.localStorage.getItem(STORAGE_KEY_LENGTH) as LengthFilter | null;

      const audience: AudienceFilter =
        savedAudience === 'men' || savedAudience === 'women' || savedAudience === 'all'
          ? savedAudience
          : 'men';

      const length: LengthFilter =
        savedLength === 'short' || savedLength === 'medium' || savedLength === 'long' || savedLength === 'all'
          ? savedLength
          : 'all';

      return { audience, length };
    } catch {
      // Fallback on storage errors
    }
  }
  return { audience: 'men', length: 'all' };
}

export function useFilterStore() {
  const [filters, setFiltersState] = useState<FilterOptions>(getInitialFilters);

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY_AUDIENCE, filters.audience);
        window.localStorage.setItem(STORAGE_KEY_LENGTH, filters.length);
      } catch {
        // Ignore storage exceptions
      }
    }
  }, [filters]);

  const setAudience = useCallback((aud: AudienceFilter) => {
    setFiltersState((prev) => (prev.audience === aud ? prev : { ...prev, audience: aud }));
  }, []);

  const setLength = useCallback((len: LengthFilter) => {
    setFiltersState((prev) => (prev.length === len ? prev : { ...prev, length: len }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({ audience: 'all', length: 'all' });
  }, []);

  const isFiltered = filters.audience !== 'all' || filters.length !== 'all';

  return {
    filters,
    setAudience,
    setLength,
    resetFilters,
    isFiltered,
  };
}

