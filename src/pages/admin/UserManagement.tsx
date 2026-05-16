import { useEffect, useState } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Shield, Trash2, Edit2, Search, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: string;
  createdAt: any;
  favoriteTeams: string[];
}

export default function UserManagement() {
  const { profile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && profile?.role !== 'admin') {
      navigate('/');
      return;
    }

    async function fetchUsers() {
      try {
        const q = query(collection(db, 'users'));
        const snapshot = await getDocs(q);
        setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as User[]);
      } catch (error) {
        console.error("Users fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [profile, authLoading, navigate]);

  async function changeRole(uid: string, newRole: string) {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error("Role change error:", error);
    }
  }

  async function deleteUser(uid: string) {
    if (!window.confirm('Delete this user?')) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
      setUsers(users.filter(u => u.uid !== uid));
    } catch (error) {
      console.error("Delete error:", error);
    }
  }

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) return <div className="p-20 text-center uppercase editorial-label text-zinc-400">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="p-2 hover:bg-zinc-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-accent" />
            <h1 className="editorial-title text-3xl">User Management</h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:border-accent outline-none"
          />
        </div>
      </div>

      <div className="bg-white border border-zinc-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>
              <th className="p-4 editorial-label text-zinc-500">User</th>
              <th className="p-4 editorial-label text-zinc-500">Email</th>
              <th className="p-4 editorial-label text-zinc-500">Role</th>
              <th className="p-4 editorial-label text-zinc-500">Teams</th>
              <th className="p-4 editorial-label text-zinc-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <motion.tr
                key={user.uid}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-zinc-50 hover:bg-zinc-50/50"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                          {user.displayName?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <span className="font-medium">{user.displayName || 'Unknown'}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-zinc-500">{user.email}</td>
                <td className="p-4">
                  <select
                    value={user.role}
                    onChange={(e) => changeRole(user.uid, e.target.value)}
                    className="text-xs font-bold uppercase tracking-wider bg-transparent border-none focus:ring-0 cursor-pointer"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                  </select>
                </td>
                <td className="p-4 text-sm text-zinc-500">
                  {user.favoriteTeams?.length || 0} teams
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => deleteUser(user.uid)}
                    className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}