import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Heart, Target, Users, Shield, TrendingUp, Globe } from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: 'Faith-Driven',
      description: 'We believe in the power of faith to transform lives and communities'
    },
    {
      icon: Shield,
      title: 'Transparent',
      description: 'Every donation is tracked and donors can see exactly where their money goes'
    },
    {
      icon: Users,
      title: 'Community-Focused',
      description: 'Building connections between donors, organizations, and beneficiaries'
    },
    {
      icon: Globe,
      title: 'Global Impact',
      description: 'Supporting causes and communities around the world'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Campaigns Launched' },
    { value: '$5M+', label: 'Funds Raised' },
    { value: '50,000+', label: 'Active Donors' },
    { value: '100+', label: 'Countries Reached' }
  ];

  return (
    <>
      <Helmet>
        <title>About Us - FaithFund Connect</title>
        <meta
          name="description"
          content="Learn about FaithFund Connect's mission to empower NGOs, churches, and individuals through seamless fundraising and live-streaming."
        />
      </Helmet>

      <div className="min-h-screen pt-20">
        {/* Hero Section */}
        <section className="gradient-bg py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="gradient-text">Our Mission</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Empowering communities worldwide through faith-based giving and digital connection
              </p>
            </motion.div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-3xl p-8 md:p-12"
            >
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground mb-4">
                  FaithFund Connect was born from a simple vision: to make fundraising accessible 
                  for every NGO, church, and individual with a cause worth supporting. We saw how 
                  traditional fundraising methods created barriers for smaller organizations and 
                  limited their ability to reach potential donors.
                </p>
                <p className="text-muted-foreground mb-4">
                  In 2024, we launched our platform with the goal of democratizing fundraising. 
                  Today, we're proud to serve thousands of organizations and individuals, helping 
                  them raise millions of dollars for causes that matter.
                </p>
                <p className="text-muted-foreground">
                  But we're more than just a fundraising platform. With our integrated live-streaming 
                  features, we help churches and spiritual organizations reach their communities 
                  wherever they are, bridging the physical and digital worlds through faith.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4">
                Our <span className="gradient-text">Values</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="glass rounded-2xl p-6 text-center hover:shadow-xl transition-all"
                  >
                    <div className="bg-gradient-to-br from-primary to-secondary p-4 rounded-2xl w-fit mx-auto mb-4">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-xl mb-2">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4">
                Our <span className="gradient-text">Impact</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Together, we're making a difference
              </p>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 gradient-bg">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">Join Our Mission</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Whether you're looking to support a cause or start your own campaign, 
                we're here to help you make an impact.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/campaigns"
                  className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-2xl transition-all"
                >
                  Explore Campaigns
                </a>
                <a
                  href="/create-campaign"
                  className="px-8 py-4 glass rounded-xl font-semibold hover:shadow-2xl transition-all"
                >
                  Start a Campaign
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
