import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/services');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
      // Default services if API fails
      setServices([
        {
          _id: '1',
          name: 'Bridal Makeup',
          description: 'Complete bridal makeup for your special day',
          price: 250,
          duration: '2 hours',
          category: 'bridal'
        },
        {
          _id: '2',
          name: 'Evening Glam',
          description: 'Full glam makeup for special events',
          price: 150,
          duration: '1.5 hours',
          category: 'glam'
        },
        {
          _id: '3',
          name: 'Natural Makeup',
          description: 'Light, natural-looking makeup',
          price: 120,
          duration: '1 hour',
          category: 'natural'
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (category) => {
    const names = {
      bridal: 'Bridal',
      glam: 'Glam',
      natural: 'Natural',
      editorial: 'Editorial',
      events: 'Events',
    };
    return names[category] || category;
  };

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-50 to-nude-50" />
        <div className="relative section-container">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-cormorant font-bold text-gray-800 mb-6">
              Services & Pricing
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional makeup services tailored to your needs and occasion
            </p>
          </div>
        </div>
      </section>

      {/* Important Note */}
      <section className="section-container">
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl p-6 md:p-8 text-white mb-12">
          <div className="flex items-start">
            <AlertCircle className="h-8 w-8 mr-4 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold mb-2">Important Booking Information</h3>
              <p className="text-pink-100">
                A <strong>75% deposit</strong> is required to secure your booking. 
                The remaining balance is due on the day of your appointment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      ) : (
        <section className="section-container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div key={service._id} className="card">
                <div className="mb-6">
                  <span className="inline-block px-4 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium mb-4">
                    {getCategoryName(service.category)}
                  </span>
                  <h3 className="text-2xl font-cormorant font-bold text-gray-800 mb-3">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 mb-6">{service.description}</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center text-gray-700">
                    <DollarSign className="h-5 w-5 text-pink-600 mr-3" />
                    <span className="font-semibold">Price:</span>
                    <span className="ml-2 text-2xl font-bold text-pink-600">${service.price}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <Clock className="h-5 w-5 text-pink-600 mr-3" />
                    <span className="font-semibold">Duration:</span>
                    <span className="ml-2">{service.duration}</span>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <Link
                    to={`/booking?service=${encodeURIComponent(service.name)}&price=${service.price}`}
                    className="btn-primary w-full text-center"
                  >
                    Book This Service
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Additional Information */}
      <section className="bg-gradient-to-b from-white to-pink-50 py-20">
        <div className="section-container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-cormorant font-bold text-gray-800 mb-8 text-center">
              Service Details & Policies
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">What's Included</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-pink-600 mr-2">•</span>
                    <span className="text-gray-600">Professional makeup application</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-pink-600 mr-2">•</span>
                    <span className="text-gray-600">High-quality products</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-pink-600 mr-2">•</span>
                    <span className="text-gray-600">Pre-service consultation</span>
                  </li>
                </ul>
              </div>
              
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Booking Policies</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-pink-600 mr-2">•</span>
                    <span className="text-gray-600">75% deposit required</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-pink-600 mr-2">•</span>
                    <span className="text-gray-600">24-hour cancellation notice</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-pink-600 mr-2">•</span>
                    <span className="text-gray-600">Travel fees may apply</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;