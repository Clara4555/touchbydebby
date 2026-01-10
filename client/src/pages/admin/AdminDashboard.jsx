import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Calendar, DollarSign, User, Image, Settings, LogOut, 
  CheckCircle, XCircle, Eye, Shield, AlertTriangle, Clock,
  Check, X, ChevronDown, ChevronUp, Mail, Phone, MapPin, 
  DollarSign as DollarIcon, Filter, Trash2, Plus, Edit,
  Users, Key, Save
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [newPortfolio, setNewPortfolio] = useState({ title: '', category: '', image: null });
  const [newService, setNewService] = useState({ name: '', description: '', price: '', category: '', duration: '' });
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    autoConfirmVerified: true
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/admin');
      return;
    }
    
    setUser(JSON.parse(userData));
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [bookingsRes, servicesRes, portfolioRes, adminsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/bookings', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://localhost:5000/api/services'),
        axios.get('http://localhost:5000/api/portfolio'),
        axios.get('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
      
      setBookings(bookingsRes.data);
      setServices(servicesRes.data);
      setPortfolio(portfolioRes.data);
      setAdmins(adminsRes.data.filter(admin => admin.role === 'admin'));
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/admin');
      }
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin');
    toast.success('Logged out');
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/admin/bookings/${bookingId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Booking status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const verifyPayment = async (bookingId) => {
    try {
      setIsVerifying(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/admin/bookings/${bookingId}/verify-payment`,
        { verificationStatus: 'verified' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Payment verified successfully');
      fetchData();
      setShowBookingModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to verify payment');
    } finally {
      setIsVerifying(false);
    }
  };

  const rejectPayment = async (bookingId, reason) => {
    try {
      setIsRejecting(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/admin/bookings/${bookingId}/verify-payment`,
        { 
          verificationStatus: 'rejected',
          rejectionReason: reason 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Payment rejected');
      fetchData();
      setShowBookingModal(false);
      setRejectionReason('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject payment');
    } finally {
      setIsRejecting(false);
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/admin/bookings/${bookingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Booking deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete booking');
    } finally {
      setDeleteLoading(false);
    }
  };

  const addPortfolioItem = async () => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', newPortfolio.title);
      formData.append('category', newPortfolio.category);
      if (newPortfolio.image) {
        formData.append('image', newPortfolio.image);
      }

      if (editingPortfolio) {
        await axios.put(
          `http://localhost:5000/api/admin/portfolio/${editingPortfolio._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        );
        toast.success('Portfolio updated successfully');
      } else {
        await axios.post(
          'http://localhost:5000/api/admin/portfolio',
          formData,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        );
        toast.success('Portfolio item added successfully');
      }
      
      setShowPortfolioModal(false);
      setNewPortfolio({ title: '', category: '', image: null });
      setEditingPortfolio(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to save portfolio item');
    }
  };

  const deletePortfolioItem = async (id) => {
    if (!window.confirm('Delete this portfolio item?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/admin/portfolio/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Portfolio item deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete portfolio item');
    }
  };

  const addService = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (editingService) {
        await axios.put(
          `http://localhost:5000/api/admin/services/${editingService._id}`,
          newService,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Service updated successfully');
      } else {
        await axios.post(
          'http://localhost:5000/api/admin/services',
          newService,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Service added successfully');
      }
      
      setShowServiceModal(false);
      setNewService({ name: '', description: '', price: '', category: '', duration: '' });
      setEditingService(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to save service');
    }
  };

  const deleteService = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/admin/services/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Service deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete service');
    }
  };

  const addAdmin = async () => {
    try {
      if (newAdmin.password !== newAdmin.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      const token = localStorage.getItem('token');
      
      if (editingAdmin) {
        await axios.put(
          `http://localhost:5000/api/admin/users/${editingAdmin._id}`,
          { name: newAdmin.name, email: newAdmin.email },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Admin updated successfully');
      } else {
        await axios.post(
          'http://localhost:5000/api/admin/users',
          newAdmin,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Admin added successfully');
      }
      
      setShowAdminModal(false);
      setNewAdmin({ name: '', email: '', password: '', confirmPassword: '' });
      setEditingAdmin(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save admin');
    }
  };

  const deleteAdmin = async (id) => {
    if (!window.confirm('Delete this admin account?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/admin/users/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Admin deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete admin');
    }
  };

  const updateSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5000/api/admin/settings',
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filterStatus !== 'all' && booking.status !== filterStatus) return false;
    if (filterPayment !== 'all') {
      if (filterPayment === 'verified' && booking.paymentStatus !== 'verified') return false;
      if (filterPayment === 'pending' && booking.paymentStatus !== 'pending') return false;
      if (filterPayment === 'rejected' && booking.paymentStatus !== 'rejected') return false;
    }
    return true;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'verified': return <Check className="h-4 w-4 text-green-500" />;
      case 'rejected': return <X className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const toggleBookingExpansion = (bookingId) => {
    setExpandedBookingId(expandedBookingId === bookingId ? null : bookingId);
  };

  const tabs = [
    { key: 'bookings', label: 'Bookings', icon: Calendar },
    { key: 'services', label: 'Services', icon: DollarSign },
    { key: 'portfolio', label: 'Portfolio', icon: Image },
    { key: 'admins', label: 'Admins', icon: Users },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  const BookingModal = () => {
    if (!selectedBooking) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex mt-20 items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
              <p className="text-sm text-gray-600">Booking ID: {selectedBooking._id?.slice(-8)}</p>
            </div>
            <button
              onClick={() => setShowBookingModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Client Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium">{selectedBooking.fullName}</p>
                        <p className="text-sm text-gray-600">Full Name</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium">{selectedBooking.email}</p>
                        <p className="text-sm text-gray-600">Email</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium">{selectedBooking.phone}</p>
                        <p className="text-sm text-gray-600">Phone</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Service Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">{selectedBooking.serviceName}</p>
                      <p className="text-sm text-gray-600">Service</p>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium">
                          {formatDate(selectedBooking.preferredDate)} at {selectedBooking.preferredTime}:00
                        </p>
                        <p className="text-sm text-gray-600">Date & Time</p>
                      </div>
                    </div>
                    {selectedBooking.location && (
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium">{selectedBooking.location}</p>
                          <p className="text-sm text-gray-600">Location</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-bold">${selectedBooking.totalAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deposit Paid:</span>
                      <span className="font-bold">${selectedBooking.amountPaid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">In Naira:</span>
                      <span className="font-bold">₦{selectedBooking.amountPaidNaira?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Payment Status</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(selectedBooking.paymentStatus || 'pending')}`}>
                      {getPaymentStatusIcon(selectedBooking.paymentStatus || 'pending')}
                      <span className="ml-1">Payment {selectedBooking.paymentStatus || 'pending'}</span>
                    </span>
                  </div>

                  {(selectedBooking.paymentStatus === 'pending' || !selectedBooking.paymentStatus) && (
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => verifyPayment(selectedBooking._id)}
                          disabled={isVerifying}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          {isVerifying ? 'Verifying...' : 'Verify Payment'}
                        </button>
                        <button
                          onClick={() => setIsRejecting(!isRejecting)}
                          disabled={isVerifying}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Reject Payment
                        </button>
                      </div>

                      {isRejecting && (
                        <div className="border border-red-200 rounded-md p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for rejection
                          </label>
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            rows="3"
                            placeholder="Explain why the payment was rejected..."
                          />
                          <div className="mt-3 flex justify-end space-x-2">
                            <button
                              onClick={() => setIsRejecting(false)}
                              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => rejectPayment(selectedBooking._id, rejectionReason)}
                              disabled={!rejectionReason.trim() || isRejecting}
                              className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                              Confirm Rejection
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedBooking.paymentScreenshot && (
                    <div className="mt-4">
                      <a
                        href={`http://localhost:5000${selectedBooking.paymentScreenshot}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Payment Screenshot
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Status</h3>
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBooking.status)}`}>
                  {selectedBooking.status}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateBookingStatus(selectedBooking._id, 'confirmed')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm
                  </button>
                  <button
                    onClick={() => updateBookingStatus(selectedBooking._id, 'cancelled')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={() => updateBookingStatus(selectedBooking._id, 'completed')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Complete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PortfolioModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {editingPortfolio ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
          </h2>
          <button onClick={() => setShowPortfolioModal(false)} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={newPortfolio.title}
              onChange={(e) => setNewPortfolio({...newPortfolio, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
              placeholder="Image title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <input
              type="text"
              value={newPortfolio.category}
              onChange={(e) => setNewPortfolio({...newPortfolio, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
              placeholder="e.g., bridal, glam, natural"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewPortfolio({...newPortfolio, image: e.target.files[0]})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
            />
            {editingPortfolio && !newPortfolio.image && (
              <p className="text-sm text-gray-500 mt-1">Current image will be kept if no new file selected</p>
            )}
          </div>
        </div>
        <div className="flex justify-end space-x-3 p-6 border-t">
          <button onClick={() => setShowPortfolioModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button onClick={addPortfolioItem} className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700">
            {editingPortfolio ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );

  const ServiceModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {editingService ? 'Edit Service' : 'Add Service'}
          </h2>
          <button onClick={() => setShowServiceModal(false)} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Name</label>
            <input
              type="text"
              value={newService.name}
              onChange={(e) => setNewService({...newService, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
              placeholder="e.g., Bridal Makeup"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={newService.description}
              onChange={(e) => setNewService({...newService, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
              rows="3"
              placeholder="Service description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
              <input
                type="number"
                value={newService.price}
                onChange={(e) => setNewService({...newService, price: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <input
                type="text"
                value={newService.category}
                onChange={(e) => setNewService({...newService, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
                placeholder="e.g., bridal"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
            <input
              type="text"
              value={newService.duration}
              onChange={(e) => setNewService({...newService, duration: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
              placeholder="e.g., 2 hours"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 p-6 border-t">
          <button onClick={() => setShowServiceModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button onClick={addService} className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700">
            {editingService ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );

  const AdminModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {editingAdmin ? 'Edit Admin' : 'Add Admin'}
          </h2>
          <button onClick={() => setShowAdminModal(false)} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={newAdmin.name}
              onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
              placeholder="Admin name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={newAdmin.email}
              onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
              placeholder="admin@example.com"
            />
          </div>
          {!editingAdmin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
                  placeholder="Password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={newAdmin.confirmPassword}
                  onChange={(e) => setNewAdmin({...newAdmin, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
                  placeholder="Confirm password"
                />
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end space-x-3 p-6 border-t">
          <button onClick={() => setShowAdminModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button onClick={addAdmin} className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700">
            {editingAdmin ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 mt-16">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-cormorant font-bold text-gray-800">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">Welcome, {user?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.key
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="py-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'bookings' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">All Bookings</h3>
                      <p className="text-sm text-gray-600">Manage and verify bookings</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-500">
                        {filteredBookings.length} of {bookings.length} bookings
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center space-x-4">
                      <Filter className="h-5 w-5 text-gray-400" />
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
                          <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
                          >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Filter</label>
                          <select
                            value={filterPayment}
                            onChange={(e) => setFilterPayment(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
                          >
                            <option value="all">All Payments</option>
                            <option value="verified">Payment Verified</option>
                            <option value="pending">Payment Pending</option>
                            <option value="rejected">Payment Rejected</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {filteredBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No bookings match your filters</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredBookings.map((booking) => (
                        <div key={booking._id} className="bg-white shadow rounded-lg overflow-hidden">
                          <div 
                            className="p-6 cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleBookingExpansion(booking._id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <User className="h-6 w-6 text-pink-600" />
                                <div>
                                  <h4 className="font-medium text-gray-900">{booking.fullName}</h4>
                                  <p className="text-sm text-gray-600">{booking.email}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                  {booking.status}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus || 'pending')}`}>
                                  Payment {booking.paymentStatus || 'pending'}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteBooking(booking._id);
                                  }}
                                  disabled={deleteLoading}
                                  className="text-red-600 hover:text-red-800 p-1"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                                {expandedBookingId === booking._id ? (
                                  <ChevronUp className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </div>

                          {expandedBookingId === booking._id && (
                            <div className="border-t p-6">
                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div>
                                    <h5 className="text-sm font-medium text-gray-900 mb-2">Service Details</h5>
                                    <div className="space-y-2">
                                      <p className="text-gray-900">{booking.serviceName}</p>
                                      <p className="text-sm text-gray-600">
                                        {formatDate(booking.preferredDate)} at {booking.preferredTime}:00
                                      </p>
                                      {booking.location && (
                                        <p className="text-sm text-gray-600">{booking.location}</p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h5 className="text-sm font-medium text-gray-900 mb-2">Payment</h5>
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Total:</span>
                                        <span className="font-medium">${booking.totalAmount}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Deposit:</span>
                                        <span className="font-medium">${booking.amountPaid}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">In Naira:</span>
                                        <span className="font-medium">₦{booking.amountPaidNaira?.toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <h5 className="text-sm font-medium text-gray-900 mb-2">Payment Verification</h5>
                                    {(booking.paymentStatus === 'pending' || !booking.paymentStatus) ? (
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => verifyPayment(booking._id)}
                                          disabled={isVerifying}
                                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                                        >
                                          Verify Payment
                                        </button>
                                        <button
                                          onClick={() => {
                                            setSelectedBooking(booking);
                                            setIsRejecting(true);
                                            setShowBookingModal(true);
                                          }}
                                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 text-sm"
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    ) : (
                                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                                        {getPaymentStatusIcon(booking.paymentStatus)}
                                        <span className="ml-1">Payment {booking.paymentStatus}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <h5 className="text-sm font-medium text-gray-900 mb-2">Booking Actions</h5>
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                                        className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => viewBookingDetails(booking)}
                                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                      >
                                        View Details
                                      </button>
                                      <button
                                        onClick={() => deleteBooking(booking._id)}
                                        disabled={deleteLoading}
                                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center"
                                      >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Delete
                                      </button>
                                    </div>
                                  </div>

                                  {booking.paymentScreenshot && (
                                    <div>
                                      <a
                                        href={`http://localhost:5000${booking.paymentScreenshot}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View Payment Screenshot
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'services' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Services Management</h3>
                      <p className="text-sm text-gray-600">Add, edit, or delete services</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingService(null);
                        setNewService({ name: '', description: '', price: '', category: '', duration: '' });
                        setShowServiceModal(true);
                      }}
                      className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Service
                    </button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                      <div key={service._id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900 text-lg">{service.name}</h4>
                            <p className="text-pink-600 font-bold text-xl">${service.price}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingService(service);
                                setNewService({
                                  name: service.name,
                                  description: service.description,
                                  price: service.price,
                                  category: service.category || '',
                                  duration: service.duration || ''
                                });
                                setShowServiceModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 p-1"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteService(service._id)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-4">{service.description}</p>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">{service.duration || 'Duration not specified'}</span>
                          <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded text-xs">
                            {service.category || 'Uncategorized'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'portfolio' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Portfolio Management</h3>
                      <p className="text-sm text-gray-600">Add, edit, or delete portfolio images</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingPortfolio(null);
                        setNewPortfolio({ title: '', category: '', image: null });
                        setShowPortfolioModal(true);
                      }}
                      className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Image
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {portfolio.map((item) => (
                      <div key={item._id} className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="relative group">
                          <img
                            src={`http://localhost:5000${item.imageUrl}`}
                            alt={item.title || 'Portfolio'}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingPortfolio(item);
                                  setNewPortfolio({
                                    title: item.title || '',
                                    category: item.category || '',
                                    image: null
                                  });
                                  setShowPortfolioModal(true);
                                }}
                                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deletePortfolioItem(item._id)}
                                className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium text-gray-900">{item.title || 'Untitled'}</h4>
                          {item.category && (
                            <span className="text-xs text-gray-500 mt-1">{item.category}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'admins' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Admin Management</h3>
                      <p className="text-sm text-gray-600">Manage admin accounts</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingAdmin(null);
                        setNewAdmin({ name: '', email: '', password: '', confirmPassword: '' });
                        setShowAdminModal(true);
                      }}
                      className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Admin
                    </button>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {admins.map((admin) => (
                          <tr key={admin._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <User className="h-5 w-5 text-gray-400 mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                                  {admin._id === user?.id && (
                                    <span className="text-xs text-pink-600">(Current User)</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admin.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                {admin.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {admin._id !== user?.id ? (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingAdmin(admin);
                                      setNewAdmin({
                                        name: admin.name,
                                        email: admin.email,
                                        password: '',
                                        confirmPassword: ''
                                      });
                                      setShowAdminModal(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteAdmin(admin._id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-gray-400">Current session</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Settings</h3>
                      <p className="text-sm text-gray-600">Configure your dashboard</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-4">Email Settings</h4>
                        <div className="space-y-3">
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={settings.notifications}
                              onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                              className="rounded text-pink-600 focus:ring-pink-500" 
                            />
                            <span className="ml-2 text-sm text-gray-600">New booking notifications</span>
                          </label>
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={settings.emailAlerts}
                              onChange={(e) => setSettings({...settings, emailAlerts: e.target.checked})}
                              className="rounded text-pink-600 focus:ring-pink-500" 
                            />
                            <span className="ml-2 text-sm text-gray-600">Email alerts for payment verification</span>
                          </label>
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={settings.autoConfirmVerified}
                              onChange={(e) => setSettings({...settings, autoConfirmVerified: e.target.checked})}
                              className="rounded text-pink-600 focus:ring-pink-500" 
                            />
                            <span className="ml-2 text-sm text-gray-600">Auto-confirm bookings when payment is verified</span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="border-t pt-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4">System Information</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Total Bookings:</span>
                            <p className="font-medium">{bookings.length}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Total Services:</span>
                            <p className="font-medium">{services.length}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Total Portfolio Items:</span>
                            <p className="font-medium">{portfolio.length}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Total Admins:</span>
                            <p className="font-medium">{admins.length}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-6">
                        <button
                          onClick={updateSettings}
                          className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Settings
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showBookingModal && <BookingModal />}
      {showPortfolioModal && <PortfolioModal />}
      {showServiceModal && <ServiceModal />}
      {showAdminModal && <AdminModal />}
    </div>
  );
};

export default AdminDashboard;