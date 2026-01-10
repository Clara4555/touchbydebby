// src/pages/Booking.jsx

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Upload, DollarSign, AlertCircle, Banknote, Building, User, CreditCard, Image } from 'lucide-react';
import toast from 'react-hot-toast';

const Booking = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const exchangeRate = 1500; // 1 USD = 1500 NGN
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  const serviceType = watch('serviceType');
  const servicePrice = watch('servicePrice');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/services');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setPaymentScreenshot(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateNairaAmount = (usdAmount) => {
    return Math.round(parseFloat(usdAmount || 0) * exchangeRate);
  };

  const calculateDepositNaira = () => {
    const price = parseFloat(servicePrice) || 0;
    const depositUSD = price * 0.75;
    return Math.round(depositUSD * exchangeRate);
  };

  const calculateDepositUSD = () => {
    const price = parseFloat(servicePrice) || 0;
    return (price * 0.75).toFixed(2);
  };

  const onSubmit = async (data) => {
    if (!paymentScreenshot) {
      toast.error('Please upload payment screenshot');
      return;
    }

    setIsSubmitting(true);

    const depositUSD = calculateDepositUSD();
    const depositNaira = calculateDepositNaira();
    const totalNaira = calculateNairaAmount(servicePrice);

    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('email', data.email);
    formData.append('phone', data.phone);
    formData.append('serviceType', data.serviceType);
    formData.append('serviceName', data.serviceName || selectedService?.name || 'Custom Service');
    formData.append('preferredDate', data.preferredDate);
    formData.append('preferredTime', data.preferredTime);
    formData.append('location', data.location || '');
    formData.append('amountPaid', depositUSD);
    formData.append('totalAmount', servicePrice);
    formData.append('paymentScreenshot', paymentScreenshot);
    formData.append('amountPaidNaira', depositNaira);
    formData.append('totalAmountNaira', totalNaira);

    try {
      const response = await axios.post('http://localhost:5000/api/bookings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Booking submitted successfully! Check your email for confirmation.');
      
      // Reset form
      setPaymentScreenshot(null);
      setScreenshotPreview(null);
      
      // Navigate to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalNaira = calculateNairaAmount(servicePrice);
  const depositNaira = calculateDepositNaira();
  const depositUSD = calculateDepositUSD();

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-50 to-nude-50" />
        <div className="relative section-container">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-cormorant font-bold text-gray-800 mb-6">
              Book Your Appointment
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Fill out the form below to schedule your makeup service
            </p>
          </div>
        </div>
      </section>

      <section className="section-container">
        <div className="max-w-4xl mx-auto">
          <div className="card">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Personal Information */}
              <div className="space-y-6">
                <h2 className="text-2xl font-cormorant font-bold text-gray-800">Personal Information</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      {...register('fullName', { required: 'Full name is required' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                    {errors.fullName && (
                      <p className="mt-2 text-sm text-red-600">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      {...register('phone', { required: 'Phone number is required' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="(555) 123-4567"
                    />
                    {errors.phone && (
                      <p className="mt-2 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Service Selection */}
              <div className="space-y-6">
                <h2 className="text-2xl font-cormorant font-bold text-gray-800">Service Details</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Service *
                  </label>
                  <select
                    {...register('serviceType', { required: 'Please select a service' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    onChange={(e) => {
                      const selected = services.find(s => s._id === e.target.value);
                      setSelectedService(selected);
                      if (selected) {
                        setValue('servicePrice', selected.price);
                        setValue('serviceName', selected.name);
                      }
                    }}
                  >
                    <option value="">Choose a service</option>
                    {services.map((service) => (
                      <option key={service._id} value={service._id}>
                        {service.name} - ₦{Math.round(service.price * exchangeRate).toLocaleString()} (${service.price} USD)
                      </option>
                    ))}
                    <option value="custom">Custom Service</option>
                  </select>
                  {errors.serviceType && (
                    <p className="mt-2 text-sm text-red-600">{errors.serviceType.message}</p>
                  )}
                </div>

                {serviceType === 'custom' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Description *
                      </label>
                      <input
                        type="text"
                        {...register('serviceName', { required: 'Service description is required' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Describe the service you need"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estimated Price ($) *
                      </label>
                      <input
                        type="number"
                        {...register('servicePrice', {
                          required: 'Price is required',
                          min: { value: 50, message: 'Minimum price is $50' },
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Date & Time */}
              <div className="space-y-6">
                <h2 className="text-2xl font-cormorant font-bold text-gray-800">Preferred Date & Time</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Date *
                    </label>
                    <input
                      type="date"
                      {...register('preferredDate', { required: 'Date is required' })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                    {errors.preferredDate && (
                      <p className="mt-2 text-sm text-red-600">{errors.preferredDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Time *
                    </label>
                    <select
                      {...register('preferredTime', { required: 'Time is required' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">Select a time</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="17:00">5:00 PM</option>
                    </select>
                    {errors.preferredTime && (
                      <p className="mt-2 text-sm text-red-600">{errors.preferredTime.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    {...register('location')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Venue or address if known"
                  />
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-6">
                <h2 className="text-2xl font-cormorant font-bold text-gray-800">Payment Information</h2>
                
                {/* Payment Instructions - Always Show */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <CreditCard className="h-6 w-6 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-800">Payment Instructions</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded">
                          <Building className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-sm text-gray-500">Bank</p>
                            <p className="font-semibold">OPay</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded">
                          <CreditCard className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-sm text-gray-500">Account Number</p>
                            <p className="font-semibold">9159113921</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded md:col-span-2">
                          <User className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-sm text-gray-500">Account Name</p>
                            <p className="font-semibold">Favour Esohe Modmodu</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-800">
                          💡 <strong>Important:</strong> Please include your name as reference when transferring. 
                          After payment, upload the screenshot below.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {servicePrice && (
                  <div className="bg-pink-50 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <DollarSign className="h-6 w-6 text-pink-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-800">Payment Details</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                        <div>
                          <span className="text-gray-700">Total Service Amount:</span>
                          <p className="text-sm text-gray-500">Payable in Naira</p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-pink-600">₦{totalNaira.toLocaleString()}</span>
                          <p className="text-sm text-gray-500">(${servicePrice} USD)</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                        <div>
                          <span className="text-gray-700">Required Deposit (75%):</span>
                          <p className="text-sm text-gray-500">To be paid now in Naira</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-pink-600">₦{depositNaira.toLocaleString()}</span>
                          <p className="text-sm text-gray-500">(${depositUSD} USD)</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                        <p className="text-sm text-yellow-800">
                          Please transfer <strong>₦{depositNaira.toLocaleString()}</strong> to the account above and upload the payment screenshot.
                          Booking will only be confirmed after payment verification.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* File Upload with Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Payment Screenshot *
                  </label>
                  
                  {screenshotPreview ? (
                    <div className="space-y-4">
                      <div className="border-2 border-green-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <Image className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-green-600 font-medium">Screenshot Preview</span>
                        </div>
                        <div className="text-center">
                          <img 
                            src={screenshotPreview} 
                            alt="Payment Screenshot Preview" 
                            className="max-h-64 mx-auto rounded-lg border border-gray-200"
                          />
                          <p className="mt-2 text-sm text-gray-500">{paymentScreenshot?.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentScreenshot(null);
                            setScreenshotPreview(null);
                          }}
                          className="mt-3 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove & Upload Different Screenshot
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-pink-400 transition">
                      <input
                        type="file"
                        id="payment-screenshot"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="payment-screenshot" className="cursor-pointer">
                        <div className="space-y-2">
                          <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                          <p className="text-gray-600">Click to upload payment screenshot</p>
                          <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                      </label>
                    </div>
                  )}
                  {!paymentScreenshot && (
                    <p className="mt-2 text-sm text-red-600">Payment screenshot is required</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Complete Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Booking;