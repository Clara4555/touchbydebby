import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Camera, Heart } from 'lucide-react';

const Home = () => {
  const featuredServices = [
    {
      name: 'Bridal Makeup',
      description: 'Perfect for your special day',
      price: '$250+',
      icon: Heart,
    },
    {
      name: 'Event Glam',
      description: 'Red carpet ready looks',
      price: '$150+',
      icon: Sparkles,
    },
    {
      name: 'Photoshoot',
      description: 'Professional makeup for photography',
      price: '$200+',
      icon: Camera,
    },
  ];

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-100/30 to-nude-100/30" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white" />
        </div>
        
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-cormorant font-bold text-gray-800 mb-6">
            touchbydebby
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Luxury makeup artistry that enhances your natural beauty
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/booking" className="btn-primary inline-flex items-center justify-center">
              Book an Appointment
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link to="/portfolio" className="btn-secondary inline-flex items-center justify-center">
              View Portfolio
            </Link>
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="section-container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-cormorant font-bold text-gray-800 mb-6">
              Meet Debby
            </h2>
            <p className="text-gray-600 mb-4 text-lg">
              With over 8 years of experience in the beauty industry, I specialize in creating 
              elegant and timeless makeup looks that enhance your natural features.
            </p>
            <p className="text-gray-600 mb-8">
              My philosophy is simple: every person is unique, and their makeup should reflect 
              their individual beauty.
            </p>
            <Link to="/about" className="text-pink-600 hover:text-pink-700 font-semibold inline-flex items-center">
              Learn more about me
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Makeup artist"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="bg-gradient-to-b from-white to-pink-50 py-20">
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-cormorant font-bold text-gray-800 mb-4">
              Featured Services
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Professional makeup services tailored to your needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {featuredServices.map((service) => (
              <div key={service.name} className="card">
                <div className="flex items-center mb-4">
                  <div className="bg-pink-100 p-3 rounded-lg">
                    <service.icon className="h-8 w-8 text-pink-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-gray-800">{service.name}</h3>
                    <p className="text-pink-600 font-bold">{service.price}</p>
                  </div>
                </div>
                <p className="text-gray-600">{service.description}</p>
                <Link
                  to="/services"
                  className="mt-4 text-pink-600 hover:text-pink-700 font-medium inline-flex items-center"
                >
                  View details
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/services" className="btn-secondary">
              View All Services
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-container">
        <div className="bg-gradient-to-r from-pink-600 to-pink-500 rounded-3xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-cormorant font-bold mb-4">
            Ready to Feel Beautiful?
          </h2>
          <p className="text-pink-100 mb-8 max-w-2xl mx-auto text-lg">
            Book your appointment today and experience luxury makeup artistry
          </p>
          <Link to="/booking" className="bg-white text-pink-600 hover:bg-pink-50 font-semibold py-3 px-8 rounded-lg inline-flex items-center">
            Book Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;