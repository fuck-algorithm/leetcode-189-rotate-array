import type { AlgorithmStep, AlgorithmSolution } from '../types';

// 计算最大公约数
const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b);
};

// 方法二：环状替换
const generateSteps = (nums: number[], k: number): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const n = nums.length;
  k = n === 0 ? 0 : k % n;
  
  if (k === 0 || n <= 1) {
    steps.push({
      id: 0,
      operation: 'done',
      narration: `有效轮转步数为 ${k} 且数组长度为 ${n}，所以数组无需改变。`,
      anchorIds: ['return'],
      description: `k=${k} 或数组长度为 ${n}，无需轮转`,
      codeLines: { java: [3], python: [2], golang: [3], javascript: [3] },
      arrayState: [...nums],
      highlightIndices: [],
    });
    return steps;
  }

  const result = [...nums];
  const count = gcd(k, n);
  
  // 初始状态
  steps.push({
    id: steps.length,
    operation: 'init',
    narration: `先计算 gcd(${k},${n})=${count} 个置换环，因为每个环都必须独立遍历。`,
    anchorIds: ['initialize-cycles'],
    description: `初始化：n=${n}, k=${k}, 需要 gcd(${k},${n})=${count} 轮遍历`,
    codeLines: { java: [3, 4, 5], python: [2, 3, 4], golang: [3, 4, 5], javascript: [3, 4, 5] },
    arrayState: [...result],
    highlightIndices: [],
    variables: [
      { name: 'n', value: n },
      { name: 'k', value: k },
      { name: 'count', value: count },
    ],
  });

  for (let start = 0; start < count; start++) {
    let current = start;
    let prev = result[start];
    
    steps.push({
      id: steps.length,
      operation: 'init',
      narration: `从未处理的下标 ${start} 开始新环，因为前面的置换环已各自回到起点。`,
      anchorIds: ['start-cycle'],
      description: `开始第 ${start + 1} 轮环状替换，起点 start=${start}`,
      codeLines: { java: [6, 7, 8], python: [5, 6, 7], golang: [6, 7, 8], javascript: [6, 7, 8] },
      arrayState: [...result],
      highlightIndices: [start],
      pointers: [{ name: 'start', index: start, color: '#10b981' }],
      variables: [
        { name: 'start', value: start },
        { name: 'current', value: current },
        { name: 'prev', value: prev },
      ],
    });

    do {
      const next = (current + k) % n;
      const temp = result[next];
      
      steps.push({
        id: steps.length,
        operation: 'read',
        narration: `先暂存 nums[${next}]=${temp}，因为即将写入该位置会覆盖原值。`,
        anchorIds: ['read-next', 'save-temp'],
        description: `计算下一个位置: next=(${current}+${k})%${n}=${next}，暂存 temp=nums[${next}]=${temp}`,
        codeLines: { java: [10, 11], python: [9, 10], golang: [10, 11], javascript: [10, 11] },
        arrayState: [...result],
        highlightIndices: [current, next],
        swapIndices: [current, next],
        pointers: [
          { name: 'current', index: current, color: '#3b82f6' },
          { name: 'next', index: next, color: '#f59e0b' },
        ],
        arrows: [{ from: current, to: next, label: `prev=${prev}` }],
        variables: [
          { name: 'current', value: current },
          { name: 'next', value: next },
          { name: 'prev', value: prev },
          { name: 'temp', value: temp },
        ],
      });

      result[next] = prev;
      
      steps.push({
        id: steps.length,
        operation: 'move',
        narration: `把 ${prev} 放到 nums[${next}]，因为该位置正是源元素右移 ${k} 位后的归属位置。`,
        anchorIds: ['write-next'],
        description: `将 prev=${prev} 放入 nums[${next}]`,
        codeLines: { java: [12], python: [11], golang: [12], javascript: [12] },
        arrayState: [...result],
        highlightIndices: [next],
        animationType: 'move',
        pointers: [{ name: 'next', index: next, color: '#f59e0b' }],
        variables: [
          { name: 'prev', value: prev },
          { name: 'temp', value: temp },
        ],
      });

      prev = temp;
      current = next;
      
      steps.push({
        id: steps.length,
        operation: 'move',
        narration: `沿置换环前进到下标 ${current}，因为下一轮要继续填补该位置。`,
        anchorIds: ['advance-cycle'],
        description: `更新: prev=${prev}, current=${current}`,
        codeLines: { java: [13, 14], python: [12, 13], golang: [13, 14], javascript: [13, 14] },
        arrayState: [...result],
        highlightIndices: [current],
        pointers: [{ name: 'current', index: current, color: '#3b82f6' }],
        variables: [
          { name: 'prev', value: prev },
          { name: 'current', value: current },
        ],
      });
    } while (start !== current);

    steps.push({
      id: steps.length,
      operation: 'done',
      narration: `第 ${start + 1} 个置换环回到起点 ${start}，因此这个环中的元素都已归位。`,
      anchorIds: ['finish-cycle'],
      description: `第 ${start + 1} 轮环状替换完成，回到起点 ${start}`,
      codeLines: { java: [15], python: [14], golang: [15], javascript: [15] },
      arrayState: [...result],
      highlightIndices: [start],
      pointers: [{ name: 'start', index: start, color: '#10b981' }],
    });
  }

  // 最终结果
  steps.push({
    id: steps.length,
    operation: 'done',
    narration: `所有 ${count} 个置换环均已完成，数组现在向右轮转了 ${k} 位。`,
    anchorIds: ['return'],
    description: `轮转完成！数组向右移动了 ${k} 位`,
    codeLines: { java: [16], python: [15], golang: [16], javascript: [16] },
    arrayState: [...result],
    highlightIndices: [],
  });

  return steps;
};

export const cycleReplaceSolution: AlgorithmSolution = {
  id: 'cycle-replace',
  name: '方法二：环状替换',
  description: '将被替换的元素保存在变量 temp 中，从位置 0 开始不断将元素放至正确位置，直到回到起点。需要 gcd(n,k) 轮遍历。',
  timeComplexity: 'O(n)',
  spaceComplexity: 'O(1)',
  code: {
    java: `public void rotate(int[] nums, int k) {
    int n = nums.length;
    k = k % n;
    int count = gcd(k, n);
    for (int start = 0; start < count; ++start) {
        int current = start;
        int prev = nums[start];
        do {
            int next = (current + k) % n;
            int temp = nums[next];
            nums[next] = prev;
            prev = temp;
            current = next;
        } while (start != current);
    }
}`,
    python: `def rotate(nums, k):
    n = len(nums)
    k = k % n
    count = gcd(k, n)
    for start in range(count):
        current = start
        prev = nums[start]
        while True:
            next_idx = (current + k) % n
            temp = nums[next_idx]
            nums[next_idx] = prev
            prev = temp
            current = next_idx
            if start == current:
                break`,
    golang: `func rotate(nums []int, k int) {
    n := len(nums)
    k = k % n
    count := gcd(k, n)
    for start := 0; start < count; start++ {
        current := start
        prev := nums[start]
        for {
            next := (current + k) % n
            temp := nums[next]
            nums[next] = prev
            prev = temp
            current = next
            if start == current { break }
        }
    }
}`,
    javascript: `function rotate(nums, k) {
    const n = nums.length;
    k = k % n;
    const count = gcd(k, n);
    for (let start = 0; start < count; start++) {
        let current = start;
        let prev = nums[start];
        do {
            const next = (current + k) % n;
            const temp = nums[next];
            nums[next] = prev;
            prev = temp;
            current = next;
        } while (start !== current);
    }
}`,
  },
  generateSteps,
};
