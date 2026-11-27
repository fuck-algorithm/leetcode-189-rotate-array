// 算法步骤类型
export type StepOperation = 'init' | 'read' | 'compare' | 'swap' | 'move' | 'copy' | 'done';

export interface AlgorithmStep {
  id: number;
  operation?: StepOperation;
  narration?: string;
  anchorIds?: string[];
  guide?: { title: string; message: string };
  description: string;
  // 代码行高亮 - 支持多语言
  codeLines: {
    java: number[];
    python: number[];
    golang: number[];
    javascript: number[];
  };
  // 数组状态
  arrayState: number[];
  // 高亮的索引
  highlightIndices: number[];
  // 特殊标记的索引（如交换位置）
  swapIndices?: number[];
  // 指针位置
  pointers?: {
    name: string;
    index: number;
    color: string;
  }[];
  // 临时变量
  variables?: {
    name: string;
    value: string | number;
  }[];
  // 动画类型
  animationType?: 'swap' | 'move' | 'highlight' | 'reverse' | 'copy';
  // 额外数组（用于方法一）
  extraArray?: number[];
  // 箭头指示
  arrows?: {
    from: number;
    to: number;
    fromArray?: 'nums' | 'newArr';
    toArray?: 'nums' | 'newArr';
    label?: string;
  }[];
}

// 算法解法类型
export interface AlgorithmSolution {
  id: string;
  name: string;
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
  code: {
    java: string;
    python: string;
    golang: string;
    javascript: string;
  };
  generateSteps: (nums: number[], k: number) => AlgorithmStep[];
}

// 编程语言类型
export type ProgrammingLanguage = 'java' | 'python' | 'golang' | 'javascript';

// 播放状态
export interface PlaybackState {
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  speed: number;
}

// 输入数据类型
export interface InputData {
  nums: number[];
  k: number;
}

// 样例数据
export interface SampleData {
  label: string;
  nums: number[];
  k: number;
}

// GitHub Star缓存
export interface StarCache {
  count: number;
  timestamp: number;
}
