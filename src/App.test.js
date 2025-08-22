import { render, screen } from '@testing-library/react';
import App from './App';

test('renders loading initially', () => {
  render(<App />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});

test('redirects unauthenticated user to login page', async () => {
  render(<App />);
  
  // Target the heading
  const loginHeading = await screen.findByRole('heading', { name: /log in/i });
  expect(loginHeading).toBeInTheDocument();
});