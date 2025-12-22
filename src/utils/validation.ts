// 验证输入数据是否合法
export const validateInput = (nums: number[], k: number): { valid: boolean; error?: string } => {
  // 检查数组长度
  if (nums.length < 1 || nums.length > 100000) {
    return { valid: false, error: '数组长度必须在 1 到 10^5 之间' };
  }

  // 检查数组元素范围
  const minVal = -(2 ** 31);
  const maxVal = 2 ** 31 - 1;
  for (const num of nums) {
    if (!Number.isInteger(num)) {
      return { valid: false, error: '数组元素必须是整数' };
    }
    if (num < minVal || num > maxVal) {
      return { valid: false, error: `数组元素必须在 ${minVal} 到 ${maxVal} 之间` };
    }
  }

  // 检查k的范围
  if (!Number.isInteger(k) || k < 0 || k > 100000) {
    return { valid: false, error: 'k 必须是 0 到 10^5 之间的非负整数' };
  }

  return { valid: true };
};

// 解析用户输入的数组字符串
export const parseArrayInput = (input: string): number[] | null => {
  try {
    // 移除空格
    const trimmed = input.trim();
    
    // 尝试解析JSON格式 [1,2,3]
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.every(n => typeof n === 'number')) {
        return parsed;
      }
    }
    
    // 尝试解析逗号分隔格式 1,2,3
    const parts = trimmed.split(',').map(s => s.trim());
    const nums = parts.map(s => {
      const n = Number(s);
      if (isNaN(n)) throw new Error('Invalid number');
      return n;
    });
    
    return nums;
  } catch {
    return null;
  }
};

// 生成随机合法数据
export const generateRandomData = (): { nums: number[]; k: number } => {
  // 随机数组长度 3-15
  const length = Math.floor(Math.random() * 13) + 3;
  
  // 生成随机数组
  const nums: number[] = [];
  for (let i = 0; i < length; i++) {
    // 生成 -99 到 99 之间的随机数
    nums.push(Math.floor(Math.random() * 199) - 99);
  }
  
  // 随机k值 0 到 length*2
  const k = Math.floor(Math.random() * (length * 2 + 1));
  
  return { nums, k };
};
