import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Github, Twitter, Linkedin, Instagram } from "lucide-react";

const footerLinks = {
  product: [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Resources', href: '/resources' },
    { name: 'FAQ', href: '/faq' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Careers', href: '/careers' },
    { name: 'Contact', href: '/contact' },
  ],
  legal: [
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'Licenses', href: '/licenses' },
  ],
  social: [
    { name: 'Github', href: 'https://github.com', icon: Github },
    { name: 'Twitter', href: 'https://twitter.com', icon: Twitter },
    { name: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin },
    { name: 'Instagram', href: 'https://instagram.com', icon: Instagram },
  ],
};

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 pb-16">
          {/* Brand and Description */}
          <div className="col-span-2 md:col-span-4">
            <Link href="/" className="text-2xl font-bold">
              LEAP
            </Link>
            <p className="mt-4 text-white/70 text-sm leading-relaxed max-w-xs">
              Revolutionizing language learning through AI-powered personalized education and immersive experiences.
            </p>
          </div>

          {/* Product Links */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-sm font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-sm font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-sm font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-sm font-semibold mb-4">Social</h3>
            <ul className="space-y-3">
              {footerLinks.social.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors inline-flex items-center gap-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <link.icon className="h-4 w-4" />
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/70">
              © {currentYear} LEAP. All rights reserved.
            </p>
            <div className="flex items-center gap-8">
              <Link 
                href="/sitemap" 
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                Sitemap
              </Link>
              <Link 
                href="/accessibility" 
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                Accessibility
              </Link>
              <div className="flex items-center gap-4">
                {footerLinks.social.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-white/70 hover:text-white transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <link.icon className="h-5 w-5" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 