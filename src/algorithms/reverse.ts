import type { AlgorithmStep, AlgorithmSolution } from '../types';

// 方法三：数组翻转
const generateSteps = (nums: number[], k: number): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const n = nums.length;
  const originalK = k;
  k = n === 0 ? 0 : k % n;
  
  if (k === 0 || n <= 1) {
    steps.push({
      id: 0,
      operation: 'done',
      narration: `有效轮转步数为 ${k} 且数组长度为 ${n}，所以数组无需改变。`,
      anchorIds: ['return'],
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
    operation: 'init',
    narration: originalK === k
      ? `右移 ${k} 格；下面用“三次翻转”一步步把这些数排到新位置。`
      : `右移 ${originalK} 格和右移 ${k} 格结果一样；每多走 ${n} 格都会绕回原位。`,
    anchorIds: ['normalize-k'],
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
      operation: 'init',
      narration: `${phase}：[${start}, ${end}]。从两端往中间配对交换；走到中间时，这一段就倒过来了。`,
      anchorIds: ['reverse-range'],
      guide: start === 0 && end === n - 1 ? {
        title: '为什么先整体倒过来？',
        message: `右移 ${k} 格，就是把最后 ${k} 个数搬到最前面。整体倒序会先把这 ${k} 个数送到前面；再分别倒回两段，让各段内部顺序恢复。`,
      } : undefined,
      description: `${phase}：翻转区间 [${start}, ${end}]`,
      codeLines: { java: [3, 4, 5, 6, 7], python: [3, 4, 5, 6], golang: [3, 4, 5, 6, 7], javascript: [3, 4, 5, 6, 7] },
      arrayState: [...result],
      highlightIndices: [start, end],
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
        operation: 'compare',
        narration: `翻转要让这段倒过来，所以把左边的 ${result[left]} 和右边的 ${result[right]} 对调；中间的数暂时不动。`,
        anchorIds: ['compare-ends'],
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
        operation: 'swap',
        narration: `两端已经换好。左边界向右一步、右边界向左一步，只处理还没配对的里面一段。`,
        anchorIds: ['swap-ends'],
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

      steps.push({
        id: steps.length,
        operation: 'move',
        narration: left < right
          ? `左右边界分别移动到 ${left} 和 ${right}，外侧这对已经处理完；接下来只交换新的对称位置。`
          : left === right
            ? `两个边界在索引 ${left} 相遇，中央元素不需要交换，这段翻转即将结束。`
            : `左边界 ${left} 已越过右边界 ${right}，说明所有成对位置都已处理完。`,
        anchorIds: ['advance-pointers'],
        description: `更新双指针：left=${left}, right=${right}`,
        codeLines: { java: [7, 8], python: [6], golang: [7, 8], javascript: [6, 7] },
        arrayState: [...result],
        highlightIndices: left <= right ? [left, right].filter((index, position, values) => position === 0 || index !== values[0]) : [],
        pointers: left <= right ? [
          { name: 'L', index: left, color: '#3b82f6' },
          { name: 'R', index: right, color: '#ef4444' },
        ] : undefined,
        variables: [
          { name: '左边界', value: left },
          { name: '右边界', value: right },
        ],
      });
    }

    steps.push({
      id: steps.length,
      operation: 'done',
      narration: `${phase}的对称位置已全部交换，因此该区间现在顺序反转。`,
      anchorIds: ['finish-reverse'],
      description: `${phase}完成`,
      codeLines: { java: [8], python: [6], golang: [8], javascript: [8] },
      arrayState: [...result],
      highlightIndices: [start, end],
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
    operation: 'done',
    narration: `三段翻转已完成，原数组现在向右轮转了 ${k} 位。`,
    anchorIds: ['return'],
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
