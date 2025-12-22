import { useEffect, useCallback } from 'react';
import type { AlgorithmSolution } from '../../types';
import styles from './AlgorithmModal.module.css';

interface AlgorithmModalProps {
  isOpen: boolean;
  onClose: () => void;
  solution: AlgorithmSolution;
}

export const AlgorithmModal: React.FC<AlgorithmModalProps> = ({
  isOpen,
  onClose,
  solution,
}) => {
  // ESC 关闭
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{solution.name}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.content}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>算法思路</h3>
            <p className={styles.description}>{solution.description}</p>
          </div>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>复杂度分析</h3>
            <div className={styles.complexity}>
              <div className={styles.complexityItem}>
                <span className={styles.complexityLabel}>时间复杂度</span>
                <span className={styles.complexityValue}>{solution.timeComplexity}</span>
              </div>
              <div className={styles.complexityItem}>
                <span className={styles.complexityLabel}>空间复杂度</span>
                <span className={styles.complexityValue}>{solution.spaceComplexity}</span>
              </div>
            </div>
          </div>
          {solution.id === 'extra-array' && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>详细说明</h3>
              <p className={styles.description}>
                使用额外的数组来将每个元素放至正确的位置。用 n 表示数组的长度，
                我们遍历原数组，将原数组下标为 i 的元素放至新数组下标为 (i+k)%n 的位置，
                最后将新数组拷贝至原数组即可。
              </p>
            </div>
          )}
          {solution.id === 'cycle-replace' && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>详细说明</h3>
              <p className={styles.description}>
                从位置 0 开始，将元素放至正确位置，被替换的元素保存在变量 temp 中。
                不断进行此过程，直到回到初始位置 0。由于可能有些数字还没有遍历到，
                需要从下一个数字开始重复此过程。总共需要 gcd(n,k) 轮遍历。
              </p>
            </div>
          )}
          {solution.id === 'reverse' && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>详细说明</h3>
              <p className={styles.description}>
                当我们将数组的元素向右移动 k 次后，尾部 k%n 个元素会移动至数组头部。
                我们可以先将所有元素翻转，这样尾部的 k%n 个元素就被移至数组头部，
                然后我们再翻转 [0, k%n-1] 区间的元素和 [k%n, n-1] 区间的元素即可。
              </p>
              <div className={styles.example}>
                <p>以 n=7, k=3 为例：</p>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>操作</th>
                      <th>结果</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>原始数组</td>
                      <td>[1, 2, 3, 4, 5, 6, 7]</td>
                    </tr>
                    <tr>
                      <td>翻转所有元素</td>
                      <td>[7, 6, 5, 4, 3, 2, 1]</td>
                    </tr>
                    <tr>
                      <td>翻转 [0, k-1]</td>
                      <td>[5, 6, 7, 4, 3, 2, 1]</td>
                    </tr>
                    <tr>
                      <td>翻转 [k, n-1]</td>
                      <td>[5, 6, 7, 1, 2, 3, 4]</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
