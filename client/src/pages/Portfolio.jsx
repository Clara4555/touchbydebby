import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Portfolio = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'bridal', 'glam', 'natural', 'editorial'];

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/portfolio');
      setPortfolioImages(response.data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      // Load sample images if API fails
      setPortfolioImages([
        { _id: '1', imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', category: 'bridal', title: 'Bridal Look' },
        { _id: '2', imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', category: 'glam', title: 'Evening Glam' },
        { _id: '3', imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', category: 'natural', title: 'Natural Beauty' },
        { _id: '4', imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', category: 'editorial', title: 'Editorial Shoot' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = selectedCategory === 'All' 
    ? portfolioImages 
    : portfolioImages.filter(img => img.category === selectedCategory);

  const getCategoryName = (category) => {
    const names = {
      bridal: 'Bridal',
      glam: 'Glam',
      natural: 'Natural',
      editorial: 'Editorial',
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
              Portfolio
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Browse through my work and get inspired for your next look
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="section-container">
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-pink-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-pink-50 hover:text-pink-600 shadow-sm'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Gallery */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredImages.map((image) => (
              <div
                key={image._id}
                className="group relative overflow-hidden rounded-2xl shadow-lg cursor-pointer"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={image.imageUrl.startsWith('/') ? `http://localhost:5000${image.imageUrl}` : image.imageUrl}
                    alt={image.title || 'Portfolio image'}
                    className="w-full h-full object-cover transform transition duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <span className="inline-block px-3 py-1 bg-pink-600 rounded-full text-sm">
                      {getCategoryName(image.category)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredImages.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No images found in this category.</p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="section-container">
        <div className="bg-gradient-to-r from-nude-100 to-pink-100 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-cormorant font-bold text-gray-800 mb-4">
            Ready to Create Your Look?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Inspired by what you see? Let's work together to create your perfect look.
          </p>
          <a
            href="/booking"
            className="btn-primary inline-flex items-center"
          >
            Book Your Appointment
          </a>
        </div>
      </section>
    </div>
  );
};

export default Portfolio;