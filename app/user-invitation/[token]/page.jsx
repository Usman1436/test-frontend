'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { gql, useMutation } from '@apollo/client';
import Link from 'next/link';

const UPDATE_PASSWORD = gql`
  mutation updatepassword($id: ID!, $password: String!) {
    updatepassword(input: { id: $id, password: $password }) {
      user {
        id
        email
      }
      errors
      token
    }
  }
`;

const UserInvitation = () => {
  const [message, setMessage] = useState('');
  const [current_user_id, setCurrentUserId] = useState('');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatepassword] = useMutation(UPDATE_PASSWORD);
  const router = useRouter();
  const { token } = useParams();

  useEffect(() => {
    const checkInvitationToken = async () => {
      if (!token) {
        setError('No token found');
        return;
      }
      try {
        const response = await fetch('http://localhost:3001/invitation', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
  
        if (response.ok) {
          const data = await response.json();
          setMessage(data.message);
          setCurrentUserId(data.current_user_id);
        } else {
          router.push('/signup');
        }
      } catch (error) {
        setError('An error occurred');
      }
    };
  
    checkInvitationToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const { data } = await updatepassword({
        variables: {
          id: current_user_id,
          password: password,
        },
      });
      if (data.updatepassword.token) {
        localStorage.setItem('token', data.updatepassword.token);
        router.push('/welcome');
      } else {
        setError('Password not set, something went wrong');
      }
    } catch (error) {
      setError('An error occurred');
    }
  };

  return (
    <>
      { message && (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
          <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Setup Your Account</h2>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {password !== confirmPassword && (
                <p className="text-red-500 mb-4 text-center">Passwords do not match</p>
              )}
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={password !== confirmPassword || password === ''}
              >
                Accept Invitation
              </button>
            </form>
            <p className="mt-4 text-center text-gray-600">
              Already a member? <Link href="/login" className="text-blue-500 hover:underline">Login</Link>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default UserInvitation;
