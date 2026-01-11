import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Truck, 
  Shield, 
  Leaf, 
  Zap, 
  ArrowRight, 
  CheckCircle2,
  MapPin,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: Shield,
      title: 'Secure Custody',
      description: 'OTP-verified pickup and delivery ensures complete chain of custody.',
    },
    {
      icon: MapPin,
      title: 'Geofence Lock',
      description: 'Drivers can only complete delivery when within 500m of the destination.',
    },
    {
      icon: FileText,
      title: 'Proof-to-Pay',
      description: 'Automatic invoice generation upon successful delivery completion.',
    },
    {
      icon: Leaf,
      title: 'Carbon Tracking',
      description: 'Real-time sustainability metrics and route optimization.',
    },
  ];

  const stats = [
    { value: '2.8K+', label: 'Tons CO₂ Saved' },
    { value: '50K+', label: 'Deliveries' },
    { value: '99.9%', label: 'On-Time Rate' },
    { value: '40%', label: 'Fuel Savings' },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              if (window.scrollY > 0) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                window.location.reload();
              }
            }}
          >
            <span className="font-bold text-2xl text-white tracking-tight">Routezy</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-white/90 font-medium">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#mission" className="hover:text-white transition-colors">Mission</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">Login</Button>
            </Link>
            <Link to="/login">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6">
                SIGN UP
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero.jpg" 
            alt="Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="container mx-auto px-4 relative z-10 mt-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
                Secure Custody <br />
                Sustainable Delivery
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl font-light">
              The complete logistics platform with OTP-verified handoffs, geofence-locked deliveries, and automatic invoice generation
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/login">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white text-lg h-14 px-8 font-bold rounded-sm w-full sm:w-auto">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Trusted By Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#0f2b26] py-6 border-t border-white/10">
          <div className="container mx-auto px-4">
            <p className="text-center text-xs font-bold tracking-[0.2em] text-white/60 mb-0 uppercase">
              Trusted by industry leaders of all sizes
            </p>
            {/* You could add logos here if you had them */}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The Trust Layer for Logistics
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every delivery is verified, tracked, and documented automatically. 
              No more disputes, no more manual reconciliation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How It Works
          </h2>

          <div className="space-y-6">
            {[
              { step: 1, title: 'Pickup Verification', desc: 'Driver enters OTP from sender to confirm custody' },
              { step: 2, title: 'Geofence Transit', desc: 'Package tracked until driver reaches destination zone' },
              { step: 3, title: 'Delivery Proof', desc: 'Customer OTP + optional photo confirms handoff' },
              { step: 4, title: 'Instant Invoice', desc: 'Payment triggered automatically, carbon saved calculated' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className="flex items-start gap-4"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                viewport={{ once: true }}
              >
                <div className="w-10 h-10 bg-gradient-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-accent-foreground">{item.step}</span>
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section id="mission" className="py-20 px-4 bg-gray-50 text-gray-900">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Our Mission</h2>
            <p className="text-xl md:text-2xl text-gray-600 font-light leading-relaxed">
              To build the world's most trusted and sustainable logistics network, ensuring every delivery is secure, verifiable, and eco-friendly.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Security First</h3>
              <p className="text-gray-600 leading-relaxed">
                Eliminating theft and fraud with cryptographic proof of custody at every handoff point in the supply chain.
              </p>
            </div>
            
            <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Leaf className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Sustainability</h3>
              <p className="text-gray-600 leading-relaxed">
                Reducing carbon footprint through optimized routing, load consolidation, and green fleet incentives.
              </p>
            </div>
            
            <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Efficiency</h3>
              <p className="text-gray-600 leading-relaxed">
                Streamlining operations with automated invoicing, instant payments, and real-time visibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-white/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">About Routezy</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Routezy is a next-generation logistics platform dedicated to securing the supply chain and promoting sustainability. 
            Our mission is to provide transparent, secure, and efficient delivery solutions for businesses of all sizes. 
            By leveraging cutting-edge technology like geofencing and real-time tracking, we ensure your goods are always in safe hands.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How does the secure custody work?</AccordionTrigger>
              <AccordionContent>
                We use a combination of OTP verification at pickup and delivery, along with geofencing to ensure that packages are only handed over at the correct location to the authorized person.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>What is the 'Proof-to-Pay' feature?</AccordionTrigger>
              <AccordionContent>
                Our system automatically generates invoices and triggers payments as soon as the delivery is successfully verified, reducing administrative overhead and improving cash flow.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Can I track my shipments in real-time?</AccordionTrigger>
              <AccordionContent>
                Yes, both senders and recipients can track shipments in real-time, viewing the driver's location and estimated time of arrival.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Is Routezy suitable for small businesses?</AccordionTrigger>
              <AccordionContent>
                Absolutely! Routezy is designed to scale with your business, whether you're sending a few packages a week or thousands a day.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-accent rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-accent-foreground" />
            </div>
            <span className="font-bold">Routezy</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Routezy. Built with 🌱 for sustainable delivery.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
