import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import supabase from './supabaseClient';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      alert(error.message);
    } else {
      alert('Signup successful. Please check your email to confirm.');
      navigate('/login');
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Left panel */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-green-500 to-green-700 flex flex-col items-center justify-center text-white p-8">
        <h1 className="text-4xl font-extrabold mb-4 text-center">Create Your OnlyRepo Account</h1>
        <p className="text-lg md:text-xl text-center font-medium text-gray-100">
          Join and manage your files anywhere.
        </p>
      </div>

      {/* Right form */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-6">
        <form
          onSubmit={handleSignup}
          className="w-full max-w-md bg-white/90 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 space-y-6"
        >
          <h2 className="text-3xl font-bold text-center text-gray-800">Sign Up</h2>

          <input
            className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 transition"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 transition"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            className="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700 hover:scale-105 transition-transform duration-200"
            type="submit"
          >
            Sign Up
          </button>

          <p className="text-sm text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 hover:underline">
              Log In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Signup;