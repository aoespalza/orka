import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import type { CreateWorkOrderDTO, Supplier, WorkOrderStatus, PaymentType } from '../types';
import './NewWorkOrderPage.css';

const STATUS_OPTIONS: { value: WorkOrderStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'APPROVED', label: 'Aprobado' },
  { value: 'IN_PROGRESS', label: 'En Ejecución' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'SUSPENDED', label: 'Suspendido' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

const PAYMENT_TYPE_OPTIONS: { value: PaymentType; label: string }[] = [
  { value: 'FIJO', label: 'Valor Fijo' },
  { value: 'ANTICIPO', label: 'Anticipo' },
  { value: 'POR_AVANCE', label: 'Por Avance' },
  { value: 'MIXTO', label: 'Mixto' },
];

const UNIT_OPTIONS = [
  { value: 'UNIDAD', label: 'Unidad' },
  { value: 'M2', label: 'm²' },
  { value: 'M3', label: 'm³' },
  { value: 'KG', label: 'Kg' },
  { value: 'TON', label: 'Tonelada' },
  { value: 'METRO', label: 'Metro' },
  { value: 'DIA', label: 'Día' },
  { value: 'HORA', label: 'Hora' },
];

export default function NewWorkOrderPage() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<CreateWorkOrderDTO>({
    supplierId: '',
    title: '',
    description: '',
    projectId: '',
    startDate: '',
    endDate: '',
    executionDays: undefined,
    totalValue: 0,
    paymentType: 'FIJO',
    paymentTerms: '',
    status: 'DRAFT',
    observations: '',
    items: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [suppliersData, projectsData] = await Promise.all([
        api.getSuppliers({}),
        api.getProjects({})
      ]);
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : suppliersData.data || []);
      setProjects(projectsData.data || projectsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);

      let calculatedDays = formData.executionDays;
      if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        calculatedDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }

      const dataToSend = {
        ...formData,
        executionDays: calculatedDays,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      };

      await api.createWorkOrder(dataToSend);
      navigate('/work-orders');
    } catch (error) {
      console.error('Error saving work order:', error);
      alert('Error al guardar orden de trabajo');
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...(formData.items || []),
        {
          description: '',
          quantity: 1,
          unit: 'UNIDAD',
          unitPrice: 0,
          iva: false,
          observations: '',
          applyAiu: false,
          aiuAdministration: 0,
          aiuImprevistos: 0,
          aiuUtilidad: 0
        }
      ]
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...(formData.items || [])];
    (newItems[index] as any)[field] = value;

    if (field === 'quantity' || field === 'unitPrice' || field === 'applyAiu' || field === 'aiuAdministration' || field === 'aiuImprevistos' || field === 'aiuUtilidad') {
      const item = newItems[index];
      const itemSubtotal = item.quantity * item.unitPrice;

      let aiuTotal = 0;
      if (item.applyAiu) {
        const aiuPercentage = (item.aiuAdministration || 0) + (item.aiuImprevistos || 0) + (item.aiuUtilidad || 0);
        aiuTotal = itemSubtotal * (aiuPercentage / 100);
      }

      newItems[index].totalPrice = itemSubtotal + aiuTotal;
    }

    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = [...(formData.items || [])];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const calculateSubtotal = () => {
    if (!formData.items || formData.items.length === 0) return 0;
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateIVA = () => {
    if (!formData.items || formData.items.length === 0) return 0;
    return formData.items
      .filter(item => item.iva)
      .reduce((sum, item) => sum + (item.quantity * item.unitPrice * 0.19), 0);
  };

  const calculateTotal = () => {
    if (!formData.items || formData.items.length === 0) return 0;
    const subtotal = calculateSubtotal();
    const iva = calculateIVA();
    const aiuTotal = formData.items
      .filter(item => item.applyAiu)
      .reduce((sum, item) => {
        const itemSubtotal = item.quantity * item.unitPrice;
        const aiuPercentage = (item.aiuAdministration || 0) + (item.aiuImprevistos || 0) + (item.aiuUtilidad || 0);
        return sum + (itemSubtotal * aiuPercentage / 100);
      }, 0);
    return subtotal + iva + aiuTotal;
  };

  if (isLoading) {
    return <div className="new-work-order-page"><div className="loading">Cargando...</div></div>;
  }

  return (
    <div className="new-work-order-page">
      <div className="page-header">
        <div>
          <h1>Nueva Orden de Trabajo</h1>
          <p>Crear una nueva orden de trabajo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="work-order-form">
        <div className="form-section">
          <h3>Información General</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Contratista *</label>
              <select
                value={formData.supplierId}
                onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                required
              >
                <option value="">Seleccionar contratista</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Estado</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as WorkOrderStatus })}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Título *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Título de la orden de trabajo"
            />
          </div>

          <div className="form-group">
            <label>Proyecto</label>
            <select
              value={formData.projectId}
              onChange={e => setFormData({ ...formData, projectId: e.target.value })}
            >
              <option value="">Seleccionar proyecto...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder="Descripción de la orden de trabajo"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Fechas y Plazos</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Fecha Inicio</label>
              <input
                type="date"
                value={formData.startDate ? String(formData.startDate).split('T')[0] : ''}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Fecha Fin</label>
              <input
                type="date"
                value={formData.endDate ? String(formData.endDate).split('T')[0] : ''}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Plazo (días)</label>
              <input
                type="number"
                value={
                  formData.startDate && formData.endDate
                    ? Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
                    : formData.executionDays || ''
                }
                readOnly
                placeholder="Calculado automáticamente"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Condiciones de Pago</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Tipo de Pago</label>
              <select
                value={formData.paymentType}
                onChange={e => setFormData({ ...formData, paymentType: e.target.value as PaymentType })}
              >
                {PAYMENT_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Términos de Pago</label>
              <input
                type="text"
                value={formData.paymentTerms}
                onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                placeholder="Ej: 50% anticipo, 50% contra entrega"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Ítems</h3>
          <table className="items-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Unidad</th>
                <th>Vr. Unitario</th>
                <th>IVA</th>
                <th>AIU</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(formData.items || []).map((item, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => updateItem(index, 'description', e.target.value)}
                      placeholder="Descripción del ítem"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.quantity}
                      onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td>
                    <select
                      value={item.unit}
                      onChange={e => updateItem(index, 'unit', e.target.value)}
                    >
                      {UNIT_OPTIONS.map(u => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={item.iva || false}
                      onChange={e => updateItem(index, 'iva', e.target.checked)}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={item.applyAiu || false}
                      onChange={e => updateItem(index, 'applyAiu', e.target.checked)}
                    />
                    {item.applyAiu && (
                      <div className="aiu-inputs">
                        <span>A: <input
                          type="number"
                          step="0.1"
                          value={item.aiuAdministration || 0}
                          onChange={e => updateItem(index, 'aiuAdministration', parseFloat(e.target.value) || 0)}
                        />%</span>
                        <span>I: <input
                          type="number"
                          step="0.1"
                          value={item.aiuImprevistos || 0}
                          onChange={e => updateItem(index, 'aiuImprevistos', parseFloat(e.target.value) || 0)}
                        />%</span>
                        <span>U: <input
                          type="number"
                          step="0.1"
                          value={item.aiuUtilidad || 0}
                          onChange={e => updateItem(index, 'aiuUtilidad', parseFloat(e.target.value) || 0)}
                        />%</span>
                      </div>
                    )}
                  </td>
                  <td>${(item.totalPrice || item.quantity * item.unitPrice).toLocaleString('es-CL')}</td>
                  <td>
                    <button type="button" className="btn-icon" onClick={() => removeItem(index)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="btn-secondary" onClick={addItem}>
            ➕ Agregar Item
          </button>
        </div>

        <div className="form-section totals-section">
          <h3>Totales</h3>
          <div className="totals">
            <div className="total-item">
              <label>Subtotal</label>
              <span>${calculateSubtotal().toLocaleString('es-CL')}</span>
            </div>
            <div className="total-item">
              <label>IVA (19%)</label>
              <span>${calculateIVA().toLocaleString('es-CL')}</span>
            </div>
            <div className="total-item total-final">
              <label>Total</label>
              <span>${calculateTotal().toLocaleString('es-CL')}</span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label>Observaciones</label>
            <textarea
              value={formData.observations}
              onChange={e => setFormData({ ...formData, observations: e.target.value })}
              rows={3}
              placeholder="Observaciones adicionales"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/work-orders')}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Crear Orden de Trabajo'}
          </button>
        </div>
      </form>
    </div>
  );
}