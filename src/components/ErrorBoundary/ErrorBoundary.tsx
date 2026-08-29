import { Component, type ErrorInfo, type ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in app:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.page}>
          <div className={styles.card}>
            <div className={styles.title}>Что-то пошло не так</div>
            <p className={styles.text}>Попробуй перезапустить приложение.</p>
            <button type="button" className={styles.button} onClick={() => window.location.reload()}>
              Перезапустить
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
