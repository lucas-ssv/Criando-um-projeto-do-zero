import Link from 'next/link';

import styles from './button-preview.module.scss';

export function ButtonPreview() {
  return (
    <div className={styles.contentButtonPreview}>
      <Link href="/api/exit-preview">
        <a className={styles.buttonPreview}>Sair do modo preview</a>
      </Link>
    </div>
  );
}
