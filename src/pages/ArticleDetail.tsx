import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import { Calendar, User, MessageCircle, Share2, ChevronLeft, Tag } from 'lucide-react';
import { format } from 'date-fns';

const MOCK_ARTICLE = {
  id: '1',
  title: "Arsenal's Title Charge: How Arteta Built a Defensive Fortress",
  slug: 'arsenal-title-charge',
  category: 'Football',
  thumbnail: 'https://images.unsplash.com/photo-1522770179533-24471fcdba45?q=80&w=2000&auto=format&fit=crop',
  content: `
# The Defensive Evolution

For years, Arsenal were criticized for their "soft underbelly." But under Mikel Arteta, the Gunners have transformed into the Premier League's most disciplined defensive unit.

## The Saliba-Gabriel Partnership
At the heart of this transformation is the partnership between William Saliba and Gabriel Magalhães. The duo has played more minutes together than any other center-back pairing in the league, creating a level of telepathy rarely seen in modern football.

### Tactical Discipline
Arteta's tactical shift to a mid-block press has also played a crucial role. By reducing the space between the midfield and the defensive line, Arsenal have effectively neutralized some of the world's best attackers.

> "Attack wins you games, but defense wins you titles." - Sir Alex Ferguson

As we approach the final stretch of the season, the stats are clear: Arsenal's defense is not just a platform; it's their greatest weapon.
  `,
  authorName: "James Wilson",
  createdAt: new Date().toISOString(),
};

export default function ArticleDetail() {
  const { slug } = useParams();
  const { user, profile } = useAuth();
  const [article, setArticle] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      const path = 'articles';
      try {
        const q = query(
          collection(db, path),
          where('slug', '==', slug),
          limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const artData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          setArticle(artData);
          fetchComments(snapshot.docs[0].id);
        } else if (slug === 'arsenal-title-charge') {
          setArticle(MOCK_ARTICLE);
        }
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          handleFirestoreError(error, OperationType.GET, path);
        }
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
  }, [slug]);

  async function fetchComments(articleId: string) {
    const path = `articles/${articleId}/comments`;
    try {
      const q = query(
        collection(db, path),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.LIST, path);
      }
      console.error("Comments error:", error);
    }
  }

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !user || !article) return;

    const path = `articles/${article.id}/comments`;
    try {
      const commentData = {
        articleId: article.id,
        userId: user.uid,
        userName: profile?.displayName || user.displayName,
        userPhoto: user.photoURL,
        content: newComment,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, path), commentData);
      setNewComment('');
      fetchComments(article.id);
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
      console.error("Comment Error:", error);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full" /></div>;
  if (!article) return <div className="text-center py-20 font-display text-2xl">Article Not Found</div>;

  return (
    <motion.article 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto"
    >
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-600 mb-8 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Home
      </Link>

      <header className="mb-12 space-y-6">
        <div className="flex gap-2">
          <span className="bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded">
            {article.category}
          </span>
        </div>
        <h1 className="font-display font-black text-4xl md:text-6xl tracking-tight text-slate-900 leading-[1.1]">
          {article.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-6 pt-4 border-y border-slate-100 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
              <User className="w-full h-full p-2 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-900">{article.authorName}</p>
              <p className="text-[10px] text-slate-500 uppercase">Senior writer</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">{format(new Date(article.createdAt), 'MMMM dd, yyyy')}</span>
          </div>
          <div className="flex-1" />
          <div className="flex gap-4">
            <button className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-blue-500 transition-colors"><Share2 className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-colors"><MessageCircle className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <div className="aspect-video rounded-3xl overflow-hidden mb-12 shadow-2xl">
        <img src={article.thumbnail} alt={article.title} className="w-full h-full object-cover" />
      </div>

      <div className="markdown-body prose prose-slate max-w-none prose-headings:font-display prose-headings:font-bold prose-h1:text-4xl prose-blockquote:border-red-600 prose-blockquote:bg-slate-50 prose-blockquote:p-6 prose-blockquote:rounded-xl">
        <ReactMarkdown>{article.content}</ReactMarkdown>
      </div>

      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-slate-200">
          <Tag className="w-4 h-4 text-zinc-400 mt-1" />
          {article.tags.map((tag: string, idx: number) => (
            <Link 
              key={idx}
              to={`/tag/${encodeURIComponent(tag.toLowerCase().replace(/ /g, '-'))}`}
              className="px-3 py-1 bg-zinc-100 text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      {/* Comments Section */}
      <section className="mt-20 pt-12 border-t border-slate-200">
        <h3 className="font-display font-bold text-2xl mb-8 flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-red-600" />
          Comments ({comments.length})
        </h3>

        {user ? (
          <form onSubmit={handleCommentSubmit} className="mb-12">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Join the discussion..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all"
              rows={4}
            />
            <div className="flex justify-end mt-4">
              <button 
                type="submit"
                className="px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
              >
                Post Comment
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 bg-slate-50 rounded-2xl text-center mb-12">
            <p className="text-slate-600 text-sm mb-4">Please sign in to join the conversation.</p>
          </div>
        )}

        <div className="space-y-8">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                {comment.userPhoto ? <img src={comment.userPhoto} alt={comment.userName} /> : <User className="w-full h-full p-2 text-slate-400" />}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{comment.userName}</span>
                  <span className="text-[10px] text-slate-400">•</span>
                  <span className="text-[10px] text-slate-400">
                    {comment.createdAt?.toDate ? format(comment.createdAt.toDate(), 'MMM dd') : 'Just now'}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.article>
  );
}
