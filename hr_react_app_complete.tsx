import React, { useState, useEffect, createContext, useContext } from 'react';
import { LayoutDashboard, FileText, ClipboardCheck, BookOpen, BarChart3, Users, Settings, LogOut, Menu, X, Shield, Lock, Plus, Edit2, Trash2, Save, Eye, EyeOff, UserCog } from 'lucide-react';

// Storage wrapper for localStorage
const storage = {
  async get(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? { value } : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },
  async set(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },
  async delete(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage delete error:', error);
      return false;
    }
  }
};

const STORAGE_KEYS = {
  ROLES: 'hr_roles',
  USERS: 'hr_users',
  LEAVE_REQUESTS: 'hr_leave_requests',
  CURRENT_USER: 'hr_current_user',
  SESSION: 'hr_session'
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
      const rolesData = await storage.get(STORAGE_KEYS.ROLES);
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
          await storage.set(STORAGE_KEYS.ROLES, JSON.stringify(defaultRoles));
          loadedRoles = defaultRoles;
          console.log('✅ Default roles created with fixed IDs (1, 2, 3)');
        } else {
          if (adminRole.permissions.length !== ALL_PERMISSIONS.length) {
            adminRole.permissions = ALL_PERMISSIONS.map(p => p.id);
            await storage.set(STORAGE_KEYS.ROLES, JSON.stringify(loadedRoles));
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
        await storage.set(STORAGE_KEYS.ROLES, JSON.stringify(defaultRoles));
        loadedRoles = defaultRoles;
        setRoles(defaultRoles);
        console.log('✅ Default roles created with fixed IDs');
      }

      const usersData = await storage.get(STORAGE_KEYS.USERS);
      let loadedUsers = [];
      
      if (usersData) {
        loadedUsers = JSON.parse(usersData.value);
        const adminExists = loadedUsers.find(u => u.email === 'admin@hr.com');
        if (!adminExists) {
          const adminUser = { id: Date.now(), name: 'Admin User', email: 'admin@hr.com', password: 'admin123', roleId: 1, avatar: 'A' };
          loadedUsers.push(adminUser);
          await storage.set(STORAGE_KEYS.USERS, JSON.stringify(loadedUsers));
          console.log('✅ Admin user created:', adminUser);
        }
        setUsers(loadedUsers);
      } else {
        const defaultUsers = [
          { id: 1, name: 'Admin User', email: 'admin@hr.com', password: 'admin123', roleId: 1, avatar: 'A' },
          { id: 2, name: 'HR Manager', email: 'hr@hr.com', password: 'hr123', roleId: 2, avatar: 'H' },
          { id: 3, name: 'Employee User', email: 'user@hr.com', password: 'user123', roleId: 3, avatar: 'E' }
        ];
        await storage.set(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
        loadedUsers = defaultUsers;
        setUsers(defaultUsers);
        console.log('✅ Default users created:', defaultUsers);
      }

      const zuraUser = loadedUsers.find(u => u.email === 'zura@hr.com');
      if (zuraUser && zuraUser.roleId !== 1) {
        const updatedUsers = loadedUsers.map(u => u.email === 'zura@hr.com' ? { ...u, roleId: 1 } : u);
        await storage.set(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
        setUsers(updatedUsers);
        console.log('✅ zura@hr.com updated to Admin role');
      }

      console.log('📊 Loaded users:', loadedUsers);
      console.log('📊 Loaded roles:', loadedRoles);

      try {
        const sessionData = await storage.get(STORAGE_KEYS.SESSION);
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
    console.log('Trying to login:', email, password);
    
    try {
      // წავიკითხოთ მომხმარებლები პირდაპირ storage-დან
      const usersData = await storage.get(STORAGE_KEYS.USERS);
      let allUsers = [];
      
      if (usersData) {
        allUsers = JSON.parse(usersData.value);
        console.log('📊 Loaded users from storage:', allUsers);
      } else {
        console.log('⚠️ No users in storage, creating defaults');
        // თუ არ არის მომხმარებლები, შევქმნათ default-ები
        allUsers = [
          { id: 1, name: 'Admin User', email: 'admin@hr.com', password: 'admin123', roleId: 1, avatar: 'A' },
          { id: 2, name: 'HR Manager', email: 'hr@hr.com', password: 'hr123', roleId: 2, avatar: 'H' },
          { id: 3, name: 'Employee User', email: 'user@hr.com', password: 'user123', roleId: 3, avatar: 'E' }
        ];
        await storage.set(STORAGE_KEYS.USERS, JSON.stringify(allUsers));
        setUsers(allUsers);
      }
      
      const user = allUsers.find(u => {
        console.log(`Checking user: ${u.email} === ${email}? ${u.email === email}`);
        console.log(`Password match: ${u.password} === ${password}? ${u.password === password}`);
        return u.email === email && u.password === password;
      });
      
      console.log('Found user:', user);
      
      if (user) {
        const session = { userId: user.id, timestamp: Date.now() };
        console.log('Creating session:', session);
        
        try {
          await storage.set(STORAGE_KEYS.SESSION, JSON.stringify(session));
          console.log('✅ Session saved');
        } catch (error) {
          console.log('❌ Session set error:', error);
        }
        
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        // განვაახლოთ users state
        if (users.length === 0) {
          setUsers(allUsers);
        }
        
        console.log('✅ Login successful!');
        return { success: true };
      }
      
      console.log('❌ Login failed - user not found');
      return { success: false, error: 'არასწორი ელ. ფოსტა ან პაროლი' };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: 'შესვლის შეცდომა' };
    }
  };

  const logout = async () => {
    try {
      await storage.delete(STORAGE_KEYS.SESSION);
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
    await storage.set(STORAGE_KEYS.ROLES, JSON.stringify(newRoles));
    setRoles(newRoles);
  };

  const saveUsers = async (newUsers) => {
    await storage.set(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
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

const ProfilePage = ({ language }) => {
  const { currentUser, roles, users, saveUsers } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    newPassword: '',
    confirmPassword: ''
  });

  const userRole = roles.find(r => r.id === currentUser?.roleId);

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      alert(language === 'ka' ? 'შეავსეთ ყველა ველი' : 'Fill all fields');
      return;
    }

    if (showPasswordChange) {
      if (formData.newPassword !== formData.confirmPassword) {
        alert(language === 'ka' ? 'პაროლები არ ემთხვევა' : 'Passwords do not match');
        return;
      }
      if (formData.newPassword.length < 6) {
        alert(language === 'ka' ? 'პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო' : 'Password must be at least 6 characters');
        return;
      }
    }

    const updatedUsers = users.map(u => 
      u.id === currentUser.id 
        ? { 
            ...u, 
            name: formData.name, 
            email: formData.email,
            ...(showPasswordChange && formData.newPassword ? { password: formData.newPassword } : {})
          } 
        : u
    );

    await saveUsers(updatedUsers);
    setIsEditing(false);
    setShowPasswordChange(false);
    setFormData({ ...formData, newPassword: '', confirmPassword: '' });
    alert(language === 'ka' ? 'ინფორმაცია განახლდა' : 'Information updated');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{language === 'ka' ? 'ჩემი გვერდი' : 'My Profile'}</h1>
        <p className="text-slate-600">{language === 'ka' ? 'თქვენი პირადი ინფორმაცია და უფლებები' : 'Your personal information and permissions'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-800">{language === 'ka' ? 'პირადი ინფორმაცია' : 'Personal Information'}</h2>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                  <Edit2 className="w-4 h-4" />
                  {language === 'ka' ? 'რედაქტირება' : 'Edit'}
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{language === 'ka' ? 'სრული სახელი' : 'Full Name'}</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{language === 'ka' ? 'ელ. ფოსტა' : 'Email'}</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="pt-4 border-t">
                  <button onClick={() => setShowPasswordChange(!showPasswordChange)} className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    {language === 'ka' ? 'პაროლის შეცვლა' : 'Change Password'}
                  </button>

                  {showPasswordChange && (
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{language === 'ka' ? 'ახალი პაროლი' : 'New Password'}</label>
                        <div className="relative">
                          <input type={showPassword ? 'text' : 'password'} value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{language === 'ka' ? 'გაიმეორეთ პაროლი' : 'Confirm Password'}</label>
                        <input type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={handleSave} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {language === 'ka' ? 'შენახვა' : 'Save'}
                  </button>
                  <button onClick={() => { setIsEditing(false); setShowPasswordChange(false); setFormData({ name: currentUser?.name || '', email: currentUser?.email || '', newPassword: '', confirmPassword: '' }); }} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300">
                    {language === 'ka' ? 'გაუქმება' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">{language === 'ka' ? 'სრული სახელი' : 'Full Name'}</p>
                  <p className="text-lg font-medium text-slate-800">{currentUser?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">{language === 'ka' ? 'ელ. ფოსტა' : 'Email'}</p>
                  <p className="text-lg font-medium text-slate-800">{currentUser?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">{language === 'ka' ? 'პაროლი' : 'Password'}</p>
                  <p className="text-lg font-medium text-slate-800">••••••••</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">{language === 'ka' ? 'ჩემი უფლებები' : 'My Permissions'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {userRole?.permissions?.map(perm => {
                const permInfo = ALL_PERMISSIONS.find(p => p.id === perm);
                return permInfo ? (
                  <div key={perm} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-slate-700">{permInfo.name}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-blue-100">{language === 'ka' ? 'თქვენი როლი' : 'Your Role'}</p>
                <p className="text-xl font-bold">{userRole?.name}</p>
              </div>
            </div>
            <p className="text-sm text-blue-100">{userRole?.description}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">{language === 'ka' ? 'უფლებები' : 'Permissions'}</p>
                <p className="text-2xl font-bold text-slate-800">{userRole?.permissions?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">{language === 'ka' ? 'სტატუსი' : 'Status'}</p>
                <p className="text-2xl font-bold text-slate-800">{language === 'ka' ? 'აქტიური' : 'Active'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RolesPage = ({ language }) => {
  const { roles, saveRoles, hasPermission } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const canCreate = hasPermission('create_roles');
  const canEdit = hasPermission('edit_roles');
  const canDelete = hasPermission('delete_roles');

  const handleSave = async () => {
    if (!formData.name) {
      alert('შეავსეთ სახელი');
      return;
    }

    let updatedRoles;
    if (editingRole) {
      if (!canEdit) {
        alert('თქვენ არ გაქვთ რედაქტირების უფლება');
        return;
      }
      updatedRoles = roles.map(r => r.id === editingRole.id ? { ...r, ...formData } : r);
    } else {
      if (!canCreate) {
        alert('თქვენ არ გაქვთ შექმნის უფლება');
        return;
      }
      const newRole = { id: Date.now(), ...formData, permissions: [] };
      updatedRoles = [...roles, newRole];
    }

    await saveRoles(updatedRoles);
    setShowForm(false);
    setEditingRole(null);
    setFormData({ name: '', description: '' });
  };

  const handleDelete = async (roleId) => {
    if (!canDelete) {
      alert('თქვენ არ გაქვთ წაშლის უფლება');
      return;
    }
    if (!confirm('დარწმუნებული ხართ?')) return;
    const updatedRoles = roles.filter(r => r.id !== roleId);
    await saveRoles(updatedRoles);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">როლების მართვა</h1>
          <p className="text-slate-600">შექმენით და მართეთ როლები</p>
        </div>
        {canCreate && (
          <button onClick={() => { setShowForm(true); setEditingRole(null); setFormData({ name: '', description: '' }); }} className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center gap-2">
            <Plus className="w-5 h-5" /> ახალი როლი
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">{editingRole ? 'როლის რედაქტირება' : 'ახალი როლი'}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">როლის სახელი</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">აღწერა</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2">
                <Save className="w-4 h-4" /> შენახვა
              </button>
              <button onClick={() => { setShowForm(false); setEditingRole(null); }} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300">
                გაუქმება
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map(role => (
          <div key={role.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{role.name}</h3>
                  <p className="text-sm text-slate-500">{role.permissions?.length || 0} უფლება</p>
                </div>
              </div>
              <div className="flex gap-2">
                {canEdit && (
                  <button onClick={() => { setEditingRole(role); setFormData({ name: role.name, description: role.description }); setShowForm(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => handleDelete(role.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-600">{role.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const UsersPage = ({ language }) => {
  const { users, roles, saveUsers, hasPermission } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', roleId: '' });

  const canCreate = hasPermission('create_users');
  const canEdit = hasPermission('edit_users');
  const canDelete = hasPermission('delete_users');

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.roleId) {
      alert('შეავსეთ ყველა ველი');
      return;
    }

    let updatedUsers;
    if (editingUser) {
      if (!canEdit) {
        alert('თქვენ არ გაქვთ რედაქტირების უფლება');
        return;
      }
      updatedUsers = users.map(u => u.id === editingUser.id ? { ...u, ...formData, password: formData.password || u.password } : u);
    } else {
      if (!canCreate) {
        alert('თქვენ არ გაქვთ შექმნის უფლება');
        return;
      }
      if (!formData.password) {
        alert('შეიყვანეთ პაროლი');
        return;
      }
      const newUser = { id: Date.now(), ...formData, avatar: formData.name.charAt(0).toUpperCase() };
      updatedUsers = [...users, newUser];
    }

    await saveUsers(updatedUsers);
    setShowForm(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', roleId: '' });
  };

  const handleDelete = async (userId) => {
    if (!canDelete) {
      alert('თქვენ არ გაქვთ წაშლის უფლება');
      return;
    }
    if (!confirm('დარწმუნებული ხართ?')) return;
    const updatedUsers = users.filter(u => u.id !== userId);
    await saveUsers(updatedUsers);
  };

  const getRoleName = (roleId) => roles.find(r => r.id === roleId)?.name || 'N/A';

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">მომხმარებლების მართვა</h1>
          <p className="text-slate-600">მართეთ სისტემის მომხმარებლები</p>
        </div>
        {canCreate && (
          <button onClick={() => { setShowForm(true); setEditingUser(null); setFormData({ name: '', email: '', password: '', roleId: '' }); }} className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center gap-2">
            <Plus className="w-5 h-5" /> ახალი მომხმარებელი
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">{editingUser ? 'მომხმარებლის რედაქტირება' : 'ახალი მომხმარებელი'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">სრული სახელი</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">ელ. ფოსტა</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">პაროლი</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">როლი</label>
              <select value={formData.roleId} onChange={(e) => setFormData({ ...formData, roleId: Number(e.target.value) })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">აირჩიეთ როლი</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2">
              <Save className="w-4 h-4" /> შენახვა
            </button>
            <button onClick={() => { setShowForm(false); setEditingUser(null); }} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300">
              გაუქმება
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">მომხმარებლები არ არის</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">მომხმარებელი</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">ელ. ფოსტა</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">როლი</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">მოქმედებები</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">{user.avatar}</div>
                      <span className="font-medium text-slate-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">{getRoleName(user.roleId)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      {canEdit && (
                        <button onClick={() => { setEditingUser(user); setFormData({ name: user.name, email: user.email, password: '', roleId: user.roleId }); setShowForm(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => handleDelete(user.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const PermissionsPage = ({ language }) => {
  const { roles, saveRoles, hasPermission } = useAppContext();
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  const canManage = hasPermission('manage_permissions');

  useEffect(() => {
    if (selectedRole) {
      const role = roles.find(r => r.id === selectedRole);
      setRolePermissions(role?.permissions || []);
      setHasChanges(false);
    }
  }, [selectedRole, roles]);

  const togglePermission = (permissionId) => {
    if (!canManage) {
      alert(language === 'ka' ? 'თქვენ არ გაქვთ უფლებების მართვის უფლება' : 'You do not have permission management rights');
      return;
    }
    
    setRolePermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(p => p !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!canManage) {
      alert(language === 'ka' ? 'თქვენ არ გაქვთ უფლებების მართვის უფლება' : 'You do not have permission management rights');
      return;
    }

    const updatedRoles = roles.map(role => 
      role.id === selectedRole 
        ? { ...role, permissions: rolePermissions }
        : role
    );
    
    await saveRoles(updatedRoles);
    setHasChanges(false);
    alert(language === 'ka' ? 'უფლებები წარმატებით შენახულია!' : 'Permissions saved successfully!');
  };

  const handleSelectAll = () => {
    if (!canManage) return;
    setRolePermissions(ALL_PERMISSIONS.map(p => p.id));
    setHasChanges(true);
  };

  const handleDeselectAll = () => {
    if (!canManage) return;
    setRolePermissions([]);
    setHasChanges(true);
  };

  const groupedPermissions = ALL_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {});

  const selectedRoleData = roles.find(r => r.id === selectedRole);

  const categoryColors = {
    'Dashboard': 'bg-purple-100 text-purple-700 border-purple-200',
    'Users': 'bg-blue-100 text-blue-700 border-blue-200',
    'Roles': 'bg-green-100 text-green-700 border-green-200',
    'Requests': 'bg-orange-100 text-orange-700 border-orange-200',
    'System': 'bg-red-100 text-red-700 border-red-200'
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          {language === 'ka' ? 'უფლებების მართვა' : 'Permissions Management'}
        </h1>
        <p className="text-slate-600">
          {language === 'ka' 
            ? 'განსაზღვრეთ რომელ როლს რა უფლებები უნდა ჰქონდეს სისტემაში' 
            : 'Define which roles have which permissions in the system'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roles Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase">
              {language === 'ka' ? 'როლები' : 'Roles'}
            </h3>
            <div className="space-y-2">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    selectedRole === role.id
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{role.name}</div>
                      <div className={`text-xs ${selectedRole === role.id ? 'text-blue-100' : 'text-slate-500'}`}>
                        {role.permissions.length} {language === 'ka' ? 'უფლება' : 'permissions'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Permissions Panel */}
        <div className="lg:col-span-3">
          {!selectedRole ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Lock className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                {language === 'ka' ? 'აირჩიეთ როლი' : 'Select a Role'}
              </h3>
              <p className="text-slate-500">
                {language === 'ka' 
                  ? 'აირჩიეთ როლი მარცხნივ, რათა მართოთ მისი უფლებები' 
                  : 'Select a role from the left to manage its permissions'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{selectedRoleData?.name}</h2>
                    <p className="text-blue-100 text-sm">{selectedRoleData?.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{rolePermissions.length}</div>
                    <div className="text-blue-100 text-sm">
                      {language === 'ka' ? 'აქტიური უფლება' : 'Active Permissions'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {canManage && (
                <div className="px-6 py-4 bg-slate-50 border-b flex gap-3">
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all text-sm font-medium"
                  >
                    {language === 'ka' ? '✓ ყველას მონიშვნა' : '✓ Select All'}
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-sm font-medium"
                  >
                    {language === 'ka' ? '✗ ყველას მოხსნა' : '✗ Deselect All'}
                  </button>
                  {hasChanges && (
                    <button
                      onClick={handleSave}
                      className="ml-auto px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm font-medium flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {language === 'ka' ? 'შენახვა' : 'Save Changes'}
                    </button>
                  )}
                </div>
              )}

              {/* Permissions List */}
              <div className="p-6">
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category} className="mb-6 last:mb-0">
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 border ${categoryColors[category] || 'bg-slate-100 text-slate-700'}`}>
                      {category}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {permissions.map(permission => {
                        const isChecked = rolePermissions.includes(permission.id);
                        return (
                          <div
                            key={permission.id}
                            onClick={() => togglePermission(permission.id)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-blue-50 border-blue-500 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            } ${!canManage ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                isChecked 
                                  ? 'bg-blue-500 border-blue-500' 
                                  : 'bg-white border-slate-300'
                              }`}>
                                {isChecked && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className={`font-medium ${isChecked ? 'text-blue-900' : 'text-slate-800'}`}>
                                  {permission.name}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                  ID: {permission.id}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {!canManage && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-800 mb-1">
              {language === 'ka' ? 'მხოლოდ ნახვის რეჟიმი' : 'View Only Mode'}
            </h4>
            <p className="text-yellow-700 text-sm">
              {language === 'ka' 
                ? 'თქვენ არ გაქვთ უფლებების მართვის უფლება. შეგიძლიათ მხოლოდ დათვალიერება.' 
                : 'You do not have permission management rights. You can only view.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;