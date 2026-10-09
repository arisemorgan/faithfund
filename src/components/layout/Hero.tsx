import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, TrendingUp, Users, Video } from 'lucide-react';

export function Hero() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Heart,
      title: 'Easy Fundraising',
      description: 'Create campaigns in minutes'
    },
    {
      icon: TrendingUp,
      title: 'Real-time Progress',
      description: 'Track donations instantly'
    },
    {
      icon: Users,
      title: 'Community Support',
      description: 'Connect with donors worldwide'
    },
    {
      icon: Video,
      title: 'Live Streaming',
      description: 'Join spiritual services'
    }
  ];

  return (
    <div className="relative min-h-screen flex items-center gradient-bg overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="gradient-text">Empower Change</span>
              <br />
              <span className="text-foreground">Through Faith & Giving</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl">
              Join thousands of NGOs, churches, and individuals making a difference. 
              Create campaigns, receive donations, and connect through live spiritual services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary text-white hover:shadow-2xl transition-all text-lg px-8 py-6"
                onClick={() => navigate('/create-campaign')}
              >
                Start Your Campaign
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 glass hover:bg-white/20"
                onClick={() => navigate('/campaigns')}
              >
                Explore Campaigns
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Campaigns</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-secondary">$5M+</div>
                <div className="text-sm text-muted-foreground">Raised</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-accent">50K+</div>
                <div className="text-sm text-muted-foreground">Donors</div>
              </div>
            </div>
          </motion.div>

          {/* Right content - Feature cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 gap-6"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="glass rounded-2xl p-6 hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                >
                  <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-xl w-fit mb-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
