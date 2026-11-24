import type { AlgorithmStep, AlgorithmSolution } from '../types';

// 方法一：使用额外的数组
const generateSteps = (nums: number[], k: number): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const n = nums.length;
  k = n === 0 ? 0 : k % n;
  
  if (k === 0 || n <= 1) {
    steps.push({
      id: 0,
      operation: 'done',
      narration: `数组长度为 ${n} 且有效轮转步数为 ${k}，因此无需移动元素即可得到最终结果。`,
      anchorIds: ['return'],
      description: `k=${k} 或数组长度为 ${n}，无需轮转`,
      codeLines: { java: [3], python: [2], golang: [3], javascript: [3] },
      arrayState: [...nums],
      highlightIndices: [],
    });
    return steps;
  }

  const newArr: (number | null)[] = new Array(n).fill(null);
  
  // 初始状态
  steps.push({
    id: steps.length,
    operation: 'init',
    narration: `先建立长度为 ${n} 的结果数组，因为每个原元素都要被映射到唯一的新下标。`,
    anchorIds: ['allocate-result'],
    description: `初始化：数组长度 n=${n}，轮转步数 k=${k}`,
    codeLines: { java: [3, 4], python: [2, 3], golang: [3, 4], javascript: [3, 4] },
    arrayState: [...nums],
    highlightIndices: [],
    extraArray: [...newArr] as number[],
    variables: [
      { name: 'n', value: n },
      { name: 'k', value: k },
    ],
  });

  // 逐个元素放置
  for (let i = 0; i < n; i++) {
    const newIndex = (i + k) % n;
    newArr[newIndex] = nums[i];
    
    steps.push({
      id: steps.length,
      operation: 'move',
      narration: `把 nums[${i}]=${nums[i]} 写入 newArr[${newIndex}]，因为右移 ${k} 位后目标下标按数组长度取模。`,
      anchorIds: ['map-index', 'write-result'],
      description: `将 nums[${i}]=${nums[i]} 放到新数组位置 (${i}+${k})%${n}=${newIndex}`,
      codeLines: { java: [5, 6], python: [4, 5], golang: [5, 6], javascript: [5, 6] },
      arrayState: [...nums],
      highlightIndices: [i],
      extraArray: [...newArr] as number[],
      arrows: [{ from: i, to: newIndex, label: `→ newArr[${newIndex}]` }],
      variables: [
        { name: 'i', value: i },
        { name: 'newIndex', value: newIndex },
      ],
      animationType: 'copy',
    });
  }

  // 拷贝回原数组
  steps.push({
    id: steps.length,
    operation: 'copy',
    narration: `所有 ${n} 个新位置都已填入，接着把结果复制回 nums，让原数组承载轮转后的顺序。`,
    anchorIds: ['copy-result'],
    description: '将新数组拷贝回原数组',
    codeLines: { java: [7, 8], python: [6], golang: [7, 8], javascript: [7] },
    arrayState: newArr as number[],
    highlightIndices: n > 2 ? [0, 1] : Array.from({ length: n }, (_, i) => i),
    extraArray: newArr as number[],
    animationType: 'copy',
  });

  // 最终结果
  steps.push({
    id: steps.length,
    operation: 'done',
    narration: `每个元素都已向右轮转 ${k} 位，结果数组现在与题目要求一致。`,
    anchorIds: ['return'],
    description: `轮转完成！数组向右移动了 ${k} 位`,
    codeLines: { java: [8], python: [6], golang: [8], javascript: [7] },
    arrayState: newArr as number[],
    highlightIndices: [],
  });

  return steps;
};

export const extraArraySolution: AlgorithmSolution = {
  id: 'extra-array',
  name: '方法一：使用额外的数组',
  description: '使用额外的数组来将每个元素放至正确的位置。将原数组下标为 i 的元素放至新数组下标为 (i+k)%n 的位置。',
  timeComplexity: 'O(n)',
  spaceComplexity: 'O(n)',
  code: {
    java: `public void rotate(int[] nums, int k) {
    int n = nums.length;
    k = k % n;
    int[] newArr = new int[n];
    for (int i = 0; i < n; ++i) {
        newArr[(i + k) % n] = nums[i];
    }
    System.arraycopy(newArr, 0, nums, 0, n);
}`,
    python: `def rotate(nums, k):
    n = len(nums)
    k = k % n
    new_arr = [0] * n
    for i in range(n):
        new_arr[(i + k) % n] = nums[i]
    nums[:] = new_arr`,
    golang: `func rotate(nums []int, k int) {
    n := len(nums)
    k = k % n
    newArr := make([]int, n)
    for i := 0; i < n; i++ {
        newArr[(i+k)%n] = nums[i]
    }
    copy(nums, newArr)
}`,
    javascript: `function rotate(nums, k) {
    const n = nums.length;
    k = k % n;
    const newArr = new Array(n);
    for (let i = 0; i < n; i++) {
        newArr[(i + k) % n] = nums[i];
    }
    nums.splice(0, n, ...newArr);
}`,
  },
  generateSteps,
};
