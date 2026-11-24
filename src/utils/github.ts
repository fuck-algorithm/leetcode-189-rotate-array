import { getStarCache, saveStarCache, isStarCacheValid } from './indexedDB';

const GITHUB_REPO = 'fuck-algorithm/leetcode-189-rotate-array';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}`;

export const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO}`;

export const fetchGitHubStars = async (): Promise<number> => {
  let cache = null;
  try {
    cache = await getStarCache();
    if (isStarCacheValid(cache)) return cache!.count;
  } catch (error) {
    console.error('Error reading GitHub star cache:', error);
  }

  try {
    const response = await fetch(GITHUB_API_URL);
    if (!response.ok) throw new Error('Failed to fetch GitHub stars');
    const data = await response.json();
    const stars = data.stargazers_count || 0;
    await saveStarCache(stars);
    return stars;
  } catch (error) {
    console.error('Error fetching GitHub stars:', error);
    return cache?.count || 0;
  }
};
