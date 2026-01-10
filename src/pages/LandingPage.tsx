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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-bold text-xl">Routezy</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/login">
              <Button variant="accent">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full text-success mb-6">
                <Leaf className="w-4 h-4" />
                <span className="text-sm font-medium">India's Greenest Logistics Platform</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Secure Custody.{' '}
                <span className="text-gradient">Proof-to-Pay.</span>{' '}
                Sustainable Delivery.
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                The complete logistics platform with OTP-verified handoffs, geofence-locked deliveries, 
                and automatic invoice generation. Built for modern fleets.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/login">
                  <Button variant="hero" size="xl" className="w-full sm:w-auto">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/driver/active">
                  <Button variant="outline" size="xl" className="w-full sm:w-auto">
                    Try Driver Demo
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-gradient">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
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
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How Proof-to-Pay Works
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

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="bg-gradient-hero text-primary-foreground overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center relative">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Zap className="w-12 h-12 mx-auto mb-4 text-accent" />
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to Transform Your Fleet?
                </h2>
                <p className="text-lg opacity-80 max-w-2xl mx-auto mb-8">
                  Join hundreds of logistics companies saving fuel, reducing disputes, 
                  and building customer trust with Routezy.
                </p>
                <Link to="/login">
                  <Button variant="accent" size="xl">
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </motion.div>
            </CardContent>
          </Card>
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
            © 2024 Bharati Logistics. Built with 🌱 for sustainable delivery.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
