import { useState, useCallback } from 'react';
import { parseArrayInput, validateInput, generateRandomData } from '../../utils/validation';
import type { InputData, SampleData } from '../../types';
import styles from './DataInput.module.css';

const SAMPLE_DATA: SampleData[] = [
  { label: '示例1', nums: [1, 2, 3, 4, 5, 6, 7], k: 3 },
  { label: '示例2', nums: [-1, -100, 3, 99], k: 2 },
  { label: '小数组', nums: [1, 2], k: 1 },
  { label: '大K值', nums: [1, 2, 3, 4, 5], k: 12 },
];

interface DataInputProps {
  onDataChange: (data: InputData) => void;
  currentData: InputData;
}

export const DataInput: React.FC<DataInputProps> = ({ onDataChange, currentData }) => {
  const [arrayInput, setArrayInput] = useState(JSON.stringify(currentData.nums));
  const [kInput, setKInput] = useState(String(currentData.k));
  const [error, setError] = useState<string | null>(null);

  const handleApply = useCallback(() => {
    const nums = parseArrayInput(arrayInput);
    if (!nums) {
      setError('数组格式错误，请输入如 [1,2,3] 或 1,2,3');
      return;
    }

    const k = parseInt(kInput, 10);
    if (isNaN(k)) {
      setError('k 必须是整数');
      return;
    }

    const validation = validateInput(nums, k);
    if (!validation.valid) {
      setError(validation.error || '输入数据不合法');
      return;
    }

    setError(null);
    onDataChange({ nums, k });
  }, [arrayInput, kInput, onDataChange]);

  const handleSampleClick = useCallback((sample: SampleData) => {
    setArrayInput(JSON.stringify(sample.nums));
    setKInput(String(sample.k));
    setError(null);
    onDataChange({ nums: sample.nums, k: sample.k });
  }, [onDataChange]);

  const handleRandom = useCallback(() => {
    const { nums, k } = generateRandomData();
    setArrayInput(JSON.stringify(nums));
    setKInput(String(k));
    setError(null);
    onDataChange({ nums, k });
  }, [onDataChange]);

  return (
    <div className={styles.container}>
      <div className={styles.inputRow}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>nums =</label>
          <input
            type="text"
            value={arrayInput}
            onChange={(e) => setArrayInput(e.target.value)}
            className={styles.input}
            placeholder="[1,2,3,4,5,6,7]"
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>k =</label>
          <input
            type="number"
            value={kInput}
            onChange={(e) => setKInput(e.target.value)}
            className={styles.kInput}
            min="0"
          />
        </div>
        <button onClick={handleApply} className={styles.applyBtn}>
          应用
        </button>
        <button onClick={handleRandom} className={styles.randomBtn}>
          随机生成
        </button>
      </div>

      <div className={styles.samplesRow}>
        <span className={styles.samplesLabel}>样例：</span>
        {SAMPLE_DATA.map((sample, index) => (
          <button
            key={index}
            onClick={() => handleSampleClick(sample)}
            className={styles.sampleBtn}
          >
            {sample.label}
          </button>
        ))}
      </div>

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};
