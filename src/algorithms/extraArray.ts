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
  const result = [...nums];
  
  // 初始状态
  steps.push({
    id: steps.length,
    operation: 'init',
    narration: `下面的新数组先留出 ${n} 个空格。我们逐个看 nums 里的数，把它放到右移 ${k} 格后应该坐的位置。`,
    anchorIds: ['allocate-result'],
    guide: {
      title: '每个数向右搬 k 格',
      message: `当前第一个数 ${nums[0]} 从索引 0 出发，向右数 ${k} 格会到索引 ${k % n}。越过末尾就从索引 0 继续数。`,
    },
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

  // 逐个元素放置：先计算目标，再写入，明确展示索引映射过程。
  for (let i = 0; i < n; i++) {
    const rawIndex = i + k;
    const newIndex = rawIndex % n;
    const wrapped = rawIndex >= n;

    steps.push({
      id: steps.length,
      operation: 'read',
      narration: `现在读取 nums[${i}]，值是 ${nums[i]}。先计算它右移 ${k} 格后的下标：${i}+${k}=${rawIndex}。`,
      anchorIds: ['map-index'],
      description: `读取 nums[${i}]=${nums[i]}，计算未取模的新下标 ${i}+${k}=${rawIndex}`,
      codeLines: { java: [5], python: [4], golang: [5], javascript: [5] },
      arrayState: [...nums],
      highlightIndices: [i],
      extraArray: [...newArr] as number[],
      variables: [
        { name: '当前数', value: nums[i] },
        { name: '原位置', value: i },
        { name: '未取模下标', value: rawIndex },
      ],
    });

    steps.push({
      id: steps.length,
      operation: 'compare',
      narration: wrapped
        ? `下标 ${rawIndex} 超出数组末尾（最大下标是 ${n - 1}），需要从头绕回；${rawIndex}%${n}=${newIndex}。`
        : `下标 ${rawIndex} 还在数组范围 0 到 ${n - 1} 内，不需要绕回；${rawIndex}%${n}=${newIndex}。`,
      anchorIds: ['map-index', 'wrap-index'],
      description: `通过取模确定目标下标：(${i}+${k})%${n}=${newIndex}`,
      codeLines: { java: [6], python: [5], golang: [6], javascript: [6] },
      arrayState: [...nums],
      highlightIndices: [i],
      extraArray: [...newArr] as number[],
      variables: [
        { name: '未取模下标', value: rawIndex },
        { name: '数组长度', value: n },
        { name: '目标下标', value: newIndex },
      ],
    });

    newArr[newIndex] = nums[i];
    steps.push({
      id: steps.length,
      operation: 'move',
      narration: `把 ${nums[i]} 写入 newArr[${newIndex}]。原数组保持不变，下一轮再处理 nums[${i + 1}]。`,
      anchorIds: ['write-result'],
      description: `写入 newArr[${newIndex}]=nums[${i}]=${nums[i]}`,
      codeLines: { java: [6], python: [5], golang: [6], javascript: [6] },
      arrayState: [...nums],
      highlightIndices: [i],
      extraArray: [...newArr] as number[],
      arrows: [{ from: i, to: newIndex, label: `→ newArr[${newIndex}]` }],
      variables: [
        { name: '当前数', value: nums[i] },
        { name: '目标下标', value: newIndex },
        { name: '已放置', value: newArr.filter((value) => value !== null).length },
      ],
      animationType: 'copy',
    });
  }

  // 逐格复制回原数组，区分“读取结果”和“写回原数组”。
  for (let i = 0; i < n; i++) {
    steps.push({
      id: steps.length,
      operation: 'read',
      narration: `开始回填第 ${i} 格：读取 newArr[${i}]，它已经是轮转后应该放在这里的值 ${newArr[i]}。`,
      anchorIds: ['copy-result', 'read-result'],
      description: `读取 newArr[${i}]=${newArr[i]}，准备写回 nums[${i}]`,
      codeLines: { java: [8], python: [6], golang: [8], javascript: [7] },
      arrayState: [...result],
      highlightIndices: [i],
      extraArray: [...newArr] as number[],
      variables: [{ name: '回填索引', value: i }, { name: '待写回的值', value: newArr[i] as number }],
    });
    result[i] = newArr[i] as number;
    steps.push({
      id: steps.length,
      operation: 'copy',
      narration: `将 ${result[i]} 写入 nums[${i}]。完成 ${i + 1}/${n} 格；其余位置稍后逐格回填。`,
      anchorIds: ['copy-result', 'write-original'],
      description: `写回 nums[${i}]=newArr[${i}]=${result[i]}`,
      codeLines: { java: [8], python: [6], golang: [8], javascript: [7] },
      arrayState: [...result],
      highlightIndices: [i],
      extraArray: [...newArr] as number[],
      variables: [{ name: '已回填', value: `${i + 1}/${n}` }, { name: '当前值', value: result[i] }],
      animationType: 'copy',
    });
  }

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
