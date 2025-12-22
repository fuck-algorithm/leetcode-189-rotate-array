import type { AlgorithmStep, AlgorithmSolution } from '../types';

// 方法三：数组翻转
const generateSteps = (nums: number[], k: number): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const n = nums.length;
  k = k % n;
  
  if (k === 0 || n <= 1) {
    steps.push({
      id: 0,
      description: `k=${k} 或数组长度为 ${n}，无需轮转`,
      codeLines: { java: [2], python: [2], golang: [2], javascript: [2] },
      arrayState: [...nums],
      highlightIndices: [],
    });
    return steps;
  }

  const result = [...nums];
  
  // 初始状态
  steps.push({
    id: steps.length,
    description: `初始化：数组长度 n=${n}，轮转步数 k=${k}`,
    codeLines: { java: [2], python: [2], golang: [2], javascript: [2] },
    arrayState: [...result],
    highlightIndices: [],
    variables: [
      { name: 'n', value: n },
      { name: 'k', value: k },
    ],
  });

  // 辅助函数：翻转数组的一部分并生成步骤
  const reverseWithSteps = (start: number, end: number, phase: string) => {
    steps.push({
      id: steps.length,
      description: `${phase}：翻转区间 [${start}, ${end}]`,
      codeLines: { java: [3, 4, 5, 6, 7], python: [3, 4, 5, 6], golang: [3, 4, 5, 6, 7], javascript: [3, 4, 5, 6, 7] },
      arrayState: [...result],
      highlightIndices: Array.from({ length: end - start + 1 }, (_, i) => start + i),
      pointers: [
        { name: 'start', index: start, color: '#3b82f6' },
        { name: 'end', index: end, color: '#ef4444' },
      ],
      animationType: 'reverse',
    });

    let left = start;
    let right = end;
    while (left < right) {
      // 交换前
      steps.push({
        id: steps.length,
        description: `交换 nums[${left}]=${result[left]} 和 nums[${right}]=${result[right]}`,
        codeLines: { java: [5], python: [5], golang: [5], javascript: [5] },
        arrayState: [...result],
        highlightIndices: [left, right],
        swapIndices: [left, right],
        pointers: [
          { name: 'L', index: left, color: '#3b82f6' },
          { name: 'R', index: right, color: '#ef4444' },
        ],
        arrows: [
          { from: left, to: right, label: '交换' },
        ],
        animationType: 'swap',
      });

      // 执行交换
      [result[left], result[right]] = [result[right], result[left]];
      
      // 交换后
      steps.push({
        id: steps.length,
        description: `交换完成：nums[${left}]=${result[left]}, nums[${right}]=${result[right]}`,
        codeLines: { java: [5, 6, 7], python: [5, 6], golang: [5, 6, 7], javascript: [5, 6, 7] },
        arrayState: [...result],
        highlightIndices: [left, right],
        pointers: [
          { name: 'L', index: left, color: '#3b82f6' },
          { name: 'R', index: right, color: '#ef4444' },
        ],
      });

      left++;
      right--;
    }

    steps.push({
      id: steps.length,
      description: `${phase}完成`,
      codeLines: { java: [8], python: [6], golang: [8], javascript: [8] },
      arrayState: [...result],
      highlightIndices: Array.from({ length: end - start + 1 }, (_, i) => start + i),
    });
  };

  // 第一步：翻转整个数组
  reverseWithSteps(0, n - 1, '第一步：翻转整个数组');

  // 第二步：翻转前k个元素
  reverseWithSteps(0, k - 1, '第二步：翻转前 k 个元素');

  // 第三步：翻转剩余元素
  reverseWithSteps(k, n - 1, '第三步：翻转剩余元素');

  // 最终结果
  steps.push({
    id: steps.length,
    description: `轮转完成！数组向右移动了 ${k} 位`,
    codeLines: { java: [12], python: [10], golang: [12], javascript: [12] },
    arrayState: [...result],
    highlightIndices: [],
  });

  return steps;
};

export const reverseSolution: AlgorithmSolution = {
  id: 'reverse',
  name: '方法三：数组翻转',
  description: '先将所有元素翻转，这样尾部的 k%n 个元素就被移至数组头部，然后分别翻转前 k 个元素和后 n-k 个元素。',
  timeComplexity: 'O(n)',
  spaceComplexity: 'O(1)',
  code: {
    java: `public void rotate(int[] nums, int k) {
    k %= nums.length;
    reverse(nums, 0, nums.length - 1);
    reverse(nums, 0, k - 1);
    reverse(nums, k, nums.length - 1);
}

private void reverse(int[] nums, int start, int end) {
    while (start < end) {
        int temp = nums[start];
        nums[start] = nums[end];
        nums[end] = temp;
        start++;
        end--;
    }
}`,
    python: `def rotate(nums, k):
    k %= len(nums)
    def reverse(start, end):
        while start < end:
            nums[start], nums[end] = nums[end], nums[start]
            start += 1
            end -= 1
    reverse(0, len(nums) - 1)
    reverse(0, k - 1)
    reverse(k, len(nums) - 1)`,
    golang: `func rotate(nums []int, k int) {
    k %= len(nums)
    reverse := func(start, end int) {
        for start < end {
            nums[start], nums[end] = nums[end], nums[start]
            start++
            end--
        }
    }
    reverse(0, len(nums)-1)
    reverse(0, k-1)
    reverse(k, len(nums)-1)
}`,
    javascript: `function rotate(nums, k) {
    k %= nums.length;
    const reverse = (start, end) => {
        while (start < end) {
            [nums[start], nums[end]] = [nums[end], nums[start]];
            start++;
            end--;
        }
    };
    reverse(0, nums.length - 1);
    reverse(0, k - 1);
    reverse(k, nums.length - 1);
}`,
  },
  generateSteps,
};
