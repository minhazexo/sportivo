import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Trash2, Search, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import apiClient from '../../lib/apiClient';

interface User {
  id: string;
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
        const data = await apiClient.get('/admin/users');
        setUsers(data || []);
      } catch (error) {
        console.error("[UserManagement] Users fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    if (profile?.role === 'admin') {
      fetchUsers();
    }
  }, [profile, authLoading, navigate]);

  async function changeRole(uid: string, newRole: string) {
    try {
      await apiClient.put(`/admin/users/${uid}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error("[UserManagement] Role change error:", error);
      alert(error instanceof Error ? error.message : "Failed to change role");
    }
  }

  async function deleteUser(uid: string) {
    if (!window.confirm('Are you absolutely sure you want to delete this user? This will also cascade delete all their notifications.')) return;
    try {
      await apiClient.delete(`/admin/users/${uid}`);
      setUsers(prev => prev.filter(u => u.id !== uid));
    } catch (error) {
      console.error("[UserManagement] Delete error:", error);
      alert(error instanceof Error ? error.message : "Failed to delete user");
    }
  }

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) return <div className="p-20 text-center uppercase editorial-label text-[var(--color-text-tertiary)]">Loading User Accounts...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="p-2 hover:bg-[var(--color-card-hover)] rounded-lg">
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border border-[var(--color-border-primary)] rounded-lg focus:border-accent outline-none bg-[var(--color-bg-secondary)]"
          />
        </div>
      </div>

      <div className="bg-[var(--color-card-bg)] border border-[var(--color-border-primary)] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-primary)]">
            <tr>
              <th className="p-4 editorial-label text-[var(--color-text-secondary)]">User</th>
              <th className="p-4 editorial-label text-[var(--color-text-secondary)]">Email</th>
              <th className="p-4 editorial-label text-[var(--color-text-secondary)]">Role</th>
              <th className="p-4 editorial-label text-[var(--color-text-secondary)]">Teams</th>
              <th className="p-4 editorial-label text-[var(--color-text-secondary)] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-[var(--color-border-primary)] hover:bg-[var(--color-card-hover)]"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-skeleton)] overflow-hidden">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--color-text-tertiary)] font-bold">
                          {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="font-medium">{user.displayName || 'Unknown'}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-[var(--color-text-secondary)]">{user.email}</td>
                <td className="p-4">
                  <select
                    value={user.role}
                    onChange={(e) => changeRole(user.id, e.target.value)}
                    className="text-xs font-bold uppercase tracking-wider bg-transparent border-none focus:ring-0 cursor-pointer"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                  </select>
                </td>
                <td className="p-4 text-sm text-[var(--color-text-secondary)]">
                  {user.favoriteTeams?.length || 0} teams
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="p-2 text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors"
                    title="Delete User"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </motion.tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>                  <td colSpan={5} className="p-8 text-center text-[var(--color-text-tertiary)] font-medium">
                  No users found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}