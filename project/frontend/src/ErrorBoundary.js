import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="panel" style={{ backgroundColor: '#991b1b', padding: '20px', borderRadius: '8px' }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo.componentStack}
          </details>
          <button 
            className="button primary" 
            onClick={() => window.location.reload()}
            style={{ marginTop: '10px' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;