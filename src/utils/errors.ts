import { AxiosError } from 'axios';

/**
 * Formats an error from the Strava API or other sources into a user-friendly message
 * @param error - The error to format
 * @returns Formatted error message
 */
export function formatError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        return 'Authentication failed. Please check your Strava credentials.';
      }
      
      if (status === 403) {
        return 'Access forbidden. You may not have permission to perform this action.';
      }
      
      if (status === 404) {
        return 'Resource not found. The requested activity, athlete, or resource does not exist.';
      }
      
      if (status === 429) {
        return 'Rate limit exceeded. Please try again in a few minutes.';
      }
      
      if (data && typeof data === 'object') {
        if (data.message) {
          return `Strava API error: ${data.message}`;
        }
        if (data.errors) {
          return `Strava API error: ${JSON.stringify(data.errors)}`;
        }
      }
      
      return `Strava API error (${status}): ${error.message}`;
    }
    
    if (error.request) {
      return 'Network error: Unable to reach Strava API. Please check your internet connection.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return String(error);
}

/**
 * Wraps an async function to catch errors and format them
 * @param fn - The async function to wrap
 * @returns Wrapped function that handles errors gracefully
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw new Error(formatError(error));
    }
  };
}
