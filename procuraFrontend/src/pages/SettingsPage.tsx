import { useState, useEffect } from 'react';
import api from '../api';
import type { User, Profile, Permission, CreateUserDTO, UpdateUserDTO, CreateProfileDTO, UpdateProfileDTO } from '../types';
import './SettingsPage.css';

interface Setting {
  key: string;
  value: string;
  description: string;
  category: string;
}

const ROLES = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'PURCHASE_MANAGER', label: 'Gerente de Compras' },
  { value: 'PURCHASE_AGENT', label: 'Agente de Compras' },
  { value: 'REQUESTER', label: 'Solicitante' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('email');
  const [settings, setSettings] = useState<Record<string, Setting>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Users, Profiles, Permissions state
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  const [userForm, setUserForm] = useState<CreateUserDTO>({ username: '', password: '', email: '', name: '', role: 'REQUESTER', profileId: '' });
  const [profileForm, setProfileForm] = useState<CreateProfileDTO>({ name: '', description: '', isDefault: false, permissionIds: [] });

  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'profiles' || activeTab === 'permissions') {
      loadTabData();
    } else {
      loadSettings();
    }
  }, [activeTab]);

  const loadTabData = async () => {
    setIsLoadingData(true);
    try {
      if (activeTab === 'users') {
        const [usersData, profilesData] = await Promise.all([api.getUsers(), api.getProfiles()]);
        setUsers(usersData); setProfiles(profilesData);
      } else if (activeTab === 'profiles') {
        const [profilesData, permsData] = await Promise.all([api.getProfiles(), api.getPermissions()]);
        setProfiles(profilesData); setPermissions(permsData);
      } else if (activeTab === 'permissions') {
        const permsData = await api.getPermissions();
        setPermissions(permsData);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoadingData(false); }
  };

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      let data: Setting[];
      if (activeTab === 'email') {
        data = await api.getSettingsByCategory('smtp');
        const settingsMap: Record<string, Setting> = {};
        const keyMap: Record<string, string> = { 'smtp_host': 'EMAIL_HOST', 'smtp_port': 'EMAIL_PORT', 'smtp_secure': 'EMAIL_SECURE', 'smtp_user': 'EMAIL_USER', 'smtp_pass': 'EMAIL_PASS', 'smtp_from': 'EMAIL_FROM' };
        data.forEach(s => { const mappedKey = keyMap[s.key] || s.key; settingsMap[mappedKey] = { ...s, key: mappedKey }; });
        setSettings(settingsMap);
      } else if (activeTab === 'validation') {
        data = await api.getSettingsByCategory('validation');
        const settingsMap: Record<string, Setting> = {};
        data.forEach(s => { settingsMap[s.key] = s; });
        setSettings(settingsMap);
      } else {
        data = await api.getSettingsByCategory('general');
        const settingsMap: Record<string, Setting> = {};
        data.forEach(s => { settingsMap[s.key] = s; });
        setSettings(settingsMap);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleSave = async (key: string, value: string) => {
    setIsSaving(true);
    try {
      if (activeTab === 'email') {
        const emailSettings = {
          host: (settings['EMAIL_HOST']?.value || '').trim(),
          port: parseInt(settings['EMAIL_PORT']?.value || '587'),
          secure: settings['EMAIL_SECURE']?.value === 'true',
          user: (settings['EMAIL_USER']?.value || '').trim(),
          password: settings['EMAIL_PASS']?.value || undefined,
          from: (settings['EMAIL_FROM']?.value || '').trim()
        };
        await api.saveEmailSettings(emailSettings);
      } else {
        await api.updateSetting(key, value);
      }
      setSettings(prev => ({ ...prev, [key]: { ...prev[key], value } }));
      setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || error.response?.data?.error || 'Error al guardar configuración' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInitialize = async () => {
    if (!confirm('¿Inicializar configuraciones por defecto? Esto no affectara los valores existentes.')) return;
    try {
      await api.initializeSettings();
      setMessage({ type: 'success', text: 'Configuraciones inicializadas correctamente' });
      loadSettings();
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al inicializar configuraciones' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleTestEmail = async () => {
    const testEmail = prompt('Ingrese el email de prueba para verificar la configuración SMTP:');
    if (!testEmail) return;
    const cleanEmail = testEmail.trim();
    if (!cleanEmail) return;
    try {
      setMessage({ type: 'success', text: 'Enviando correo de prueba...' });
      const result = await api.testEmail(cleanEmail);
      if (result.success) {
        setMessage({ type: 'success', text: 'Correo de prueba enviado correctamente' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Error al enviar correo de prueba' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || error.response?.data?.error || 'Error al enviar correo de prueba' });
    }
    setTimeout(() => setMessage(null), 5000);
  };

  // User handlers
  const handleCreateUser = async () => {
    setIsSaving(true);
    try {
      if (editingUser) {
        const updateData: UpdateUserDTO = { email: userForm.email, name: userForm.name, role: userForm.role, profileId: userForm.profileId || undefined };
        if (userForm.password) updateData.password = userForm.password;
        await api.updateUser(editingUser.id, updateData);
        setMessage({ type: 'success', text: 'Usuario actualizado correctamente' });
      } else { await api.createUser(userForm); setMessage({ type: 'success', text: 'Usuario creado correctamente' }); }
      setShowUserModal(false); setEditingUser(null); resetUserForm(); loadTabData();
    } catch (error: any) { setMessage({ type: 'error', text: error.response?.data?.error || 'Error al guardar usuario' }); }
    setIsSaving(false); setTimeout(() => setMessage(null), 3000);
  };

  const handleEditUser = (user: User) => { setEditingUser(user); setUserForm({ username: user.username, password: '', email: user.email || '', name: user.name || '', role: user.role, profileId: user.profileId || '' }); setShowUserModal(true); };
  const handleDeleteUser = async (user: User) => { if (!confirm('¿Eliminar usuario?')) return; try { await api.deleteUser(user.id); setMessage({ type: 'success', text: 'Usuario eliminado correctamente' }); loadTabData(); } catch (error: any) { setMessage({ type: 'error', text: error.response?.data?.error || 'Error al eliminar' }); } setTimeout(() => setMessage(null), 3000); };
  const resetUserForm = () => { setUserForm({ username: '', password: '', email: '', name: '', role: 'REQUESTER', profileId: '' }); };

  // Profile handlers
  const handleCreateProfile = async () => {
    setIsSaving(true);
    try {
      if (editingProfile) { const updateData: UpdateProfileDTO = { name: profileForm.name, description: profileForm.description, isDefault: profileForm.isDefault, permissionIds: profileForm.permissionIds }; await api.updateProfile(editingProfile.id, updateData); setMessage({ type: 'success', text: 'Perfil actualizado correctamente' }); }
      else { await api.createProfile(profileForm); setMessage({ type: 'success', text: 'Perfil creado correctamente' }); }
      setShowProfileModal(false); setEditingProfile(null); resetProfileForm(); loadTabData();
    } catch (error: any) { setMessage({ type: 'error', text: error.response?.data?.error || 'Error al guardar perfil' }); }
    setIsSaving(false); setTimeout(() => setMessage(null), 3000);
  };

  const handleEditProfile = (profile: Profile) => { setEditingProfile(profile); setProfileForm({ name: profile.name, description: profile.description || '', isDefault: profile.isDefault, permissionIds: profile.permissions?.map(p => p.permissionId) || [] }); setShowProfileModal(true); };
  const handleDeleteProfile = async (profile: Profile) => { if (!confirm('¿Eliminar perfil?')) return; try { await api.deleteProfile(profile.id); setMessage({ type: 'success', text: 'Perfil eliminado correctamente' }); loadTabData(); } catch (error: any) { setMessage({ type: 'error', text: error.response?.data?.error || 'Error al eliminar' }); } setTimeout(() => setMessage(null), 3000); };
  const resetProfileForm = () => { setProfileForm({ name: '', description: '', isDefault: false, permissionIds: [] }); };
  const togglePermission = (permissionId: string) => { setProfileForm(prev => ({ ...prev, permissionIds: (prev.permissionIds || []).includes(permissionId) ? (prev.permissionIds || []).filter(id => id !== permissionId) : [...(prev.permissionIds || []), permissionId] })); };
  const permissionsByCategory = permissions.reduce((acc, perm) => { if (!acc[perm.category]) acc[perm.category] = []; acc[perm.category].push(perm); return acc; }, {} as Record<string, Permission[]>);

  // Modals
  const renderUserModal = () => (
    <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2><button className="modal-close" onClick={() => setShowUserModal(false)}>×</button></div>
        <div className="modal-form">
          <div className="form-group"><label>Usuario</label><input type="text" value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} disabled={!!editingUser} required /></div>
          <div className="form-group"><label>Contraseña {editingUser && '(dejar vacío)'}</label><input type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required={!editingUser} /></div>
          <div className="form-group"><label>Nombre</label><input type="text" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} /></div>
          <div className="form-group"><label>Email</label><input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} /></div>
          <div className="form-row">
            <div className="form-group"><label>Rol</label><select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value as any })}>{ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
            <div className="form-group"><label>Perfil</label><select value={userForm.profileId} onChange={e => setUserForm({ ...userForm, profileId: e.target.value })}><option value="">Sin perfil</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          </div>
          <div className="modal-actions"><button className="btn-secondary" onClick={() => setShowUserModal(false)}>Cancelar</button><button className="btn-primary" onClick={handleCreateUser} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar'}</button></div>
        </div>
      </div>
    </div>
  );

  const renderProfileModal = () => (
    <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
      <div className="modal modal--large" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{editingProfile ? 'Editar Perfil' : 'Nuevo Perfil'}</h2><button className="modal-close" onClick={() => setShowProfileModal(false)}>×</button></div>
        <div className="modal-form">
          <div className="form-group"><label>Nombre</label><input type="text" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} required /></div>
          <div className="form-group"><label>Descripción</label><input type="text" value={profileForm.description} onChange={e => setProfileForm({ ...profileForm, description: e.target.value })} /></div>
          <div className="form-group"><label className="checkbox-label"><input type="checkbox" checked={profileForm.isDefault} onChange={e => setProfileForm({ ...profileForm, isDefault: e.target.checked })} />Perfil por defecto</label></div>
          <div className="form-group"><label>Permisos</label><div className="permissions-grid">{Object.entries(permissionsByCategory).map(([category, perms]) => (<div key={category} className="permission-category"><div className="permission-category-title">{category}</div>{perms.map(perm => (<div key={perm.id} className="permission-item"><input type="checkbox" id={perm.id} checked={(profileForm.permissionIds || []).includes(perm.id)} onChange={() => togglePermission(perm.id)} /><label htmlFor={perm.id}>{perm.name}</label></div>))}</div>))}</div></div>
          <div className="modal-actions"><button className="btn-secondary" onClick={() => setShowProfileModal(false)}>Cancelar</button><button className="btn-primary" onClick={handleCreateProfile} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar'}</button></div>
        </div>
      </div>
    </div>
  );

  // Tab content
  const renderUsersTab = () => (
    <div className="settings-section">
      <div className="users-header"><h3>Usuarios del Sistema</h3><button className="btn-primary" onClick={() => { resetUserForm(); setEditingUser(null); setShowUserModal(true); }}>+ Nuevo Usuario</button></div>
      {isLoadingData ? <div className="loading">Cargando...</div> : (
        <table className="users-table"><thead><tr><th>Usuario</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Perfil</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
          {users.map(user => (<tr key={user.id}><td>{user.username}</td><td>{user.name || '-'}</td><td>{user.email || '-'}</td><td>{user.role}</td><td>{user.profile?.name || '-'}</td><td><span className={`user-status ${user.isActive ? 'user-status--active' : 'user-status--inactive'}`}>{user.isActive ? 'Activo' : 'Inactivo'}</span></td><td><button className="btn-icon" onClick={() => handleEditUser(user)}>✏️</button><button className="btn-icon btn-icon--danger" onClick={() => handleDeleteUser(user)}>🗑️</button></td></tr>))}
        </tbody></table>
      )}
    </div>
  );

  const renderProfilesTab = () => (
    <div className="settings-section">
      <div className="users-header"><h3>Perfiles</h3><button className="btn-primary" onClick={() => { resetProfileForm(); setEditingProfile(null); setShowProfileModal(true); }}>+ Nuevo Perfil</button></div>
      {isLoadingData ? <div className="loading">Cargando...</div> : (
        <div className="profiles-grid">
          {profiles.map(profile => (
            <div key={profile.id} className="profile-card">
              <div className="profile-card-header">
                <div><h4 className="profile-card-title">{profile.name}</h4><p className="profile-card-description">{profile.description || 'Sin descripción'}</p></div>
                <div className="actions"><button className="btn-icon" onClick={() => handleEditProfile(profile)}>✏️</button><button className="btn-icon btn-icon--danger" onClick={() => handleDeleteProfile(profile)}>🗑️</button></div>
              </div>
              <div className="profile-card-meta">
                {profile.isDefault && <span className="profile-default-badge">Por defecto</span>}
                <span className="profile-permissions-count">{profile.permissions?.length || 0} permisos</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPermissionsTab = () => (
    <div className="settings-section">
      <h3>Permisos del Sistema</h3>
      <p className="settings-description">Lista de todos los permisos disponibles en el sistema.</p>
      {isLoadingData ? <div className="loading">Cargando...</div> : (
        <div className="permissions-grid">
          {Object.entries(permissionsByCategory).map(([category, perms]) => (
            <div key={category} className="permission-category">
              <div className="permission-category-title">{category}</div>
              {perms.map(perm => (<div key={perm.id} className="permission-item"><span>{perm.name}</span><code>{perm.code}</code></div>))}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderEmailSettings = () => (
    <div className="settings-section">
      <h3>Configuración de Correo Electrónico</h3>
      <p className="settings-description">Configura los parámetros para el envío de notificaciones por correo electrónico.</p>
      
      <div className="form-group">
        <label>Servidor SMTP</label>
        <input
          type="text"
          value={settings['EMAIL_HOST']?.value || ''}
          onChange={(e) => setSettings(prev => ({ ...prev, EMAIL_HOST: { ...prev['EMAIL_HOST'], value: e.target.value } }))}
          placeholder="smtp.gmail.com"
        />
        <span className="help-text">{settings['EMAIL_HOST']?.description}</span>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Puerto</label>
          <input
            type="number"
            value={settings['EMAIL_PORT']?.value || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, EMAIL_PORT: { ...prev['EMAIL_PORT'], value: e.target.value } }))}
            placeholder="587"
          />
        </div>
        <div className="form-group">
          <label>Usar TLS/SSL</label>
          <select
            value={settings['EMAIL_SECURE']?.value || 'false'}
            onChange={(e) => setSettings(prev => ({ ...prev, EMAIL_SECURE: { ...prev['EMAIL_SECURE'], value: e.target.value } }))}
          >
            <option value="false">No (Puerto 587)</option>
            <option value="true">Sí (Puerto 465)</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Usuario de Correo</label>
        <input
          type="email"
          value={settings['EMAIL_USER']?.value || ''}
          onChange={(e) => setSettings(prev => ({ ...prev, EMAIL_USER: { ...prev['EMAIL_USER'], value: e.target.value.trim() } }))}
          placeholder="tu@email.com"
        />
      </div>

      <div className="form-group">
        <label>Contraseña</label>
        <input
          type="password"
          value={settings['EMAIL_PASS']?.value || ''}
          onChange={(e) => setSettings(prev => ({ ...prev, EMAIL_PASS: { ...prev['EMAIL_PASS'], value: e.target.value } }))}
          placeholder="••••••••"
        />
        <span className="help-text">Para Gmail, usa una Contraseña de Aplicación</span>
      </div>

      <div className="form-group">
        <label>Remitente</label>
        <input
          type="text"
          value={settings['EMAIL_FROM']?.value || ''}
          onChange={(e) => setSettings(prev => ({ ...prev, EMAIL_FROM: { ...prev['EMAIL_FROM'], value: e.target.value.trim() } }))}
          placeholder="PROCURA <noreply@empresa.com>"
        />
      </div>

      <div className="settings-actions">
        <button className="btn-secondary" onClick={handleTestEmail}>
          📧 Probar Conexión
        </button>
        <button 
          className="btn-primary" 
          onClick={async () => {
            setIsSaving(true);
            try {
              const emailSettings = {
                host: settings['EMAIL_HOST']?.value || '',
                port: parseInt(settings['EMAIL_PORT']?.value || '587'),
                secure: settings['EMAIL_SECURE']?.value === 'true',
                user: settings['EMAIL_USER']?.value || '',
                password: settings['EMAIL_PASS']?.value || undefined,
                from: settings['EMAIL_FROM']?.value || ''
              };
              await api.saveEmailSettings(emailSettings);
              setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
            } catch (error: any) {
              setMessage({ type: 'error', text: error.response?.data?.message || error.response?.data?.error || 'Error al guardar configuración' });
            }
            setTimeout(() => setMessage(null), 5000);
            setIsSaving(false);
          }}
          disabled={isSaving}
        >
          {isSaving ? 'Guardando...' : '💾 Guardar Todo'}
        </button>
      </div>
    </div>
  );

  const renderValidationSettings = () => (
    <div className="settings-section">
      <h3>Configuración de Validaciones</h3>
      <p className="settings-description">Parámetros de validación para el sistema de compras.</p>
      
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings['VALIDATION_SUPPLIER_CODE_AUTO']?.value === 'true'}
            onChange={(e) => setSettings(prev => ({ ...prev, VALIDATION_SUPPLIER_CODE_AUTO: { ...prev['VALIDATION_SUPPLIER_CODE_AUTO'], value: e.target.checked ? 'true' : 'false' } }))}
          />
          Código Automático para Proveedores
        </label>
        <span className="help-text">{settings['VALIDATION_SUPPLIER_CODE_AUTO']?.description}</span>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings['VALIDATION_MATERIAL_CODE_AUTO']?.value === 'true'}
            onChange={(e) => setSettings(prev => ({ ...prev, VALIDATION_MATERIAL_CODE_AUTO: { ...prev['VALIDATION_MATERIAL_CODE_AUTO'], value: e.target.checked ? 'true' : 'false' } }))}
          />
          Código Automático para Materiales
        </label>
        <span className="help-text">{settings['VALIDATION_MATERIAL_CODE_AUTO']?.description}</span>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Mínimo Caracteres Nombre Proveedor</label>
          <input
            type="number"
            min="1"
            value={settings['VALIDATION_MIN_SUPPLIER_NAME']?.value || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, VALIDATION_MIN_SUPPLIER_NAME: { ...prev['VALIDATION_MIN_SUPPLIER_NAME'], value: e.target.value } }))}
          />
        </div>
        <div className="form-group">
          <label>Proyecto Obligatorio en OC</label>
          <select
            value={settings['VALIDATION_REQUIRE_PROJECT_NAME']?.value || 'false'}
            onChange={(e) => setSettings(prev => ({ ...prev, VALIDATION_REQUIRE_PROJECT_NAME: { ...prev['VALIDATION_REQUIRE_PROJECT_NAME'], value: e.target.value } }))}
          >
            <option value="false">No</option>
            <option value="true">Sí</option>
          </select>
        </div>
      </div>

      <div className="settings-actions">
        <button 
          className="btn-primary" 
          onClick={() => Object.entries(settings).forEach(([key, s]) => handleSave(key, s.value))}
          disabled={isSaving}
        >
          {isSaving ? 'Guardando...' : '💾 Guardar Todo'}
        </button>
      </div>
    </div>
  );

  const renderCompanySettings = () => (
    <div className="settings-section">
      <h3>Información de la Empresa</h3>
      <p className="settings-description">Datos de la empresa que aparecerán en los documentos.</p>
      
      <div className="form-group">
        <label>Nombre de la Empresa</label>
        <input
          type="text"
          value={settings['COMPANY_NAME']?.value || ''}
          onChange={(e) => setSettings(prev => ({ ...prev, COMPANY_NAME: { ...prev['COMPANY_NAME'], value: e.target.value } }))}
          placeholder="Mi Empresa Ltda."
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>RUT</label>
          <input
            type="text"
            value={settings['COMPANY_RUT']?.value || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, COMPANY_RUT: { ...prev['COMPANY_RUT'], value: e.target.value } }))}
            placeholder="12.345.678-9"
          />
        </div>
        <div className="form-group">
          <label>Teléfono</label>
          <input
            type="text"
            value={settings['COMPANY_PHONE']?.value || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, COMPANY_PHONE: { ...prev['COMPANY_PHONE'], value: e.target.value } }))}
            placeholder="+56 9 1234 5678"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Dirección</label>
        <input
          type="text"
          value={settings['COMPANY_ADDRESS']?.value || ''}
          onChange={(e) => setSettings(prev => ({ ...prev, COMPANY_ADDRESS: { ...prev['COMPANY_ADDRESS'], value: e.target.value } }))}
          placeholder="Av. Principal 123, Santiago"
        />
      </div>

      <div className="form-group">
        <label>Correo Electrónico</label>
        <input
          type="email"
          value={settings['COMPANY_EMAIL']?.value || ''}
          onChange={(e) => setSettings(prev => ({ ...prev, COMPANY_EMAIL: { ...prev['COMPANY_EMAIL'], value: e.target.value } }))}
          placeholder="contacto@empresa.com"
        />
      </div>

      <div className="settings-actions">
        <button 
          className="btn-primary" 
          onClick={() => Object.entries(settings).forEach(([key, s]) => handleSave(key, s.value))}
          disabled={isSaving}
        >
          {isSaving ? 'Guardando...' : '💾 Guardar Todo'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>Configuración</h1>
          <p>Administra la configuración del sistema</p>
        </div>
        <button className="btn-secondary" onClick={handleInitialize}>
          ⚙️ Inicializar Valores por Defecto
        </button>
      </div>

      {message && (
        <div className={`message message--${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-tabs">
        <button 
          className={`tab ${activeTab === 'email' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          📧 Correo Electrónico
        </button>
        <button 
          className={`tab ${activeTab === 'validation' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('validation')}
        >
          ✓ Validaciones
        </button>
        <button 
          className={`tab ${activeTab === 'company' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('company')}
        >
          🏢 Empresa
        </button>
        <button 
          className={`tab ${activeTab === 'users' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Usuarios
        </button>
        <button 
          className={`tab ${activeTab === 'profiles' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('profiles')}
        >
          🛡️ Perfiles
        </button>
        <button 
          className={`tab ${activeTab === 'permissions' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('permissions')}
        >
          🔑 Permisos
        </button>
      </div>

      <div className="settings-content">
        {isLoading ? (
          <div className="loading">Cargando configuración...</div>
        ) : (
          <>
            {activeTab === 'email' && renderEmailSettings()}
            {activeTab === 'validation' && renderValidationSettings()}
            {activeTab === 'company' && renderCompanySettings()}
            {activeTab === 'users' && renderUsersTab()}
            {activeTab === 'profiles' && renderProfilesTab()}
            {activeTab === 'permissions' && renderPermissionsTab()}
          </>
        )}
      </div>

      {showUserModal && renderUserModal()}
      {showProfileModal && renderProfileModal()}
    </div>
  );
}