// Suppress development warnings in console
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args: any[]) => {
    // Suppress React DevTools warning
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Download the React DevTools')) {
      return;
    }
    
    // Suppress Clerk development warning
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Clerk has been loaded with development keys')) {
      return;
    }
    
    // Allow other warnings through
    originalWarn.apply(console, args);
  };
  
  console.error = (...args: any[]) => {
    // Suppress 429 errors from ImageKit in development
    if (args[0] && typeof args[0] === 'string' && args[0].includes('429') && args[0].includes('Too Many Requests')) {
      return;
    }
    
    // Allow other errors through
    originalError.apply(console, args);
  };
}
