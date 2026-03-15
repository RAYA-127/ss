import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const RentalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [extendMonths, setExtendMonths] = useState(3);
  const [pickupDate, setPickupDate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRental();
  }, [id]);

  const fetchRental = async () => {
    try {
      const res = await axios.get(`/api/rentals/${id}`);
      setRental(res.data.data);
      
      // Set minimum pickup date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setPickupDate(tomorrow.toISOString().split('T')[0]);
    } catch (error) {
      toast.error('Rental not found');
      navigate('/rentals');
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async () => {
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/rentals/${id}/extend`, { additionalMonths: extendMonths });
      if (res.data.success) {
        toast.success('Rental extended successfully!');
        setShowExtendModal(false);
        fetchRental();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to extend rental');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSchedulePickup = async () => {
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/rentals/${id}/schedule-pickup`, { pickupDate });
      if (res.data.success) {
        toast.success('Pickup scheduled successfully!');
        setShowPickupModal(false);
        fetchRental();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule pickup');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      extended: 'bg-blue-100 text-blue-800',
      returning: 'bg-orange-100 text-orange-800',
      returned: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!rental) return null;

  const daysRemaining = Math.ceil((new Date(rental.rentalEndDate) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button onClick={() => navigate('/rentals')} className="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center">
            ← Back to Rentals
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rental Details</h1>
              <p className="text-gray-500">Order #{rental.order?.orderNumber || 'N/A'}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadge(rental.status)}`}>
              {rental.status}
            </span>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Rental Period */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Rental Period</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium text-gray-900">{new Date(rental.rentalStartDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="font-medium text-gray-900">{new Date(rental.rentalEndDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Days Remaining</p>
                <p className="font-medium text-gray-900">{daysRemaining > 0 ? daysRemaining : 0} days</p>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Products</h3>
            <div className="space-y-4">
              {rental.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-white rounded-lg overflow-hidden">
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
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.productName}</h4>
                    <p className="text-sm text-gray-500">Qty: {item.quantity} | {item.tenureMonths} months</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{item.totalRent}</p>
                    <p className="text-sm text-gray-500">₹{item.monthlyRent}/month</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Delivery Address</h3>
            <p className="text-gray-600">
              {rental.deliveryAddress?.street}, {rental.deliveryAddress?.city}, {rental.deliveryAddress?.state} - {rental.deliveryAddress?.pincode}
            </p>
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{rental.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Security Deposit</span>
                <span>₹{rental.securityDeposit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery</span>
                <span>₹{rental.deliveryCharge}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Paid</span>
                <span className="text-primary-600">₹{rental.totalPaid}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {rental.status === 'active' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4">Actions</h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setShowExtendModal(true)}
                  className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700"
                >
                  Extend Rental
                </button>
                <button
                  onClick={() => setShowPickupModal(true)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
                >
                  Schedule Pickup
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Extend Modal */}
        {showExtendModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">Extend Rental</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Months</label>
                <select
                  value={extendMonths}
                  onChange={(e) => setExtendMonths(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                >
                  <option value={3}>3 months</option>
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowExtendModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExtend}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Extend'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pickup Modal */}
        {showPickupModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">Schedule Pickup</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Pickup Date</label>
                <input
                  type="date"
                  value={pickupDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowPickupModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSchedulePickup}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Schedule'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RentalDetail;
