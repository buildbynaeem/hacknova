import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface Suggestion {
  display: string;
  city?: string;
  pincode?: string;
  value: string;
}

interface AutocompleteInputProps {
  id?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: Suggestion) => void;
  type: 'city' | 'pincode';
  className?: string;
  countryCode?: string;
}

export function AutocompleteInput({
  id,
  placeholder,
  value,
  onChange,
  onSelect,
  type,
  className,
  countryCode = 'in',
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      // Use OpenStreetMap Nominatim API for suggestions
      const searchType = type === 'city' ? 'city' : 'postalcode';
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=${countryCode}&${searchType}=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();

      const formattedSuggestions: Suggestion[] = data.map((item: any) => {
        const address = item.address || {};
        const city = address.city || address.town || address.village || address.county || '';
        const pincode = address.postcode || '';
        const state = address.state || '';

        if (type === 'city') {
          return {
            display: city ? `${city}${state ? `, ${state}` : ''}` : item.display_name.split(',')[0],
            city: city || item.display_name.split(',')[0],
            pincode,
            value: city || item.display_name.split(',')[0],
          };
        } else {
          return {
            display: pincode ? `${pincode} - ${city || state}` : item.display_name,
            city,
            pincode: pincode || query,
            value: pincode || query,
          };
        }
      });

      // Remove duplicates
      const uniqueSuggestions = formattedSuggestions.filter(
        (suggestion, index, self) =>
          index === self.findIndex((s) => s.value === suggestion.value)
      );

      setSuggestions(uniqueSuggestions);
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [type, countryCode]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (suggestion: Suggestion) => {
    onChange(suggestion.value);
    onSelect?.(suggestion);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          className={className}
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.value}-${index}`}
              type="button"
              className={cn(
                "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors",
                highlightedIndex === index && "bg-muted"
              )}
              onClick={() => handleSelect(suggestion)}
            >
              {suggestion.display}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
