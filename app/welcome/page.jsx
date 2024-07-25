'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { gql, useMutation, useQuery } from '@apollo/client';

export const CREATEMEMBER = gql`
  mutation createmember(
    $firstName: String!
    $lastName: String!
    $email: String!
    $role: String!
    $managerId: ID!
  ) {
    createmember(
      input: {
        firstName: $firstName
        lastName: $lastName
        email: $email
        role: $role
        managerId: $managerId
      }
    ) {
      employee {
        id
        firstName
        lastName
        email
        role
      }
      errors
    }
  }
`;

export const GET_MEMBERS = gql`
  query getmembers($id: ID!) {
    getmembers(id: $id) {
      id
      firstName
      lastName
      email
      role
      passwordSet
    }
  }
`;

const Welcome = () => {
  const [message, setMessage] = useState('');
  const [current_user_id, setCurrentUserId] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'member',
  });
  const [createmember] = useMutation(CREATEMEMBER);
  const { data: membersData, refetch: refetchMembers } = useQuery(GET_MEMBERS, {
    variables: { id: current_user_id },
    skip: !current_user_id,
  });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchWelcomeMessage = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('http://localhost:3001/welcome', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          const newToken = response.headers.get('Authorization');
          if (newToken) {
            const tokenValue = newToken.split(' ')[1];
            localStorage.setItem('token', tokenValue);
          }

          setMessage(data.message);
          setCurrentUserId(data.current_user_id);
        } else {
          localStorage.removeItem('token');
          router.push('/login');
        }
      } catch (error) {
        setError('An error occurred');
      }
    };

    fetchWelcomeMessage();
  }, []);

  useEffect(() => {
    if (current_user_id) {
      refetchMembers();
    }
  }, [current_user_id, refetchMembers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const { firstName, lastName, email, role } = formData;
    if (!firstName || !lastName || !email || !role) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not Authenticated');
      return;
    }

    try {
      const { data } = await createmember({
        variables: {
          firstName,
          lastName,
          email,
          role,
          managerId: current_user_id,
        },
        context: {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
      });

      setIsModalOpen(false);
      setMessage('Member added successfully');
      refetchMembers();
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/login');
      alert('Some Problem Occur. Try Signing in Again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-center mx-auto">{message}</h1>
        {message && (
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {membersData && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold mb-4">Your Members</h3>
          <h2 className="text-lg font-medium mb-4 text-gray-500">Add and remove team members that will use OneWay</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {membersData.getmembers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{member.firstName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{member.lastName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{member.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{member.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-medium leading-5 rounded-full ${
                          member.passwordSet
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {member.passwordSet ? 'Accepted' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 mt-8 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Members
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">Add New Member</h2>
            <form>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700" htmlFor="firstName">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700" htmlFor="lastName">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700" htmlFor="role">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Create Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Welcome;
