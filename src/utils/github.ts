import { getStarCache, saveStarCache, isStarCacheValid } from './indexedDB';

const GITHUB_REPO = 'fuck-algorithm/leetcode-189-rotate-array';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}`;

export const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO}`;

export const fetchGitHubStars = async (): Promise<number> => {
  // 先检查缓存
  const cache = await getStarCache();
  
  if (isStarCacheValid(cache)) {
    return cache!.count;
  }

  try {
    const response = await fetch(GITHUB_API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch GitHub stars');
    }
    const data = await response.json();
    const stars = data.stargazers_count || 0;
    
    // 保存到缓存
    await saveStarCache(stars);
    
    return stars;
  } catch (error) {
    console.error('Error fetching GitHub stars:', error);
    // 如果请求失败，返回缓存的值或默认值0
    return cache?.count || 0;
  }
};
