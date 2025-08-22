// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock document.visibilityState to fix Supabase warning in Jest environment
Object.defineProperty(document, 'visibilityState', {
  value: 'visible',
  writable: true,
});