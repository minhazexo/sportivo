import { Trophy, Twitter, Facebook, Instagram, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-zinc-200 pt-16 pb-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <span className="editorial-title text-2xl text-editorial-text">SPORTIVO</span>
            </Link>
            <p className="text-[13px] text-zinc-500 leading-relaxed max-w-xs font-medium">
              The world's most comprehensive sports news platform. Delivering real-time scores, expert analysis, and breaking updates since 2026.
            </p>
          </div>

          <div>
            <h4 className="editorial-label text-editorial-text mb-6">Leagues</h4>
            <ul className="space-y-3">
              <li><Link to="#" className="text-[13px] font-bold text-zinc-500 hover:text-accent transition-colors uppercase tracking-tight">Premier League</Link></li>
              <li><Link to="#" className="text-[13px] font-bold text-zinc-500 hover:text-accent transition-colors uppercase tracking-tight">Champions League</Link></li>
              <li><Link to="#" className="text-[13px] font-bold text-zinc-500 hover:text-accent transition-colors uppercase tracking-tight">NBA</Link></li>
              <li><Link to="#" className="text-[13px] font-bold text-zinc-500 hover:text-accent transition-colors uppercase tracking-tight">Formula 1</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="editorial-label text-editorial-text mb-6">Company</h4>
            <ul className="space-y-3">
              <li><Link to="#" className="text-[13px] font-bold text-zinc-500 hover:text-accent transition-colors uppercase tracking-tight">About Us</Link></li>
              <li><Link to="#" className="text-[13px] font-bold text-zinc-500 hover:text-accent transition-colors uppercase tracking-tight">Careers</Link></li>
              <li><Link to="#" className="text-[13px] font-bold text-zinc-500 hover:text-accent transition-colors uppercase tracking-tight">Press</Link></li>
              <li><Link to="#" className="text-[13px] font-bold text-zinc-500 hover:text-accent transition-colors uppercase tracking-tight">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="editorial-label text-editorial-text mb-6">Follow Us</h4>
            <div className="flex gap-4">
              <Link to="#" className="p-2 border border-zinc-100 rounded-lg text-zinc-400 hover:text-accent hover:border-accent transition-all"><Twitter className="w-5 h-5" /></Link>
              <Link to="#" className="p-2 border border-zinc-100 rounded-lg text-zinc-400 hover:text-accent hover:border-accent transition-all"><Instagram className="w-5 h-5" /></Link>
              <Link to="#" className="p-2 border border-zinc-100 rounded-lg text-zinc-400 hover:text-accent hover:border-accent transition-all"><Facebook className="w-5 h-5" /></Link>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">© 2026 SPORTIVO MEDIA NETWORK. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-8">
            <Link to="#" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-editorial-text">Privacy</Link>
            <Link to="#" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-editorial-text">Terms</Link>
            <Link to="#" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-editorial-text">Ad Choices</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
