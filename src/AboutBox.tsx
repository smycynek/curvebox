import { createSignal, Show } from 'solid-js';

import { Portal } from 'solid-js/web';
import styles from './App.module.css';
import { version } from './version';
export const AboutBox = () => {
  const [isOpen, setIsOpen] = createSignal(false);
  const closeDialog = () => setIsOpen(false);
  return (
    <>
      <button class={styles.aboutLink} onClick={() => setIsOpen(true)}>
        About...
      </button>
      <span>v{version}</span>
      <Show when={isOpen()}>
        <Portal>
          <div class={styles.aboutDialogBackground} onClick={closeDialog}>
            <div
              class={styles.aboutDialog}
              onClick={(e) => e.stopPropagation()} // Don't close clicking inside dialog
            >
              <button class={styles.closeDialogButton} onClick={closeDialog}>
                X
              </button>
              <h1>About Curve Box</h1>
            </div>
          </div>
        </Portal>
      </Show>
    </>
  );
};
