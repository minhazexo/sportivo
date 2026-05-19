import { Trophy, Twitter, Facebook, Instagram, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t pt-16 pb-12" style={{ backgroundColor: 'var(--color-footer-bg)', borderColor: 'var(--color-border-primary)' }}>
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <span className="editorial-title text-2xl" style={{ color: 'var(--color-text-primary)' }}>SPORTIVO</span>
            </Link>
            <p className="text-[13px] leading-relaxed max-w-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
              The world's most comprehensive sports news platform. Delivering real-time scores, expert analysis, and breaking updates since 2026.
            </p>
          </div>

          <div>
            <h4 className="editorial-label mb-6" style={{ color: 'var(--color-text-primary)' }}>Leagues</h4>
            <ul className="space-y-3">
              <li><Link to="/leagues" className="text-[13px] font-bold hover:text-accent transition-colors uppercase tracking-tight" style={{ color: 'var(--color-text-tertiary)' }}>Premier League</Link></li>
              <li><Link to="/leagues" className="text-[13px] font-bold hover:text-accent transition-colors uppercase tracking-tight" style={{ color: 'var(--color-text-tertiary)' }}>Champions League</Link></li>
              <li><Link to="/leagues" className="text-[13px] font-bold hover:text-accent transition-colors uppercase tracking-tight" style={{ color: 'var(--color-text-tertiary)' }}>NBA</Link></li>
              <li><Link to="/leagues" className="text-[13px] font-bold hover:text-accent transition-colors uppercase tracking-tight" style={{ color: 'var(--color-text-tertiary)' }}>Formula 1</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="editorial-label mb-6" style={{ color: 'var(--color-text-primary)' }}>Company</h4>
            <ul className="space-y-3">
              <li><Link to="/" className="text-[13px] font-bold hover:text-accent transition-colors uppercase tracking-tight" style={{ color: 'var(--color-text-tertiary)' }}>About Us</Link></li>
              <li><Link to="/" className="text-[13px] font-bold hover:text-accent transition-colors uppercase tracking-tight" style={{ color: 'var(--color-text-tertiary)' }}>Careers</Link></li>
              <li><Link to="/" className="text-[13px] font-bold hover:text-accent transition-colors uppercase tracking-tight" style={{ color: 'var(--color-text-tertiary)' }}>Press</Link></li>
              <li><Link to="/" className="text-[13px] font-bold hover:text-accent transition-colors uppercase tracking-tight" style={{ color: 'var(--color-text-tertiary)' }}>Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="editorial-label mb-6" style={{ color: 'var(--color-text-primary)' }}>Follow Us</h4>
            <div className="flex gap-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 border rounded-lg hover:text-accent hover:border-accent transition-all" style={{ borderColor: 'var(--color-border-primary)', color: 'var(--color-text-tertiary)' }}><Twitter className="w-5 h-5" /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 border rounded-lg hover:text-accent hover:border-accent transition-all" style={{ borderColor: 'var(--color-border-primary)', color: 'var(--color-text-tertiary)' }}><Instagram className="w-5 h-5" /></a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 border rounded-lg hover:text-accent hover:border-accent transition-all" style={{ borderColor: 'var(--color-border-primary)', color: 'var(--color-text-tertiary)' }}><Facebook className="w-5 h-5" /></a>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderTop: '1px solid var(--color-border-primary)' }}>
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>© 2026 SPORTIVO MEDIA NETWORK. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-8">
            <Link to="/" className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>Privacy</Link>
            <Link to="/" className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>Terms</Link>
            <Link to="/" className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>Ad Choices</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
