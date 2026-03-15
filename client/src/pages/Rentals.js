import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Rentals = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    fetchRentals();
  }, [activeTab]);

  const fetchRentals = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'active' ? '/api/rentals/active' : '/api/rentals/history';
      const res = await axios.get(endpoint);
      setRentals(res.data.data);
    } catch (error) {
      console.error('Error fetching rentals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      extended: 'bg-blue-100 text-blue-800',
      returning: 'bg-orange-100 text-orange-800',
      returned: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Rentals</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'active'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Active Rentals
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Rental History
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : rentals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No {activeTab} rentals</h3>
            <p className="text-gray-600 mb-4">
              {activeTab === 'active' 
                ? "You don't have any active rentals yet" 
                : "Your rental history will appear here"}
            </p>
            {activeTab === 'active' && (
              <Link
                to="/products"
                className="inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700"
              >
                Browse Products
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {rentals.map((rental) => (
              <div key={rental._id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Products */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="flex -space-x-2">
                        {rental.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-white overflow-hidden">
                            {item.productImage ? (
                              <img src={item.productImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        ))}
                        {rental.items.length > 3 && (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-white flex items-center justify-center text-sm text-gray-500">
                            +{rental.items.length - 3}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {rental.items[0]?.productName}
                          {rental.items.length > 1 && ` and ${rental.items.length - 1} more`}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(rental.rentalStartDate).toLocaleDateString()} - {new Date(rental.rentalEndDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex flex-col md:items-end gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(rental.status)}`}>
                      {rental.status}
                    </span>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Paid</p>
                      <p className="text-xl font-bold text-gray-900">₹{rental.totalPaid}</p>
                    </div>
                    <Link
                      to={`/rentals/${rental._id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Rentals;
