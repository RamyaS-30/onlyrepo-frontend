import { useState } from 'react';
import supabase from './supabaseClient';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://onlyrepo-frontend.vercel.app/reset-password',
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Check your email for the password reset link.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleForgotPassword}
        className="bg-white p-6 rounded shadow-md w-full max-w-sm space-y-4"
      >
        <h2 className="text-2xl font-semibold text-center">Forgot Password</h2>
        <p className="text-sm text-gray-600 text-center">
          Enter your email to receive a password reset link.
        </p>

        <input
          className="w-full border p-2 rounded"
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          type="submit"
        >
          Send Reset Link
        </button>

        {message && <p className="text-sm text-green-600 text-center">{message}</p>}
      </form>
    </div>
  );
}

export default ForgotPassword;
