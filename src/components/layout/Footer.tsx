import React, { useState } from "react";
import Modal from "../Modal";
import { Heart, Mail, MapPin, Phone, Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-xl">
                <Heart className="h-6 w-6 text-white" fill="white" />
              </div>
              <span className="text-lg font-bold gradient-text">FaithFund Connect</span>
            </div>

            <p className="text-sm text-muted-foreground">
              Empowering NGOs, churches, and individuals to make a lasting impact through faith and giving.
            </p>

            <div className="flex space-x-4 mt-4">
              <Facebook className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
              <Twitter className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
              <Instagram className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
              <Youtube className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/campaigns" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Browse Campaigns
                </Link>
              </li>

              <li>
                <Link to="/create-campaign" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Start Campaign
                </Link>
              </li>

              <li>
                <Link to="/church-services" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Church Live
                </Link>
              </li>

              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Support — NOW POPUPS */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">

              <li>
                <button
                  onClick={() => setOpen("how")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  How It Works
                </button>
              </li>

              <li>
                <button
                  onClick={() => setOpen("faq")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  FAQ
                </button>
              </li>

              <li>
                <button
                  onClick={() => setOpen("contact")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact Us
                </button>
              </li>

              <li>
                <button
                  onClick={() => setOpen("terms")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Terms & Privacy
                </button>
              </li>

            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Get in Touch</h3>

            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <Mail className="h-4 w-4 text-primary mt-0.5" />
                <span className="text-sm text-muted-foreground">support@faithfund.org</span>
              </li>

              <li className="flex items-start space-x-2">
                <Phone className="h-4 w-4 text-primary mt-0.5" />
                <span className="text-sm text-muted-foreground">+1 (555) 123-4567</span>
              </li>

              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span className="text-sm text-muted-foreground">
                  123 Faith Street, Hope City, HC 12345
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* COPYRIGHT */}
        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} FaithFund Connect. All rights reserved. Made with{" "}
            <Heart className="inline h-4 w-4 text-destructive" fill="currentColor" /> for a better world.
          </p>
        </div>
      </div>

      {/* ============================
          🔥 POPUP MODALS 
         ============================ */}

      {/* HOW IT WORKS */}
      <Modal open={open === "how"} onClose={() => setOpen(null)} title="How It Works">
        <ol className="space-y-4 list-decimal pl-6 text-sm text-muted-foreground leading-relaxed">
          <li>Create your free account.</li>
          <li>Start a fundraising campaign.</li>
          <li>Share it with your community.</li>
          <li>Receive donations instantly.</li>
        </ol>
      </Modal>

      {/* FAQ */}
      <Modal open={open === "faq"} onClose={() => setOpen(null)} title="Frequently Asked Questions">
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <div>
            <h4 className="font-medium">How do I withdraw funds?</h4>
            <p>Your dashboard contains a “Withdraw” section for easy payouts.</p>
          </div>

          <div>
            <h4 className="font-medium">Do campaigns get reviewed?</h4>
            <p>Yes, every campaign is reviewed before going live.</p>
          </div>
        </div>
      </Modal>

      {/* CONTACT */}
      <Modal open={open === "contact"} onClose={() => setOpen(null)} title="Contact Us">
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>We’d love to hear from you. Fill the form below:</p>

          <input className="border p-2 w-full rounded" placeholder="Your Name" />
          <input className="border p-2 w-full rounded" placeholder="Your Email" />
          <textarea className="border p-2 w-full rounded h-28" placeholder="Your Message"></textarea>

          <button className="bg-primary text-white px-4 py-2 rounded">
            Send Message
          </button>
        </div>
      </Modal>

      {/* TERMS & PRIVACY */}
      <Modal open={open === "terms"} onClose={() => setOpen(null)} title="Terms & Privacy">
        <p className="text-sm text-muted-foreground leading-relaxed">
          We are committed to protecting your privacy. Your data is never shared without consent.
        </p>
      </Modal>

    </footer>
  );
}
