import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminRentals = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchRentals();
  }, [filter]);

  const fetchRentals = async () => {
    try {
      const url = filter ? `/api/admin/rentals?status=${filter}` : '/api/admin/rentals';
      const res = await axios.get(url);
      setRentals(res.data.data);
    } catch (error) {
      console.error('Error fetching rentals:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (rentalId, status) => {
    try {
      await axios.put(`/api/admin/rentals/${rentalId}/status`, { status });
      toast.success('Rental status updated!');
      fetchRentals();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      extended: 'bg-blue-100 text-blue-800',
      returning: 'bg-orange-100 text-orange-800',
      returned: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage Rentals</h1>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['pending', 'active', 'extended', 'returning', 'returned', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status === filter ? '' : status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : rentals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <div className="text-5xl mb-4">🔄</div>
            <h3 className="text-lg font-medium text-gray-900">No rentals found</h3>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rental ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rentals.map((rental) => (
                  <tr key={rental._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rental._id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <p>{rental.user?.name}</p>
                      <p className="text-gray-400">{rental.user?.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {rental.items?.map((item, idx) => (
                        <div key={idx}>{item.productName} (x{item.quantity})</div>
                      ))}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(rental.rentalStartDate).toLocaleDateString()} - {new Date(rental.rentalEndDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ₹{rental.totalPaid}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(rental.status)}`}>
                        {rental.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={rental.status}
                        onChange={(e) => updateStatus(rental._id, e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="extended">Extended</option>
                        <option value="returning">Returning</option>
                        <option value="returned">Returned</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="expired">Expired</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRentals;
