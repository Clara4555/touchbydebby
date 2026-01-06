import React from 'react';
import { Award, Heart, Sparkles, Camera, CheckCircle } from 'lucide-react';

const About = () => {
  const specialties = [
    {
      icon: Heart,
      title: 'Bridal Makeup',
      description: 'Creating timeless looks for your special day',
    },
    {
      icon: Sparkles,
      title: 'Event Glam',
      description: 'Red carpet ready makeup for special occasions',
    },
    {
      icon: Camera,
      title: 'Photoshoot',
      description: 'Camera-ready makeup for professional photography',
    },
    {
      icon: Award,
      title: 'Editorial',
      description: 'Creative makeup for fashion and editorial work',
    },
  ];

  const values = [
    'Using only high-quality, professional products',
    'Customized looks for each individual',
    'Hygiene and safety as top priority',
    'Creating a comfortable, relaxing experience',
    'Attention to detail in every application',
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-50 to-nude-50" />
        <div className="relative section-container">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-cormorant font-bold text-gray-800 mb-6">
              About Debby
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional Makeup Artist with 8+ years of experience creating beautiful,
              confidence-boosting looks
            </p>
          </div>
        </div>
      </section>

      {/* Bio Section */}
      <section className="section-container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Debby working"
                className="w-full h-auto"
              />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-cormorant font-bold text-gray-800 mb-6">
              My Journey in Beauty
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                My passion for makeup began at a young age, experimenting with colors and 
                techniques to enhance natural beauty. What started as a hobby quickly turned 
                into a career as I realized the power of makeup to boost confidence.
              </p>
              <p>
                I've trained with industry's top artists and worked on various projects 
                including fashion shows, magazine editorials, celebrity events, and countless 
                weddings.
              </p>
            </div>
            
            <div className="mt-8 p-6 bg-pink-50 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Experience & Education</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-pink-600 mr-3" />
                  <span>Certified Master Makeup Artist</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-pink-600 mr-3" />
                  <span>8+ years professional experience</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-pink-600 mr-3" />
                  <span>Trained at prestigious makeup academies</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className="bg-gradient-to-b from-white to-pink-50 py-20">
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-cormorant font-bold text-gray-800 mb-4">
              My Specialties
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Areas where I excel and bring exceptional expertise
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {specialties.map((specialty) => (
              <div key={specialty.title} className="card text-center">
                <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <specialty.icon className="h-8 w-8 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {specialty.title}
                </h3>
                <p className="text-gray-600">{specialty.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="section-container">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-cormorant font-bold text-gray-800 mb-8 text-center">
            My Philosophy
          </h2>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <p className="text-xl text-gray-700 italic text-center mb-8">
                "Makeup should enhance, not mask. It's about revealing the most confident 
                version of yourself."
              </p>
              
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-gray-800">What I Believe In</h3>
                
                <ul className="space-y-4">
                  {values.map((value, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-pink-600 mr-3 flex-shrink-0 mt-1" />
                      <span className="text-gray-600">{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;