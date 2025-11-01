import React, { useState, useEffect, createContext, useContext } from 'react';
import { LayoutDashboard, FileText, Users, Settings, LogOut, Menu, X, Shield, Lock, Plus, Edit2, Trash2, Save, Eye, EyeOff, UserCog, CheckCircle, XCircle, Printer, Clock, Calendar } from 'lucide-react';

// Storage wrapper
const storage = {
  get: (key) => {
    const value = localStorage.getItem(key);
    return value ? { value } : null;
  },
  set: (key, value) => {
    localStorage.setItem(key, value);
    return true;
  },
  delete: (key) => {
    localStorage.removeItem(key);
    return true;
  }
};

const STORAGE_KEYS = {
  ROLES: 'hr_roles',
  USERS: 'hr_users',
  SESSION: 'hr_session',
  TICKET_TYPES: 'hr_ticket_types',
  TICKETS: 'hr_tickets',
  TICKET_HISTORY: 'hr_ticket_history'
};

const ALL_PERMISSIONS = [
  { id: 'view_dashboard', name: 'მთავარი გვერდის ნახვა', category: 'Dashboard' },
  { id: 'view_users', name: 'მომხმარებლების ნახვა', category: 'Users' },
  { id: 'create_users', name: 'მომხმარებლების შექმნა', category: 'Users' },
  { id: 'edit_users', name: 'მომხმარებლების რედაქტირება', category: 'Users' },
  { id: 'delete_users', name: 'მომხმარებლების წაშლა', category: 'Users' },
  { id: 'view_roles', name: 'როლების ნახვა', category: 'Roles' },
  { id: 'manage_permissions', name: 'უფლებების მართვა', category: 'System' },
  { id: 'view_tickets', name: 'განცხადებების ნახვა', category: 'Tickets' },
  { id: 'create_tickets', name: 'განცხადებების შექმნა', category: 'Tickets' },
  { id: 'approve_tickets', name: 'განცხადებების დამტკიცება', category: 'Tickets' },
  { id: 'manage_ticket_types', name: 'განცხადების ტიპების მართვა', category: 'Tickets' }
];

const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAllData = async () => {
    setLoading(true);
    
    const rolesData = storage.get(STORAGE_KEYS.ROLES);
    let loadedRoles = [];
    if (rolesData) {
      loadedRoles = JSON.parse(rolesData.value);
      // Ensure Admin has all permissions
      const adminRole = loadedRoles.find(r => r.id === 1);
      if (adminRole && adminRole.permissions.length !== ALL_PERMISSIONS.length) {
        adminRole.permissions = ALL_PERMISSIONS.map(p => p.id);
        storage.set(STORAGE_KEYS.ROLES, JSON.stringify(loadedRoles));
      }
    } else {
      loadedRoles = [
        { id: 1, name: 'Admin', description: 'სისტემის ადმინისტრატორი', permissions: ALL_PERMISSIONS.map(p => p.id) },
        { id: 2, name: 'HR', description: 'HR მენეჯერი', permissions: ['view_dashboard', 'view_users', 'view_tickets', 'approve_tickets'] },
        { id: 3, name: 'Employee', description: 'თანამშრომელი', permissions: ['view_dashboard', 'view_tickets', 'create_tickets'] }
      ];
      storage.set(STORAGE_KEYS.ROLES, JSON.stringify(loadedRoles));
    }
    setRoles(loadedRoles);

    const usersData = storage.get(STORAGE_KEYS.USERS);
    let loadedUsers = [];
    if (usersData) {
      loadedUsers = JSON.parse(usersData.value);
    } else {
      loadedUsers = [
        { id: 1, name: 'Admin User', email: 'admin@hr.com', password: 'admin123', roleId: 1, avatar: 'A' },
        { id: 2, name: 'HR Manager', email: 'hr@hr.com', password: 'hr123', roleId: 2, avatar: 'H' },
        { id: 3, name: 'Giorgi Maisuradze', email: 'giorgi@hr.com', password: 'user123', roleId: 3, avatar: 'G' }
      ];
      storage.set(STORAGE_KEYS.USERS, JSON.stringify(loadedUsers));
    }
    setUsers(loadedUsers);

    const sessionData = storage.get(STORAGE_KEYS.SESSION);
    if (sessionData) {
      const session = JSON.parse(sessionData.value);
      const sessionUser = loadedUsers.find(u => u.id === session.userId);
      if (sessionUser) {
        setCurrentUser(sessionUser);
        setIsAuthenticated(true);
      }
    }
    
    setLoading(false);
  };

  const login = async (email, password) => {
    const usersData = storage.get(STORAGE_KEYS.USERS);
    let allUsers = [];
    
    if (usersData) {
      allUsers = JSON.parse(usersData.value);
    } else {
      allUsers = [
        { id: 1, name: 'Admin User', email: 'admin@hr.com', password: 'admin123', roleId: 1, avatar: 'A' },
        { id: 2, name: 'HR Manager', email: 'hr@hr.com', password: 'hr123', roleId: 2, avatar: 'H' },
        { id: 3, name: 'Giorgi Maisuradze', email: 'giorgi@hr.com', password: 'user123', roleId: 3, avatar: 'G' }
      ];
      storage.set(STORAGE_KEYS.USERS, JSON.stringify(allUsers));
      setUsers(allUsers);
    }
    
    const user = allUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
      const session = { userId: user.id, timestamp: Date.now() };
      storage.set(STORAGE_KEYS.SESSION, JSON.stringify(session));
      setCurrentUser(user);
      setIsAuthenticated(true);
      if (users.length === 0) setUsers(allUsers);
      return { success: true };
    }
    
    return { success: false, error: 'არასწორი ელ. ფოსტა ან პაროლი' };
  };

  const logout = async () => {
    storage.delete(STORAGE_KEYS.SESSION);
    setCurrentUser(null);
    setIsAuthenticated(false);
    window.location.reload();
  };

  const hasPermission = (permissionId) => {
    if (!currentUser || roles.length === 0) return false;
    const userRole = roles.find(r => r.id === currentUser.roleId);
    return userRole?.permissions?.includes(permissionId) || false;
  };

  const saveRoles = async (newRoles) => {
    storage.set(STORAGE_KEYS.ROLES, JSON.stringify(newRoles));
    setRoles(newRoles);
  };

  const saveUsers = async (newUsers) => {
    storage.set(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
    setUsers(newUsers);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  return (
    <AppContext.Provider value={{ roles, users, currentUser, isAuthenticated, saveRoles, saveUsers, loadAllData, loading, login, logout, hasPermission }}>
      {children}
    </AppContext.Provider>
  );
};

const useAppContext = () => useContext(AppContext);

const App = () => {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
};

const MainApp = () => {
  const { isAuthenticated, loading } = useAppContext();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">იტვირთება...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;
  return <DashboardLayout />;
};

const LoginPage = () => {
  const { login } = useAppContext();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('ka');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    if (!formData.email || !formData.password) {
      setError('შეავსეთ ყველა ველი');
      setLoading(false);
      return;
    }
    const result = await login(formData.email, formData.password);
    setLoading(false);
    if (!result.success) setError(result.error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-end gap-2 mb-6">
            <button onClick={() => setLanguage('ka')} className={`px-3 py-1 rounded-lg text-sm font-medium ${language === 'ka' ? 'bg-blue-500 text-white' : 'bg-slate-100'}`}>ქართული</button>
            <button onClick={() => setLanguage('en')} className={`px-3 py-1 rounded-lg text-sm font-medium ${language === 'en' ? 'bg-blue-500 text-white' : 'bg-slate-100'}`}>English</button>
          </div>
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><span className="text-4xl">📊</span></div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">HR მართვა</h1>
            <p className="text-slate-600">შედით თქვენს ანგარიშში</p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">ელ. ფოსტა</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} onKeyPress={(e) => e.key === 'Enter' && handleSubmit()} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="example@hr.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">პაროლი</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} onKeyPress={(e) => e.key === 'Enter' && handleSubmit()} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">{showPassword ? <EyeOff className="w-5 h-5 text-slate-400" /> : <Eye className="w-5 h-5 text-slate-400" />}</button>
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 font-medium disabled:opacity-50">{loading ? 'შესვლა...' : 'შესვლა'}</button>
          </div>
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600 font-medium mb-2">დემო ანგარიშები:</p>
            <div className="space-y-1 text-xs text-slate-500">
              <div>Admin: admin@hr.com / admin123</div>
              <div>HR: hr@hr.com / hr123</div>
              <div>Employee: giorgi@hr.com / user123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardLayout = () => {
  const { currentUser, logout, roles, users, hasPermission } = useAppContext();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [language, setLanguage] = useState('ka');

  const allMenuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: { ka: 'მთავარი', en: 'Dashboard' }, permission: 'view_dashboard' },
    { id: 'profile', icon: UserCog, label: { ka: 'ჩემი გვერდი', en: 'My Profile' }, permission: 'view_dashboard' },
    { id: 'tickets', icon: FileText, label: { ka: 'განცხადებები', en: 'Tickets' }, permission: 'view_tickets' },
    { id: 'roles', icon: Shield, label: { ka: 'როლები', en: 'Roles' }, permission: 'view_roles' },
    { id: 'users', icon: Users, label: { ka: 'მომხმარებლები', en: 'Users' }, permission: 'view_users' },
    { id: 'permissions', icon: Lock, label: { ka: 'უფლებები', en: 'Permissions' }, permission: 'manage_permissions' }
  ];

  const menuItems = allMenuItems.filter(item => hasPermission(item.permission));
  const getUserRole = () => roles.find(r => r.id === currentUser?.roleId)?.name || 'Unknown';

  const renderPage = () => {
    if (currentPage === 'dashboard') return <DashboardPage language={language} />;
    if (currentPage === 'profile') return <ProfilePage language={language} />;
    if (currentPage === 'tickets') return <TicketsPage language={language} currentUser={currentUser} users={users} roles={roles} hasPermission={hasPermission} />;
    if (currentPage === 'roles') return <RolesPage language={language} />;
    if (currentPage === 'users') return <UsersPage language={language} />;
    if (currentPage === 'permissions') return <PermissionsPage language={language} />;
    return <div>Access Denied</div>;
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-gradient-to-b from-slate-800 to-slate-900 text-white fixed h-full overflow-y-auto z-20`}>
        {sidebarOpen && (
          <div className="p-5">
            <div className="flex items-center pb-6 border-b border-slate-700 mb-5">
              <div className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center mr-3 text-2xl">📊</div>
              <div><h2 className="text-lg font-semibold">HR მართვა</h2><p className="text-xs text-slate-400">{getUserRole()}</p></div>
            </div>
            <div className="space-y-1 mb-32">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => setCurrentPage(item.id)} className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${currentPage === item.id ? 'bg-blue-500 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                    <Icon className="w-5 h-5 mr-3" /><span className="text-sm">{item.label[language]}</span>
                  </button>
                );
              })}
            </div>
            <div className="absolute bottom-5 left-5 right-5 pt-5 border-t border-slate-700">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">{currentUser?.avatar || 'U'}</div>
                <div className="flex-1"><h4 className="text-sm font-medium">{currentUser?.name}</h4><p className="text-xs text-slate-400">{currentUser?.email}</p></div>
              </div>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setLanguage('ka')} className={`flex-1 py-2 rounded-lg text-xs ${language === 'ka' ? 'bg-blue-500' : 'bg-slate-700'}`}>ქართული</button>
                <button onClick={() => setLanguage('en')} className={`flex-1 py-2 rounded-lg text-xs ${language === 'en' ? 'bg-blue-500' : 'bg-slate-700'}`}>English</button>
              </div>
              <button onClick={() => logout()} className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 hover:bg-red-500/30 text-sm"><LogOut className="w-4 h-4" />გასვლა</button>
            </div>
          </div>
        )}
      </div>
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-300`}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="fixed top-4 left-4 z-30 lg:hidden bg-slate-800 text-white p-2 rounded-lg">{sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
        <div className="p-8">{renderPage()}</div>
      </div>
    </div>
  );
};

const DashboardPage = ({ language }) => {
  const { currentUser } = useAppContext();
  return (
    <div>
      <div className="mb-8"><h1 className="text-3xl font-bold text-slate-800 mb-2">მთავარი</h1><p className="text-slate-600">კეთილი იყოს თქვენი დაბრუნება, <span className="text-blue-500 font-semibold">{currentUser?.name}!</span></p></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6"><h3 className="text-sm text-slate-600 mb-2">მიმდინარე</h3><div className="text-3xl font-bold text-slate-800">2</div></div>
        <div className="bg-white rounded-xl shadow-sm p-6"><h3 className="text-sm text-slate-600 mb-2">დამტკიცებული</h3><div className="text-3xl font-bold text-slate-800">5</div></div>
        <div className="bg-white rounded-xl shadow-sm p-6"><h3 className="text-sm text-slate-600 mb-2">უარყოფილი</h3><div className="text-3xl font-bold text-slate-800">1</div></div>
        <div className="bg-white rounded-xl shadow-sm p-6"><h3 className="text-sm text-slate-600 mb-2">სულ განცხადებები</h3><div className="text-3xl font-bold text-slate-800">8</div></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6"><h2 className="text-lg font-semibold text-slate-800 mb-5">ბოლო აქტივობა</h2>
        <div className="text-center py-12"><div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">📊</div><h3 className="text-slate-600 font-medium mb-2">აქტივობა არ არის</h3><p className="text-slate-400 text-sm">საინტერესო სტატისტიკა მალე გამოჩნდება აქ</p></div>
      </div>
    </div>
  );
};

const ProfilePage = () => <div className="text-center py-20"><h1 className="text-2xl font-bold text-slate-800">ჩემი გვერდი</h1><p className="text-slate-600 mt-2">Profile page - Coming Soon!</p></div>;
const RolesPage = () => <div className="text-center py-20"><h1 className="text-2xl font-bold text-slate-800">როლები</h1><p className="text-slate-600 mt-2">Roles page - Coming Soon!</p></div>;
const UsersPage = () => <div className="text-center py-20"><h1 className="text-2xl font-bold text-slate-800">მომხმარებლები</h1><p className="text-slate-600 mt-2">Users page - Coming Soon!</p></div>;
const PermissionsPage = () => <div className="text-center py-20"><h1 className="text-2xl font-bold text-slate-800">უფლებები</h1><p className="text-slate-600 mt-2">Permissions page - Coming Soon!</p></div>;

// ================== TICKET SYSTEM ==================

const generateTicketNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `TKT-${year}-${random}`;
};

const formatDate = (date) => new Date(date).toLocaleDateString('ka-GE');
const formatDateTime = (date) => new Date(date).toLocaleString('ka-GE');

const getStatusColor = (status) => {
  const colors = { draft: 'bg-gray-100 text-gray-700', pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', completed: 'bg-blue-100 text-blue-700' };
  return colors[status] || colors.draft;
};

const getStatusIcon = (status) => {
  const icons = { pending: '🟡', approved: '🟢', rejected: '🔴', completed: '✅' };
  return icons[status] || '⏳';
};

const getStatusLabel = (status, language) => {
  const labels = { ka: { pending: 'მოლოდინში', approved: 'დამტკიცებული', rejected: 'უარყოფილი', completed: 'დასრულებული' }, en: { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', completed: 'Completed' } };
  return labels[language]?.[status] || status;
};

const TicketsPage = ({ language, currentUser, users, roles, hasPermission }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [tickets, setTickets] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const typesData = storage.get(STORAGE_KEYS.TICKET_TYPES);
    if (typesData) {
      setTicketTypes(JSON.parse(typesData.value));
    } else {
      const defaultTypes = [
        { id: 1, name: 'შვებულება', icon: '🏖️', color: '#3B82F6', description: 'წლიური ანაზღაურებადი შვებულება', 
          fields_config: { date_range: { enabled: true, required: true }, comment: { enabled: true, required: true } },
          approval_flow: [{ role: 'Manager', order: 1 }, { role: 'HR', order: 2 }] },
        { id: 2, name: 'Day Off', icon: '🏠', color: '#10B981', description: 'დასვენების დღე',
          fields_config: { date_range: { enabled: true, required: true }, comment: { enabled: true, required: false } },
          approval_flow: [{ role: 'Manager', order: 1 }] }
      ];
      storage.set(STORAGE_KEYS.TICKET_TYPES, JSON.stringify(defaultTypes));
      setTicketTypes(defaultTypes);
    }

    const ticketsData = storage.get(STORAGE_KEYS.TICKETS);
    if (ticketsData) {
      setTickets(JSON.parse(ticketsData.value));
    } else {
      const demoTickets = [
        { id: 1, ticket_number: 'TKT-2024-00001', ticket_type_id: 1, author_id: currentUser.id, status: 'pending', current_step: 'Manager', current_step_order: 1, start_date: '2024-12-20', end_date: '2024-12-27', days_count: 8, comment: 'საახალწლო არდადეგები', created_at: new Date().toISOString() }
      ];
      storage.set(STORAGE_KEYS.TICKETS, JSON.stringify(demoTickets));
      setTickets(demoTickets);
    }
  };

  const getFilteredTickets = () => {
    if (activeTab === 'all') return tickets;
    if (activeTab === 'pending') return tickets.filter(t => t.status === 'pending');
    if (activeTab === 'sent') return tickets.filter(t => t.author_id === currentUser.id);
    return tickets;
  };

  const filteredTickets = getFilteredTickets();
  const getTicketTypeName = (typeId) => ticketTypes.find(t => t.id === typeId)?.name || 'N/A';
  const getTicketTypeIcon = (typeId) => ticketTypes.find(t => t.id === typeId)?.icon || '📋';
  const getUserName = (userId) => users.find(u => u.id === userId)?.name || 'N/A';

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-3xl font-bold text-slate-800 mb-2">განცხადებები</h1><p className="text-slate-600">მართეთ თქვენი განცხადებები</p></div>
        <button onClick={() => setShowCreateForm(true)} className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center gap-2"><Plus className="w-5 h-5" />ახალი განცხადება</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="flex border-b">
          <button onClick={() => setActiveTab('all')} className={`flex-1 px-6 py-4 font-medium ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600'}`}>ყველა განცხადება ({tickets.length})</button>
          <button onClick={() => setActiveTab('pending')} className={`flex-1 px-6 py-4 font-medium ${activeTab === 'pending' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600'}`}>დასადასტურებელი ({tickets.filter(t => t.status === 'pending').length})</button>
          <button onClick={() => setActiveTab('sent')} className={`flex-1 px-6 py-4 font-medium ${activeTab === 'sent' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600'}`}>გაგზავნილი ({tickets.filter(t => t.author_id === currentUser.id).length})</button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12"><FileText className="w-16 h-16 mx-auto text-slate-300 mb-3" /><p className="text-slate-500">განცხადებები არ არის</p></div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">ტიპი</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">გამგზავნი</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">სტატუსი</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">თარიღი</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">მოქმედება</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4"><span className="font-mono text-sm text-slate-600">{ticket.ticket_number}</span></td>
                  <td className="px-6 py-4"><div className="flex items-center gap-2"><span className="text-xl">{getTicketTypeIcon(ticket.ticket_type_id)}</span><span className="text-sm font-medium">{getTicketTypeName(ticket.ticket_type_id)}</span></div></td>
                  <td className="px-6 py-4"><span className="text-sm text-slate-700">{getUserName(ticket.author_id)}</span></td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>{getStatusIcon(ticket.status)} {getStatusLabel(ticket.status, language)}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-slate-600">{formatDate(ticket.created_at)}</span></td>
                  <td className="px-6 py-4 text-right"><button onClick={() => setSelectedTicket(ticket)} className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium"><Eye className="w-4 h-4 inline mr-1" />ნახვა</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selectedTicket && <TicketViewModal ticket={selectedTicket} ticketTypes={ticketTypes} users={users} currentUser={currentUser} language={language} onClose={() => setSelectedTicket(null)} onUpdate={loadData} />}
      {showCreateForm && <CreateTicketModal ticketTypes={ticketTypes} users={users} currentUser={currentUser} language={language} onClose={() => setShowCreateForm(false)} onSuccess={loadData} />}
    </div>
  );
};

const CreateTicketModal = ({ ticketTypes, users, currentUser, language, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [formData, setFormData] = useState({ start_date: '', end_date: '', comment: '' });

  const selectedType = ticketTypes.find(t => t.id === selectedTypeId);

  const handleSubmit = () => {
    if (selectedType?.fields_config.date_range?.required && (!formData.start_date || !formData.end_date)) {
      alert('შეავსეთ თარიღები');
      return;
    }
    if (selectedType?.fields_config.comment?.required && !formData.comment) {
      alert('შეავსეთ კომენტარი');
      return;
    }

    let days_count = 0;
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      days_count = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    const newTicket = {
      id: Date.now(),
      ticket_number: generateTicketNumber(),
      ticket_type_id: selectedTypeId,
      author_id: currentUser.id,
      status: 'pending',
      current_step: selectedType?.approval_flow[0]?.role || 'Manager',
      current_step_order: 1,
      ...formData,
      days_count,
      created_at: new Date().toISOString()
    };

    const ticketsData = storage.get(STORAGE_KEYS.TICKETS);
    const tickets = ticketsData ? JSON.parse(ticketsData.value) : [];
    tickets.push(newTicket);
    storage.set(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));

    const historyEntry = { id: Date.now(), ticket_id: newTicket.id, user_id: currentUser.id, action: 'created', comment: 'განცხადება შექმნილია', created_at: new Date().toISOString() };
    const historyData = storage.get(STORAGE_KEYS.TICKET_HISTORY);
    const history = historyData ? JSON.parse(historyData.value) : [];
    history.push(historyEntry);
    storage.set(STORAGE_KEYS.TICKET_HISTORY, JSON.stringify(history));

    alert('✅ განცხადება წარმატებით შეიქმნა!');
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">ახალი განცხადება</h2>
          {step === 1 && (
            <div>
              <p className="text-slate-600 mb-6">აირჩიეთ განცხადების ტიპი:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {ticketTypes.map(type => (
                  <button key={type.id} onClick={() => { setSelectedTypeId(type.id); setStep(2); }} className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
                    <span className="text-4xl mb-3 block">{type.icon}</span>
                    <h3 className="font-semibold text-slate-800 mb-1">{type.name}</h3>
                    <p className="text-xs text-slate-500">{type.description}</p>
                  </button>
                ))}
              </div>
              <button onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">გაუქმება</button>
            </div>
          )}
          {step === 2 && selectedType && (
            <div>
              <div className="mb-6 p-4 bg-slate-50 rounded-lg flex items-center gap-3">
                <span className="text-3xl">{selectedType.icon}</span>
                <div><h3 className="font-semibold text-slate-800">{selectedType.name}</h3><p className="text-sm text-slate-600">{selectedType.description}</p></div>
              </div>
              <div className="space-y-4 mb-6">
                {selectedType.fields_config.date_range?.enabled && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">📅 პერიოდი {selectedType.fields_config.date_range.required && <span className="text-red-500">*</span>}</label>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                      <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                )}
                {selectedType.fields_config.comment?.enabled && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">💬 კომენტარი {selectedType.fields_config.comment.required && <span className="text-red-500">*</span>}</label>
                    <textarea value={formData.comment} onChange={(e) => setFormData({ ...formData, comment: e.target.value })} rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="მიუთითეთ დეტალები..." />
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">უკან</button>
                <button onClick={handleSubmit} className="flex-1 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">📤 გაგზავნა</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TicketViewModal = ({ ticket, ticketTypes, users, currentUser, language, onClose, onUpdate }) => {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [comment, setComment] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const historyData = storage.get(STORAGE_KEYS.TICKET_HISTORY);
    if (historyData) {
      const allHistory = JSON.parse(historyData.value);
      setHistory(allHistory.filter(h => h.ticket_id === ticket.id));
    }
  }, [ticket.id]);

  const ticketType = ticketTypes.find(t => t.id === ticket.ticket_type_id);
  const author = users.find(u => u.id === ticket.author_id);
  const isAuthor = ticket.author_id === currentUser.id;
  const isRejected = ticket.status === 'rejected' && isAuthor;

  const handleApprove = () => {
    const ticketsData = storage.get(STORAGE_KEYS.TICKETS);
    const tickets = JSON.parse(ticketsData.value);
    const updatedTickets = tickets.map(t => {
      if (t.id === ticket.id) {
        const isLastStep = t.current_step_order >= ticketType.approval_flow.length;
        return { ...t, status: isLastStep ? 'approved' : 'pending', current_step_order: isLastStep ? t.current_step_order : t.current_step_order + 1, current_step: isLastStep ? 'Completed' : ticketType.approval_flow[t.current_step_order]?.role };
      }
      return t;
    });
    storage.set(STORAGE_KEYS.TICKETS, JSON.stringify(updatedTickets));

    const historyEntry = { id: Date.now(), ticket_id: ticket.id, user_id: currentUser.id, action: 'approved', comment: comment || 'დადასტურებულია', created_at: new Date().toISOString() };
    const historyData = storage.get(STORAGE_KEYS.TICKET_HISTORY);
    const allHistory = historyData ? JSON.parse(historyData.value) : [];
    allHistory.push(historyEntry);
    storage.set(STORAGE_KEYS.TICKET_HISTORY, JSON.stringify(allHistory));

    alert('✅ განცხადება დადასტურებულია!');
    onUpdate();
    onClose();
  };

  const handleReject = () => {
    if (!comment.trim()) { alert('მიუთითეთ უარყოფის მიზეზი'); return; }

    const ticketsData = storage.get(STORAGE_KEYS.TICKETS);
    const tickets = JSON.parse(ticketsData.value);
    const updatedTickets = tickets.map(t => {
      if (t.id === ticket.id) {
        return { ...t, status: 'rejected', current_step_order: Math.max(1, t.current_step_order - 1), current_step: t.current_step_order === 1 ? 'Employee' : ticketType.approval_flow[t.current_step_order - 2]?.role, current_step_user_id: t.author_id };
      }
      return t;
    });
    storage.set(STORAGE_KEYS.TICKETS, JSON.stringify(updatedTickets));

    const historyEntry = { id: Date.now(), ticket_id: ticket.id, user_id: currentUser.id, action: 'rejected', comment: comment, created_at: new Date().toISOString() };
    const historyData = storage.get(STORAGE_KEYS.TICKET_HISTORY);
    const allHistory = historyData ? JSON.parse(historyData.value) : [];
    allHistory.push(historyEntry);
    storage.set(STORAGE_KEYS.TICKET_HISTORY, JSON.stringify(allHistory));

    alert('❌ განცხადება უარყოფილია');
    onUpdate();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{ticketType?.icon}</span>
              <div><h2 className="text-2xl font-bold">{ticketType?.name}</h2><p className="text-slate-300 text-sm">{ticket.ticket_number}</p></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="p-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg"><Printer className="w-5 h-5" /></button>
              <button onClick={onClose} className="p-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg">✕</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-4 py-2 rounded-lg font-medium ${getStatusColor(ticket.status)}`}>{getStatusIcon(ticket.status)} {getStatusLabel(ticket.status, language)}</span>
            <span className="text-slate-300 text-sm">• {formatDateTime(ticket.created_at)}</span>
          </div>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-800 mb-3">🔄 მიმდინარე მდგომარეობა:</h3>
            <div className="flex items-center gap-2 overflow-x-auto">
              {ticketType?.approval_flow.map((step, idx) => (
                <React.Fragment key={idx}>
                  <div className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 ${idx < ticket.current_step_order - 1 ? 'bg-green-100 border-green-500 text-green-700' : idx === ticket.current_step_order - 1 ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-slate-100 border-slate-300 text-slate-500'}`}>
                    <div className="text-xs font-medium">{step.role}</div>
                    <div className="text-xs mt-1">{idx < ticket.current_step_order - 1 ? '✅' : idx === ticket.current_step_order - 1 ? '⏱️' : '⏳'}</div>
                  </div>
                  {idx < ticketType.approval_flow.length - 1 && <span className="text-slate-400">→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-slate-500">გამგზავნი:</label><p className="text-slate-800 font-medium">{author?.name}</p></div>
              <div><label className="text-sm font-medium text-slate-500">თარიღი:</label><p className="text-slate-800">{formatDateTime(ticket.created_at)}</p></div>
            </div>
            {ticket.start_date && (
              <div><label className="text-sm font-medium text-slate-500">📅 პერიოდი:</label><p className="text-slate-800 font-medium">{formatDate(ticket.start_date)} - {formatDate(ticket.end_date)} {ticket.days_count && <span className="text-slate-500 ml-2">({ticket.days_count} დღე)</span>}</p></div>
            )}
            {ticket.comment && (
              <div><label className="text-sm font-medium text-slate-500">💬 კომენტარი:</label><p className="text-slate-800 bg-slate-50 p-3 rounded-lg">{ticket.comment}</p></div>
            )}
          </div>
          <div className="mb-6">
            <h3 className="font-semibold text-slate-800 mb-3">📜 ისტორია:</h3>
            <div className="space-y-3">
              {history.map(entry => {
                const entryUser = users.find(u => u.id === entry.user_id);
                return (
                  <div key={entry.id} className="flex gap-3 text-sm">
                    <div className="text-slate-500 whitespace-nowrap">{formatDateTime(entry.created_at)}</div>
                    <div className="flex-1"><span className="font-medium text-slate-800">{entryUser?.name || 'System'}</span>{' - '}<span className="text-slate-600">{entry.comment}</span></div>
                  </div>
                );
              })}
            </div>
          </div>
          {ticket.status === 'pending' && (
            <div className="flex gap-3 pt-6 border-t">
              <button onClick={() => setShowApproveModal(true)} className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" />დადასტურება</button>
              <button onClick={() => setShowRejectModal(true)} className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"><XCircle className="w-5 h-5" />უარყოფა</button>
            </div>
          )}
          {isRejected && (
            <div className="pt-6 border-t">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"><p className="text-red-700 font-medium">⚠️ განცხადება უარყოფილია</p></div>
              <div className="flex gap-3">
                <button className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">✏️ რედაქტირება</button>
                <button className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600">📤 თავიდან გაგზავნა</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">✅ დადასტურება</h3>
            <label className="block text-sm font-medium text-slate-700 mb-2">💬 კომენტარი (არასავალდებულო):</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4" placeholder="კომენტარი..." />
            <div className="flex gap-3">
              <button onClick={() => setShowApproveModal(false)} className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">გაუქმება</button>
              <button onClick={handleApprove} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">დადასტურება</button>
            </div>
          </div>
        </div>
      )}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">❌ უარყოფა</h3>
            <label className="block text-sm font-medium text-slate-700 mb-2">💬 უარყოფის მიზეზი (სავალდებულო): <span className="text-red-500">*</span></label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 mb-4" placeholder="მიუთითეთ უარყოფის მიზეზი..." />
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">გაუქმება</button>
              <button onClick={handleReject} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">უარყოფა</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;