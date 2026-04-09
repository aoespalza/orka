import { useState, useEffect } from 'react';
import api from '../api';
import './ProjectsPage.css';

interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  region?: string;
  clientName?: string;
  clientRut?: string;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  status: string;
  budget?: number;
  actualCost?: number;
  manager?: { id: string; name: string; username: string };
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: 'PLANNING', label: 'Planificación', color: '#f59e0b' },
  { value: 'ACTIVE', label: 'Activo', color: '#10b981' },
  { value: 'ON_HOLD', label: 'En Pausa', color: '#f97316' },
  { value: 'COMPLETED', label: 'Completado', color: '#3b82f6' },
  { value: 'CANCELLED', label: 'Cancelado', color: '#ef4444' },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    loadProjects();
  }, [filterStatus]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const data = await api.getProjects(params);
      setProjects(data.data || data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const isEditing = !!editingProject;
    
    const data: any = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      address: formData.get('address') as string || undefined,
      city: formData.get('city') as string || undefined,
      region: formData.get('region') as string || undefined,
      clientName: formData.get('clientName') as string || undefined,
      clientRut: formData.get('clientRut') as string || undefined,
      startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string).toISOString() : undefined,
      endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string).toISOString() : undefined,
      deadline: formData.get('deadline') ? new Date(formData.get('deadline') as string).toISOString() : undefined,
      budget: formData.get('budget') ? parseFloat(formData.get('budget') as string) : undefined,
      contactName: formData.get('contactName') as string || undefined,
      contactPhone: formData.get('contactPhone') as string || undefined,
      contactEmail: formData.get('contactEmail') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    };
    
    // Include status for editing
    if (isEditing) {
      data.status = formData.get('status') as string;
    }

    try {
      if (editingProject) {
        await api.updateProject(editingProject.id, data);
      } else {
        await api.createProject(data);
      }
      setShowModal(false);
      setEditingProject(null);
      loadProjects();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar proyecto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este proyecto?')) return;
    try {
      await api.deleteProject(id);
      loadProjects();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar proyecto');
    }
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(o => o.value === status);
    return option ? (
      <span className="badge" style={{ backgroundColor: `${option.color}20`, color: option.color }}>
        {option.label}
      </span>
    ) : status;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-CL');
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return `$${amount.toLocaleString('es-CL')}`;
  };

  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1>Proyectos / Obras</h1>
          <p>Gestiona los proyectos y obras</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditingProject(null); setShowModal(true); }}>
          + Nuevo Proyecto
        </button>
      </div>

      <div className="filters">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="loading">Cargando proyectos...</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Presupuesto</th>
                <th>Inicio</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => (
                <tr key={project.id}>
                  <td><strong>{project.code}</strong></td>
                  <td>{project.name}</td>
                  <td>{project.clientName || '-'}</td>
                  <td>{getStatusBadge(project.status)}</td>
                  <td>{formatCurrency(project.budget)}</td>
                  <td>{formatDate(project.startDate)}</td>
                  <td>
                    <button className="btn-icon" onClick={() => { setEditingProject(project); setShowModal(true); }} title="Editar">
                      ✏️
                    </button>
                    <button className="btn-icon" onClick={() => handleDelete(project.id)} title="Eliminar">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty">No hay proyectos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input name="name" required defaultValue={editingProject?.name} />
                </div>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea name="description" defaultValue={editingProject?.description || ''} rows={2} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cliente</label>
                  <input name="clientName" defaultValue={editingProject?.clientName || ''} />
                </div>
                <div className="form-group">
                  <label>RUT Cliente</label>
                  <input name="clientRut" defaultValue={editingProject?.clientRut || ''} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Dirección</label>
                  <input name="address" defaultValue={editingProject?.address || ''} />
                </div>
                <div className="form-group">
                  <label>Ciudad</label>
                  <input name="city" defaultValue={editingProject?.city || ''} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha Inicio</label>
                  <input type="date" name="startDate" defaultValue={editingProject?.startDate?.split('T')[0]} />
                </div>
                <div className="form-group">
                  <label>Fecha Término</label>
                  <input type="date" name="endDate" defaultValue={editingProject?.endDate?.split('T')[0]} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Presupuesto</label>
                  <input type="number" name="budget" defaultValue={editingProject?.budget || ''} />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select name="status" defaultValue={editingProject?.status || 'PLANNING'}>
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contacto</label>
                  <input name="contactName" defaultValue={editingProject?.contactName || ''} />
                </div>
                <div className="form-group">
                  <label>Teléfono Contacto</label>
                  <input name="contactPhone" defaultValue={editingProject?.contactPhone || ''} />
                </div>
              </div>

              <div className="form-group">
                <label>Email Contacto</label>
                <input type="email" name="contactEmail" defaultValue={editingProject?.contactEmail || ''} />
              </div>

              <div className="form-group">
                <label>Notas</label>
                <textarea name="notes" defaultValue={editingProject?.notes || ''} rows={2} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
