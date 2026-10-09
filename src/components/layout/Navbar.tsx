import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, User, MessageCircle, Menu, X, LogOut, Globe } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ThemeToggle';
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useTranslation();
  

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // in Navbar.tsx
  const changeLang = (lang: string) => {
  localStorage.setItem("language", lang);
  window.applyTranslation?.(lang);
  };

  return (
    <>
      {/* 🧭 NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass shadow-md' : 'bg-background/95 backdrop-blur'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* LOGO */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <Heart className="h-6 w-6 text-white" fill="white" />
              </div>
              <span className="text-xl font-bold gradient-text hidden sm:inline">
                FaithFund Connect
              </span>
            </Link>

            {/* DESKTOP LINKS */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">Campaigns</Link>
              <Link to="/church-services" className="text-sm font-medium hover:text-primary transition-colors">Church Services</Link>
              <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">About</Link>

              {/* 🌍 LANGUAGE DROPDOWN */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <Globe className="h-4 w-4" />
                    <span>Language</span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Select Language</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => changeLang("en")}>🇬🇧 English</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLang("fr")}>🇫🇷 French</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLang("es")}>🇪🇸 Spanish</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLang("de")}>🇩🇪 German</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLang("nl")}>🇳🇱 Dutch (Netherlands)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLang("pl")}>🇵🇱 Polish</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLang("tr")}>🇹🇷 Turkish</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLang("ar")}>🇸🇦 Arabic</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* RIGHT SECTION */}
            <div className="hidden md:flex items-center space-x-4">
              <ThemeToggle />

              {user ? (
                <>
                  <Button asChild variant="default" size="sm">
                    <Link to="/create-campaign">Start Campaign</Link>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <User className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/dashboard')}>Dashboard</DropdownMenuItem>

                      {user?.role?.toLowerCase() === 'admin' && (
                        <DropdownMenuItem onClick={() => navigate('/admin')}>Admin Panel</DropdownMenuItem>
                      )}

                      <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
                        Profile
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm"><Link to="/login">Login</Link></Button>
                  <Button asChild size="sm"><Link to="/register">Sign Up</Link></Button>
                </>
              )}
            </div>

            {/* 📱 MOBILE BUTTON */}
            <Button variant="ghost" size="icon" className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* 📱 MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="md:hidden glass border-t border-border">
            <div className="px-4 pt-2 pb-4 space-y-3">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block hover:text-primary">Campaigns</Link>
              <Link to="/church-services" onClick={() => setMobileMenuOpen(false)} className="block hover:text-primary">Church Services</Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="block hover:text-primary">About</Link>

              {/* MOBILE LANGUAGE */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full flex items-center justify-center space-x-2">
                    <Globe className="h-4 w-4" /> <span>Language</span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="center" className="w-56">
                  <DropdownMenuLabel>Select Language</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => changeLang("en")}>🇬🇧 English</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLang("fr")}>🇫🇷 French</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLang("es")}>🇪🇸 Spanish</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLang("de")}>🇩🇪 German</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLang("nl")}>🇳🇱 Dutch (Netherlands)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLang("pl")}>🇵🇱 Polish</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLang("tr")}>🇹🇷 Turkish</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLang("ar")}>🇸🇦 Arabic</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="pt-2 space-y-2">
                {user ? (
                  <>
                    <Button variant="outline" className="w-full" onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}>Dashboard</Button>

                    {user?.role?.toLowerCase() === 'admin' && (
                      <Button variant="outline" className="w-full" onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}>Admin Panel</Button>
                    )}

                    <Button variant="outline" className="w-full text-destructive"
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>Logout</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>Login</Button>
                    <Button className="w-full bg-gradient-to-r from-primary to-secondary text-white" onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}>Sign Up</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

    </>
  );
};
