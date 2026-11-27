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
    narration: `每个数向右走 ${k} 格，会沿固定路线绕圈。这个数组会分成 ${count} 个圈；沿圈搬运并回到起点时，这个圈就完成了。`,
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
      guide: start === 0 ? {
        title: '绕圈搬家：手里一次只拿一个数',
        message: `想象每个数都要搬到右边 ${k} 格。每一格可能被别的数占着，所以先记住那里的数，再把手里的数放进去；绕一圈回到起点，这一圈就完成了。`,
      } : undefined,
      description: `开始第 ${start + 1} 轮环状替换，起点 start=${start}`,
      codeLines: { java: [6, 7, 8], python: [5, 6, 7], golang: [6, 7, 8], javascript: [6, 7, 8] },
      arrayState: [...result],
      highlightIndices: [start],
      pointers: [{ name: 'start', index: start, color: '#10b981' }],
      variables: [
        { name: '本圈起点', value: start },
        { name: '当前索引', value: current },
        { name: '手里要放的数', value: prev },
      ],
    });

    do {
      const rawNext = current + k;
      const next = rawNext % n;
      const temp = result[next];

      steps.push({
        id: steps.length,
        operation: 'compare',
        narration: `从当前索引 ${current} 向右移动 ${k} 格，未取模的位置是 ${rawNext}；对数组长度 ${n} 取余后，目标位置为 ${next}。`,
        anchorIds: ['calculate-next', 'read-next'],
        description: `计算目标下标：(${current}+${k})%${n}=${next}`,
        codeLines: { java: [10], python: [9], golang: [10], javascript: [10] },
        arrayState: [...result],
        highlightIndices: [current, next],
        pointers: [
          { name: 'current', index: current, color: '#3b82f6' },
          { name: 'next', index: next, color: '#f59e0b' },
        ],
        arrows: [{ from: current, to: next, label: `右移 ${k} 格` }],
        variables: [
          { name: '当前索引', value: current },
          { name: '未取模位置', value: rawNext },
          { name: '目标索引', value: next },
        ],
      });

      steps.push({
        id: steps.length,
        operation: 'read',
        narration: `检查目标格 nums[${next}]，里面原本是 ${temp}。先读取并记住它，待会儿才能继续沿环搬运而不丢失这个数。`,
        guide: {
          title: '覆盖前先保住原值',
          message: `当前手里拿着 ${prev}，目标格里是 ${temp}。先把 ${temp} 暂存起来，再把 ${prev} 放进去。`,
        },
        anchorIds: ['read-next', 'save-temp'],
        description: `暂存目标位置原值：temp=nums[${next}]=${temp}`,
        codeLines: { java: [11], python: [10], golang: [11], javascript: [11] },
        arrayState: [...result],
        highlightIndices: [next],
        pointers: [{ name: 'next', index: next, color: '#f59e0b' }],
        arrows: [{ from: next, to: next, label: `暂存 ${temp}` }],
        variables: [
          { name: '目标索引', value: next },
          { name: '手里要放的数', value: prev },
          { name: '暂存的数', value: temp },
        ],
      });

      result[next] = prev;
      
      steps.push({
        id: steps.length,
        operation: 'move',
        narration: `把拿在手里的 ${prev} 放进索引 ${next}。它原来在 ${current}，向右数 ${k} 格正好到这里。`,
        anchorIds: ['write-next'],
        description: `将 prev=${prev} 放入 nums[${next}]`,
        codeLines: { java: [12], python: [11], golang: [12], javascript: [12] },
        arrayState: [...result],
        highlightIndices: [next],
        animationType: 'move',
        arrows: [{ from: current, to: next, label: `放入 ${prev}` }],
        guide: {
          title: `把 ${prev} 搬到它的新位置`,
          message: `它刚才在索引 ${current}，向右数 ${k} 格该到 ${next}。这个格子刚清空，可以放入 ${prev}。${temp} 还拿在手里，下一轮继续搬。`,
        },
        pointers: [{ name: 'next', index: next, color: '#f59e0b' }],
        variables: [
          { name: '手里要放的数', value: prev },
          { name: '刚拿出的数', value: temp },
        ],
      });

      prev = temp;
      current = next;
      
      steps.push({
        id: steps.length,
        operation: 'move',
        narration: `刚取出的数是 ${prev}，下一轮轮到它搬家。现在从索引 ${current} 继续，沿着同一条路线往右数 ${k} 格。`,
        anchorIds: ['advance-cycle'],
        description: `更新: prev=${prev}, current=${current}`,
        codeLines: { java: [13, 14], python: [12, 13], golang: [13, 14], javascript: [13, 14] },
        arrayState: [...result],
        highlightIndices: [current],
        pointers: [{ name: 'current', index: current, color: '#3b82f6' }],
        arrows: [{ from: next, to: current, label: `下一轮取回 ${prev}` }],
        variables: [
          { name: '已保存的值', value: prev },
          { name: '现在所在索引', value: current },
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
