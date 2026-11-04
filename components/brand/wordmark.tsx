import styles from "./wordmark.module.css";

type WordmarkProps = {
  compact?: boolean;
};

export function Wordmark({ compact = false }: WordmarkProps) {
  return (
    <div className={`${styles.lockup} ${compact ? styles.compact : ""}`} role="img" aria-label="XINTU Color Intelligence Lab">
      <div className={styles.mark} aria-hidden="true">
        <span className={`${styles.word} ${styles.cobalt}`}>XINTU</span>
        <span className={`${styles.word} ${styles.vermilion}`}>XINTU</span>
        <span className={`${styles.word} ${styles.main}`}>
          X<span className={styles.i}>I</span>NTU
        </span>
        <span className={styles.seal}>X</span>
        <span className={styles.brushLine} />
      </div>
      <div className={styles.meta} aria-hidden="true">
        <span>COLOR INTELLIGENCE</span>
        <strong>XINTU LAB</strong>
        <span>BOUNDED AGENTIC / LOCAL PIXELS</span>
      </div>
    </div>
  );
}