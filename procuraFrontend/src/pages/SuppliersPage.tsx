import { useState, useEffect } from 'react';
import api from '../api';
import type { Supplier, CreateSupplierDTO, SupplierStatus } from '../types';
import './SuppliersPage.css';

const STATUS_OPTIONS: { value: SupplierStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'BLOCKED', label: 'Bloqueado' }
];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [formData, setFormData] = useState<CreateSupplierDTO>({
    code: '',
    name: '',
    rut: '',
    nit: '',
    rutFile: '',
    address: '',
    city: '',
    country: 'Colombia',
    phone: '',
    email: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    bankAccount: '',
    bankName: '',
    paymentTerms: '',
    notes: '',
    categories: [],
    status: 'ACTIVE'
  });
  const [rutFile, setRutFile] = useState<File | null>(null);

  useEffect(() => {
    loadSuppliers();
  }, [search, statusFilter]);

  const loadSuppliers = async () => {
    try {
      const data = await api.getSuppliers({
        search: search || undefined,
        status: statusFilter || undefined
      });
      // API returns array directly, not paginated response
      setSuppliers(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let rutFilePath = formData.rutFile || '';
      
      // Upload RUT file if selected
      if (rutFile) {
        const uploadResult = await api.uploadRutFile(rutFile);
        rutFilePath = uploadResult.filename;
      }
      
      const supplierData = {
        ...formData,
        rutFile: rutFilePath
      };
      
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.id, supplierData);
      } else {
        await api.createSupplier(supplierData);
      }
      setShowModal(false);
      resetForm();
      loadSuppliers();
    } catch (error) {
      console.error('Failed to save supplier:', error);
      alert('Error al guardar el proveedor');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setRutFile(null);
    setFormData({
      code: supplier.code,
      name: supplier.name,
      rut: supplier.rut || '',
      nit: supplier.nit || '',
      rutFile: supplier.rutFile || '',
      address: supplier.address || '',
      city: supplier.city || '',
      country: supplier.country,
      phone: supplier.phone || '',
      email: supplier.email || '',
      contactName: supplier.contactName || '',
      contactPhone: supplier.contactPhone || '',
      contactEmail: supplier.contactEmail || '',
      bankAccount: supplier.bankAccount || '',
      bankName: supplier.bankName || '',
      paymentTerms: supplier.paymentTerms || '',
      notes: supplier.notes || '',
      categories: supplier.categories || [],
      status: supplier.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este contratista?')) return;
    try {
      await api.deleteSupplier(id);
      loadSuppliers();
    } catch (error) {
      console.error('Failed to delete supplier:', error);
    }
  };

  const resetForm = () => {
    setEditingSupplier(null);
    setRutFile(null);
    setFormData({
      code: '',
      name: '',
      rut: '',
      nit: '',
      rutFile: '',
      address: '',
      city: '',
      country: 'Colombia',
      phone: '',
      email: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      bankAccount: '',
      bankName: '',
      paymentTerms: '',
      notes: '',
      categories: [],
      status: 'ACTIVE'
    });
  };

  const getStatusBadge = (status: SupplierStatus) => {
    const statusMap: Record<SupplierStatus, { class: string; label: string }> = {
      ACTIVE: { class: 'badge--active', label: 'Activo' },
      INACTIVE: { class: 'badge--inactive', label: 'Inactivo' },
      BLOCKED: { class: 'badge--blocked', label: 'Bloqueado' }
    };
    const { class: className, label } = statusMap[status];
    return <span className={`badge ${className}`}>{label}</span>;
  };

  return (
    <div className="suppliers-page">
      <div className="page-header">
        <div>
          <h1>Contratistas</h1>
          <p>Gestión de contratistas y colaboradores</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          ➕ Nuevo Contratista
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Buscar contratistas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>RUT</th>
                <th>Ciudad</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(suppliers || []).map(supplier => (
                <tr key={supplier.id}>
                  <td><code>{supplier.code}</code></td>
                  <td>{supplier.name}</td>
                  <td>{supplier.rut || '-'}</td>
                  <td>{supplier.city || '-'}</td>
                  <td>{supplier.contactName || '-'}</td>
                  <td>{supplier.phone || '-'}</td>
                  <td>{getStatusBadge(supplier.status)}</td>
                  <td>
                    <div className="actions">
                      <button className="btn-icon" onClick={() => handleEdit(supplier)} title="Editar">
                        ✏️
                      </button>
                      <button className="btn-icon btn-icon--danger" onClick={() => handleDelete(supplier.id)} title="Eliminar">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(suppliers || []).length === 0 && (
                <tr>
                  <td colSpan={8} className="empty">No se encontraron contratistas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal--large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSupplier ? 'Editar Contratista' : 'Nuevo Contratista'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-section">
                <h3>Información General</h3>
                <div className="form-row">
                  {editingSupplier && (
                    <div className="form-group">
                      <label>Código</label>
                      <input
                        type="text"
                        value={formData.code}
                        disabled
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label>NIT</label>
                    <input
                      type="text"
                      value={formData.nit}
                      onChange={e => setFormData({ ...formData, nit: e.target.value })}
                      placeholder="Número de Identificación Tributaria"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Archivo RUT (PDF)</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={e => setRutFile(e.target.files?.[0] || null)}
                  />
                  {formData.rutFile && (
                    <span className="file-info">Archivo actual: {formData.rutFile}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Razón Social *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Ciudad</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>País</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={e => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Dirección</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Contacto</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Persona de Contacto</label>
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono Contacto</label>
                    <input
                      type="text"
                      value={formData.contactPhone}
                      onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email de Contacto</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Datos Bancarios y Comerciales</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Banco</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Cuenta Bancaria</label>
                    <input
                      type="text"
                      value={formData.bankAccount}
                      onChange={e => setFormData({ ...formData, bankAccount: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Términos de Pago</label>
                  <input
                    type="text"
                    value={formData.paymentTerms}
                    onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                    placeholder="Ej: 30 días"
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Estado y Notas</h3>
                <div className="form-group">
                  <label>Estado</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as SupplierStatus })}
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Notas</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingSupplier ? 'Guardar Cambios' : 'Crear Contratista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
