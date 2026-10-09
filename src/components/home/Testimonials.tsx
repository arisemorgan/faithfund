import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';

export function Testimonials() {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Charity Director',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      text: 'FaithFund Connect helped us raise $50,000 in just 2 months. The platform is intuitive and our donors love the transparency.',
      rating: 5
    },
    {
      name: 'Pastor Michael Brown',
      role: 'Church Leader',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      text: 'The live streaming feature has been a game-changer for our church. We can now reach our congregation worldwide.',
      rating: 5
    },
    {
      name: 'Emily Chen',
      role: 'NGO Founder',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
      text: 'Amazing platform! The analytics dashboard helps us understand our donors better and optimize our campaigns.',
      rating: 5
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">
            Loved by <span className="gradient-text">Thousands</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See what our community has to say about FaithFund Connect
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-2xl p-8 relative hover:shadow-xl transition-all"
            >
              <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/20" />
              
              <div className="flex items-center mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-accent fill-accent" />
                ))}
              </div>

              <p className="text-muted-foreground mb-6 italic">"{testimonial.text}"</p>

              <div className="flex items-center space-x-3">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                />
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
