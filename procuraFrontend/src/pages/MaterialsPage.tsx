import { useState, useEffect } from 'react';
import api from '../api';
import type { Material, CreateMaterialDTO, MaterialCategory, UnitOfMeasure } from '../types';
import './MaterialsPage.css';

const CATEGORIES: MaterialCategory[] = [
  'CONSTRUCTION_MATERIALS',
  'ELECTRICAL',
  'PLUMBING',
  'HARDWARE',
  'PAINT',
  'SAFETY_EQUIPMENT',
  'TOOLS',
  'MACHINERY',
  'TECHNOLOGY',
  'OTHER'
];

const UNITS: UnitOfMeasure[] = ['UNITS', 'KG', 'TON', 'METER', 'LITER', 'BOX', 'BAG', 'PALLET'];

const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  CONSTRUCTION_MATERIALS: 'Materiales de Construcción',
  ELECTRICAL: 'Eléctrico',
  PLUMBING: 'Plomería',
  HARDWARE: 'Ferretería',
  PAINT: 'Pintura',
  SAFETY_EQUIPMENT: 'Equipo de Seguridad',
  TOOLS: 'Herramientas',
  MACHINERY: 'Maquinaria',
  TECHNOLOGY: 'Tecnología',
  OTHER: 'Otros'
};

const UNIT_LABELS: Record<UnitOfMeasure, string> = {
  UNITS: 'Unidades',
  KG: 'Kilogramos',
  TON: 'Toneladas',
  METER: 'Metros',
  LITER: 'Litros',
  BOX: 'Cajas',
  BAG: 'Bolsas',
  PALLET: 'Paletas'
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const [formData, setFormData] = useState<CreateMaterialDTO>({
    code: '',
    name: '',
    description: '',
    category: 'OTHER',
    unitOfMeasure: 'UNITS',
    defaultUnitPrice: undefined,
    isActive: true
  });

  useEffect(() => {
    loadMaterials();
  }, [search, categoryFilter]);

  const loadMaterials = async () => {
    try {
      const data = await api.getMaterials({
        search: search || undefined,
        category: categoryFilter || undefined
      });
      setMaterials(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error('Failed to load materials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMaterial) {
        await api.updateMaterial(editingMaterial.id, formData);
      } else {
        await api.createMaterial(formData);
      }
      setShowModal(false);
      resetForm();
      loadMaterials();
    } catch (error) {
      console.error('Failed to save material:', error);
      alert('Error al guardar el material');
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      code: material.code,
      name: material.name,
      description: material.description || '',
      category: material.category,
      unitOfMeasure: material.unitOfMeasure,
      defaultUnitPrice: material.defaultUnitPrice || undefined,
      isActive: material.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este material?')) return;
    try {
      await api.deleteMaterial(id);
      loadMaterials();
    } catch (error) {
      console.error('Failed to delete material:', error);
    }
  };

  const resetForm = () => {
    setEditingMaterial(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      category: 'OTHER',
      unitOfMeasure: 'UNITS',
      defaultUnitPrice: undefined,
      isActive: true
    });
  };

  return (
    <div className="materials-page">
      <div className="page-header">
        <div>
          <h1>Materiales</h1>
          <p>Catálogo de materiales disponibles</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          ➕ Nuevo Material
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Buscar materiales..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
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
                <th>Categoría</th>
                <th>Unidad</th>
                <th>Precio Unit.</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(materials || []).map(material => (
                <tr key={material.id}>
                  <td><code>{material.code}</code></td>
                  <td>{material.name}</td>
                  <td>{CATEGORY_LABELS[material.category]}</td>
                  <td>{UNIT_LABELS[material.unitOfMeasure]}</td>
                  <td>{material.defaultUnitPrice ? `${material.defaultUnitPrice.toLocaleString('es-CL')}` : '-'}</td>
                  <td>
                    <span className={`badge ${material.isActive ? 'badge--active' : 'badge--inactive'}`}>
                      {material.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn-icon" onClick={() => handleEdit(material)} title="Editar">
                        ✏️
                      </button>
                      <button className="btn-icon btn-icon--danger" onClick={() => handleDelete(material.id)} title="Eliminar">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(materials || []).length === 0 && (
                <tr>
                  <td colSpan={8} className="empty">No se encontraron materiales</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMaterial ? 'Editar Material' : 'Nuevo Material'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                {editingMaterial && (
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
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Categoría *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as MaterialCategory })}
                    required
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Unidad de Medida *</label>
                  <select
                    value={formData.unitOfMeasure}
                    onChange={e => setFormData({ ...formData, unitOfMeasure: e.target.value as UnitOfMeasure })}
                    required
                  >
                    {UNITS.map(unit => (
                      <option key={unit} value={unit}>{UNIT_LABELS[unit]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Precio Unitario</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.defaultUnitPrice || ''}
                  onChange={e => setFormData({ ...formData, defaultUnitPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Material activo
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingMaterial ? 'Guardar Cambios' : 'Crear Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
