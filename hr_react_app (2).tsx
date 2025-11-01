import React, { useState, useEffect, createContext, useContext } from 'react';
import { LayoutDashboard, FileText, ClipboardCheck, BookOpen, BarChart3, Users, Settings, LogOut, Menu, X, Shield, Lock, Plus, Edit2, Trash2, Save, Eye, EyeOff, UserCog } from 'lucide-react';

const STORAGE_KEYS = {
  ROLES: 'roles',
  USERS: 'users',
  LEAVE_REQUESTS: 'leave_requests',
  CURRENT_USER: 'current_user',
  SESSION: 'session'
};

const ALL_PERMISSIONS = [
  { id: 'view_dashboard', name: 'მთავარი გვერდის ნახვა', category: 'Dashboard' },
  { id: 'view_users', name: 'მომხმარებლების ნახვა', category: 'Users' },
  { id: 'create_users', name: 'მომხმარებლების შექმნა', category: 'Users' },
  { id: 'edit_users', name: 'მომხმარებლების რედაქტირება', category: 'Users' },
  { id: 'delete_users', name: 'მომხმარებლების წაშლა', category: 'Users' },
  { id: 'view_roles', name: 'როლების ნახვა', category: 'Roles' },
  { id: 'create_roles', name: 'როლების შექმნა', category: 'Roles' },
  { id: 'edit_roles', name: 'როლების რედაქტირება', category: 'Roles' },
  { id: 'delete_roles', name: 'როლების წაშლა', category: 'Roles' },
  { id: 'view_requests', name: 'მოთხოვნების ნახვა', category: 'Requests' },
  { id: 'create_requests', name: 'მოთხოვნების შექმნა', category: 'Requests' },
  { id: 'approve_requests', name: 'მოთხოვნების დამტკიცება', category: 'Requests' },
  { id: 'manage_permissions', name: 'უფლებების მართვა', category: 'System' }
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
    try {
      const rolesData = await window.storage.get(STORAGE_KEYS.ROLES);
      let loadedRoles = [];
      if (rolesData) {
        loadedRoles = JSON.parse(rolesData.value);
        const adminRole = loadedRoles.find(r => r.id === 1);
        if (!adminRole) {
          const defaultRoles = [
            { id: 1, name: 'Admin', description: 'სისტემის ადმინისტრატორი', permissions: ALL_PERMISSIONS.map(p => p.id) },
            { id: 2, name: 'HR', description: 'HR მენეჯერი', permissions: ['view_dashboard', 'view_users', 'view_requests', 'approve_requests'] },
            { id: 3, name: 'Employee', description: 'თანამშრომელი', permissions: ['view_dashboard', 'view_requests', 'create_requests'] }
          ];
          await window.storage.set(STORAGE_KEYS.ROLES, JSON.stringify(defaultRoles));
          loadedRoles = defaultRoles;
          console.log('✅ Default roles created with fixed IDs (1, 2, 3)');
        } else {
          if (adminRole.permissions.length !== ALL_PERMISSIONS.length) {
            adminRole.permissions = ALL_PERMISSIONS.map(p => p.id);
            await window.storage.set(STORAGE_KEYS.ROLES, JSON.stringify(loadedRoles));
            console.log('✅ Admin role permissions updated');
          }
        }
        setRoles(loadedRoles);
      } else {
        const defaultRoles = [
          { id: 1, name: 'Admin', description: 'სისტემის ადმინისტრატორი', permissions: ALL_PERMISSIONS.map(p => p.id) },
          { id: 2, name: 'HR', description: 'HR მენეჯერი', permissions: ['view_dashboard', 'view_users', 'view_requests', 'approve_requests'] },
          { id: 3, name: 'Employee', description: 'თანამშრომელი', permissions: ['view_dashboard', 'view_requests', 'create_requests'] }
        ];
        await window.storage.set(STORAGE_KEYS.ROLES, JSON.stringify(defaultRoles));
        loadedRoles = defaultRoles;
        setRoles(defaultRoles);
        console.log('✅ Default roles created with fixed IDs');
      }

      const usersData = await window.storage.get(STORAGE_KEYS.USERS);
      let loadedUsers = [];
      
      if (usersData) {
        loadedUsers = JSON.parse(usersData.value);
        const adminExists = loadedUsers.find(u => u.email === 'admin@hr.com');
        if (!adminExists) {
          const adminUser = { id: Date.now(), name: 'Admin User', email: 'admin@hr.com', password: 'admin123', roleId: 1, avatar: 'A' };
          loadedUsers.push(adminUser);
          await window.storage.set(STORAGE_KEYS.USERS, JSON.stringify(loadedUsers));
          console.log('✅ Admin user created:', adminUser);
        }
        setUsers(loadedUsers);
      } else {
        const defaultUsers = [
          { id: 1, name: 'Admin User', email: 'admin@hr.com', password: 'admin123', roleId: 1, avatar: 'A' },
          { id: 2, name: 'HR Manager', email: 'hr@hr.com', password: 'hr123', roleId: 2, avatar: 'H' },
          { id: 3, name: 'Employee User', email: 'user@hr.com', password: 'user123', roleId: 3, avatar: 'E' }
        ];
        await window.storage.set(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
        loadedUsers = defaultUsers;
        setUsers(defaultUsers);
        console.log('✅ Default users created:', defaultUsers);
      }

      const zuraUser = loadedUsers.find(u => u.email === 'zura@hr.com');
      if (zuraUser && zuraUser.roleId !== 1) {
        const updatedUsers = loadedUsers.map(u => u.email === 'zura@hr.com' ? { ...u, roleId: 1 } : u);
        await window.storage.set(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
        setUsers(updatedUsers);
        console.log('✅ zura@hr.com updated to Admin role');
      }

      console.log('📊 Loaded users:', loadedUsers);
      console.log('📊 Loaded roles:', loadedRoles);

      try {
        const sessionData = await window.storage.get(STORAGE_KEYS.SESSION);
        if (sessionData) {
          const session = JSON.parse(sessionData.value);
          const sessionUser = loadedUsers.find(u => u.id === session.userId);
          if (sessionUser) {
            setCurrentUser(sessionUser);
            setIsAuthenticated(true);
          }
        }
      } catch (sessionError) {
        console.log('No active session');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    console.log('🔐 Login attempt started');
    console.log('Available users:', users);
    console.log('Trying to login:', email, password);
    
    const user = users.find(u => {
      console.log(`Checking user: ${u.email} === ${email}? ${u.email === email}`);
      console.log(`Password match: ${u.password} === ${password}? ${u.password === password}`);
      return u.email === email && u.password === password;
    });
    
    console.log('Found user:', user);
    
    if (user) {
      const session = { userId: user.id, timestamp: Date.now() };
      console.log('Creating session:', session);
      
      try {
        await window.storage.set(STORAGE_KEYS.SESSION, JSON.stringify(session));
        console.log('✅ Session saved');
      } catch (error) {
        console.log('❌ Session set error:', error);
      }
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      console.log('✅ Login successful!');
      
      return { success: true };
    }
    
    console.log('❌ Login failed - user not found');
    return { success: false, error: 'არასწორი ელ. ფოსტა ან პაროლი' };
  };

  const logout = async () => {
    try {
      await window.storage.delete(STORAGE_KEYS.SESSION);
    } catch (error) {
      console.log('Session delete error (might not exist):', error);
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
    window.location.reload();
  };

  const hasPermission = (permissionId) => {
    if (!currentUser) {
      console.log('❌ No current user');
      return false;
    }
    if (roles.length === 0) {
      console.log('⚠️ Roles not loaded yet');
      return false;
    }
    console.log('🔍 Looking for roleId:', currentUser.roleId, 'Type:', typeof currentUser.roleId);
    console.log('🔍 Available roles:', roles.map(r => ({ id: r.id, type: typeof r.id, name: r.name, permCount: r.permissions?.length })));
    const userRole = roles.find(r => {
      console.log(`Comparing: r.id=${r.id} (${typeof r.id}) === currentUser.roleId=${currentUser.roleId} (${typeof currentUser.roleId})`);
      return r.id == currentUser.roleId;
    });
    if (!userRole) {
      console.log(`❌ No role found for user. User roleId: ${currentUser.roleId} (${typeof currentUser.roleId})`);
      return false;
    }
    const hasAccess = userRole?.permissions?.includes(permissionId) || false;
    console.log(`🔑 ${permissionId} = ${hasAccess} (Role: ${userRole.name})`);
    return hasAccess;
  };

  const saveRoles = async (newRoles) => {
    await window.storage.set(STORAGE_KEYS.ROLES, JSON.stringify(newRoles));
    setRoles(newRoles);
  };

  const saveUsers = async (newUsers) => {
    await window.storage.set(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
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

  if (!isAuthenticated) {
    return <LoginPage />;
  }

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
      setError(language === 'ka' ? 'შეავსეთ ყველა ველი' : 'Please fill all fields');
      setLoading(false);
      return;
    }

    console.log('Login attempt:', formData.email);
    const result = await login(formData.email, formData.password);
    console.log('Login result:', result);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
    }
  };

  const t = {
    ka: {
      title: 'HR მართვა',
      subtitle: 'შედით თქვენს ანგარიშში',
      email: 'ელ. ფოსტა',
      password: 'პაროლი',
      loginButton: 'შესვლა',
      loggingIn: 'შესვლა...',
      demoAccounts: 'დემო ანგარიშები:'
    },
    en: {
      title: 'HR Management',
      subtitle: 'Login to your account',
      email: 'Email',
      password: 'Password',
      loginButton: 'Login',
      loggingIn: 'Logging in...',
      demoAccounts: 'Demo Accounts:'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-end gap-2 mb-6">
            <button onClick={() => setLanguage('ka')} className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${language === 'ka' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>ქართული</button>
            <button onClick={() => setLanguage('en')} className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${language === 'en' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>English</button>
          </div>

          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📊</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{t[language].title}</h1>
            <p className="text-slate-600">{t[language].subtitle}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t[language].email}</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} onKeyPress={(e) => e.key === 'Enter' && handleSubmit()} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="example@hr.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t[language].password}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} onKeyPress={(e) => e.key === 'Enter' && handleSubmit()} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? t[language].loggingIn : t[language].loginButton}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600 text-center mb-3">{t[language].demoAccounts}</p>
            <div className="space-y-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="font-semibold text-slate-700">Admin:</p>
                <p className="text-slate-600">admin@hr.com / admin123</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="font-semibold text-slate-700">HR:</p>
                <p className="text-slate-600">hr@hr.com / hr123</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="font-semibold text-slate-700">Employee:</p>
                <p className="text-slate-600">user@hr.com / user123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardLayout = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [language, setLanguage] = useState('ka');
  const { hasPermission } = useAppContext();

  const allMenuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: { ka: 'მთავარი', en: 'Dashboard' }, permission: 'view_dashboard' },
    { id: 'profile', icon: UserCog, label: { ka: 'ჩემი გვერდი', en: 'My Profile' }, permission: 'view_dashboard' },
    { id: 'roles', icon: Shield, label: { ka: 'როლები', en: 'Roles' }, permission: 'view_roles' },
    { id: 'users', icon: Users, label: { ka: 'მომხმარებლები', en: 'Users' }, permission: 'view_users' },
    { id: 'permissions', icon: Lock, label: { ka: 'უფლებები', en: 'Permissions' }, permission: 'manage_permissions' }
  ];

  const menuItems = allMenuItems.filter(item => hasPermission(item.permission));

  useEffect(() => {
    if (!hasPermission(menuItems.find(m => m.id === currentPage)?.permission)) {
      setCurrentPage(menuItems[0]?.id || 'dashboard');
    }
  }, [currentPage]);

  const renderPage = () => {
    if (currentPage === 'dashboard' && hasPermission('view_dashboard')) return <DashboardPage language={language} />;
    if (currentPage === 'profile' && hasPermission('view_dashboard')) return <ProfilePage language={language} />;
    if (currentPage === 'roles' && hasPermission('view_roles')) return <RolesPage language={language} />;
    if (currentPage === 'users' && hasPermission('view_users')) return <UsersPage language={language} />;
    if (currentPage === 'permissions' && hasPermission('manage_permissions')) return <PermissionsPage language={language} />;
    return <div>Access Denied</div>;
  };

  return (
    <MainLayout currentPage={currentPage} setCurrentPage={setCurrentPage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} language={language} setLanguage={setLanguage} menuItems={menuItems}>
      {renderPage()}
    </MainLayout>
  );
};

const MainLayout = ({ currentPage, setCurrentPage, sidebarOpen, setSidebarOpen, language, setLanguage, menuItems, children }) => {
  const { currentUser, logout, roles } = useAppContext();
  const getUserRole = () => roles.find(r => r.id === currentUser?.roleId)?.name || 'Unknown';

  return (
    <div className="flex min-h-screen bg-slate-100">
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-gradient-to-b from-slate-800 to-slate-900 text-white fixed h-full overflow-y-auto z-20`}>
        {sidebarOpen && (
          <div className="p-5">
            <div className="flex items-center pb-6 border-b border-slate-700 mb-5">
              <div className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center mr-3 text-2xl">📊</div>
              <div>
                <h2 className="text-lg font-semibold">HR მართვა</h2>
                <p className="text-xs text-slate-400">{getUserRole()}</p>
              </div>
            </div>

            <div className="space-y-1 mb-32">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => setCurrentPage(item.id)} className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${currentPage === item.id ? 'bg-blue-500 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="text-sm">{item.label[language]}</span>
                  </button>
                );
              })}
            </div>

            <div className="absolute bottom-5 left-5 right-5 pt-5 border-t border-slate-700">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">{currentUser?.avatar || 'U'}</div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{currentUser?.name || 'User'}</h4>
                  <p className="text-xs text-slate-400">{currentUser?.email || 'user@hr.com'}</p>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <button onClick={() => setLanguage('ka')} className={`flex-1 py-2 rounded-lg text-xs transition-all ${language === 'ka' ? 'bg-blue-500' : 'bg-slate-700 hover:bg-slate-600'}`}>ქართული</button>
                <button onClick={() => setLanguage('en')} className={`flex-1 py-2 rounded-lg text-xs transition-all ${language === 'en' ? 'bg-blue-500' : 'bg-slate-700 hover:bg-slate-600'}`}>English</button>
              </div>

              <button onClick={() => logout()} className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 hover:bg-red-500/30 transition-all text-sm">
                <LogOut className="w-4 h-4" />
                {language === 'ka' ? 'გასვლა' : 'Logout'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-300`}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="fixed top-4 left-4 z-30 lg:hidden bg-slate-800 text-white p-2 rounded-lg">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

const DashboardPage = ({ language }) => {
  const { currentUser } = useAppContext();
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{language === 'ka' ? 'მთავარი' : 'Dashboard'}</h1>
        <p className="text-slate-600">{language === 'ka' ? 'კეთილი იყოს თქვენი დაბრუნება, ' : 'Welcome back, '}<span className="text-blue-500 font-semibold">{currentUser?.name}!</span></p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm text-slate-600 mb-2">{language === 'ka' ? 'მიმდინარე' : 'Pending'}</h3>
          <div className="text-3xl font-bold text-slate-800">0</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm text-slate-600 mb-2">{language === 'ka' ? 'დამტკიცებული' : 'Approved'}</h3>
          <div className="text-3xl font-bold text-slate-800">0</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm text-slate-600 mb-2">{language === 'ka' ? 'უარყოფილი' : 'Rejected'}</h3>
          <div className="text-3xl font-bold text-slate-800">0</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm text-slate-600 mb-2">{language === 'ka' ? 'დოკუმენტები' : 'Documents'}</h3>
          <div className="text-3xl font-bold text-slate-800">0</div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-5">{language === 'ka' ? 'ბოლო აქტივობა' : 'Recent Activity'}</h2>
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">📊</div>
          <h3 className="text-slate-600 font-medium mb-2">{language === 'ka' ? 'აქტივობა არ არის' : 'No Activity'}</h3>
          <p className="text-slate-400 text-sm">{language === 'ka' ? 'საინტერესო სტატისტიკა მალე გამოჩნდება აქ' : 'Interesting statistics will appear here soon'}</p>
        </div>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  return (
    <div className="text-center py-20">
      <h1 className="text-2xl font-bold text-slate-800">ჩემი გვერდი</h1>
      <p className="text-slate-600 mt-2">Profile page - Coming Soon!</p>
    </div>
  );
};

const RolesPage = () => {
  return (
    <div className="text-center py-20">
      <h1 className="text-2xl font-bold text-slate-800">როლები</h1>
      <p className="text-slate-600 mt-2">Roles page - Coming Soon!</p>
    </div>
  );
};

const UsersPage = () => {
  return (
    <div className="text-center py-20">
      <h1 className="text-2xl font-bold text-slate-800">მომხმარებლები</h1>
      <p className="text-slate-600 mt-2">Users page - Coming Soon!</p>
    </div>
  );
};

const PermissionsPage = () => {
  return (
    <div className="text-center py-20">
      <h1 className="text-2xl font-bold text-slate-800">უფლებები</h1>
      <p className="text-slate-600 mt-2">Permissions page - Coming Soon!</p>
    </div>
  );
};

export default App;