// Levenshtein distance calculation for string similarity
export const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
};

// Calculate similarity score (0-1, where 1 is exact match)
export const calculateSimilarity = (query: string, target: string): number => {
  const distance = levenshteinDistance(query.toLowerCase(), target.toLowerCase());
  const maxLength = Math.max(query.length, target.length);
  return maxLength === 0 ? 1 : 1 - (distance / maxLength);
};

// Check if query is a substring of target (case-insensitive)
export const isSubstring = (query: string, target: string): boolean => {
  return target.toLowerCase().includes(query.toLowerCase());
};

// Check if query starts with target (case-insensitive)
export const startsWith = (query: string, target: string): boolean => {
  return target.toLowerCase().startsWith(query.toLowerCase());
};

// Calculate relevance score for search results
export const calculateRelevanceScore = (query: string, target: string): number => {
  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();
  
  // Exact match gets highest score
  if (queryLower === targetLower) return 1.0;
  
  // Starts with query gets high score
  if (startsWith(queryLower, targetLower)) return 0.9;
  
  // Contains query as substring gets medium-high score
  if (isSubstring(queryLower, targetLower)) return 0.8;
  
  // Similarity based on edit distance
  const similarity = calculateSimilarity(queryLower, targetLower);
  
  // Boost similarity if it's above threshold
  if (similarity > 0.7) return similarity * 0.9;
  
  return similarity * 0.5;
};

// Filter and sort search results by relevance
export const filterAndSortResults = <T extends { id: string }>(
  items: T[],
  query: string,
  getSearchableText: (item: T) => string,
  minRelevanceScore: number = 0.3
): T[] => {
  if (!query.trim()) return items;

  const resultsWithScores = items
    .map(item => {
      const searchableText = getSearchableText(item);
      const relevanceScore = calculateRelevanceScore(query, searchableText);
      return { item, relevanceScore };
    })
    .filter(result => result.relevanceScore >= minRelevanceScore)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  return resultsWithScores.map(result => result.item);
};

// Quick filter for performance - checks if any word in query matches
export const quickFilter = <T>(
  items: T[],
  query: string,
  getSearchableText: (item: T) => string
): T[] => {
  if (!query.trim()) return items;
  
  const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  
  return items.filter(item => {
    const searchableText = getSearchableText(item).toLowerCase();
    return queryWords.some(word => 
      searchableText.includes(word) || 
      calculateSimilarity(word, searchableText) > 0.7
    );
  });
}; 