import { useState, useEffect } from 'react';
import api from '../api';
import type { WorkOrder, CreateWorkOrderDTO, Supplier, WorkOrderStatus, PaymentType } from '../types';
import { generateWorkOrderPDF } from '../utils/pdfGenerator';
import './WorkOrdersPage.css';

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

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingWorkOrder, setViewingWorkOrder] = useState<WorkOrder | null>(null);
  const [companyInfo, setCompanyInfo] = useState<any>({});

  const loadCompanySettings = async () => {
    try {
      const settings = await api.getSettingsByCategory('general');
      const settingsMap: Record<string, any> = {};
      (Array.isArray(settings) ? settings : settings.data || []).forEach((s: any) => { settingsMap[s.key] = s.value; });
      setCompanyInfo(settingsMap);
    } catch (error) { console.error('Failed to load company settings:', error); }
  };

  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadWorkOrders(); loadSuppliers(); loadProjects(); loadCompanySettings();
  }, [statusFilter]);

  // Effect separado para abrir orden desde el dashboard
  useEffect(() => {
    const openWorkOrderId = localStorage.getItem('PROCURA_OPEN_WORKORDER');
    if (openWorkOrderId && workOrders.length > 0) {
      localStorage.removeItem('PROCURA_OPEN_WORKORDER');
      const workOrder = workOrders.find(wo => wo.id === openWorkOrderId);
      if (workOrder) {
        setViewingWorkOrder(workOrder);
        setShowViewModal(true);
      }
    }
  }, [workOrders]);

  const handleExportPDF = (workOrder: WorkOrder) => {
    generateWorkOrderPDF(workOrder, {
      name: companyInfo.COMPANY_NAME || 'Gestiona',
      rut: companyInfo.COMPANY_RUT,
      address: companyInfo.COMPANY_ADDRESS,
      phone: companyInfo.COMPANY_PHONE,
      email: companyInfo.COMPANY_EMAIL
    }, {
      name: workOrder.supplierName || '',
      rut: (workOrder as any).supplier?.rut,
      address: (workOrder as any).supplier?.address,
      phone: (workOrder as any).supplier?.phone,
      email: (workOrder as any).supplier?.email
    }, workOrder.projectName ? { name: workOrder.projectName } : undefined);
  };

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
    loadWorkOrders();
    loadSuppliers();
    loadProjects();
  }, [statusFilter]);

  // Effect separado para abrir orden desde dashboard
  useEffect(() => {
    const workOrderId = localStorage.getItem('PROCURA_WORK_ORDER_ID');
    if (workOrderId && workOrders.length > 0) {
      localStorage.removeItem('PROCURA_WORK_ORDER_ID');
      const wo = workOrders.find((w: WorkOrder) => w.id === workOrderId);
      if (wo) {
        setViewingWorkOrder(wo);
        setShowViewModal(true);
      }
    }
  }, [workOrders]);

  const loadWorkOrders = async () => {
    try {
      setIsLoading(true);
      const data = await api.getWorkOrders();
      let filtered = data;
      if (statusFilter) {
        filtered = data.filter((wo: WorkOrder) => wo.status === statusFilter);
      }
      setWorkOrders(filtered);
    } catch (error) {
      console.error('Failed to load work orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await api.getSuppliers({});
      setSuppliers(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const data = await api.getProjects({});
      setProjects(data.data || data || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleEdit = (workOrder: WorkOrder) => {
    setEditingWorkOrder(workOrder);
    setFormData({
      supplierId: workOrder.supplierId,
      title: workOrder.title,
      description: workOrder.description || '',
      projectId: (workOrder as any).projectId || '',
      startDate: workOrder.startDate ? workOrder.startDate.split('T')[0] : '',
      endDate: workOrder.endDate ? workOrder.endDate.split('T')[0] : '',
      executionDays: workOrder.executionDays || undefined,
      totalValue: workOrder.totalValue,
      paymentType: workOrder.paymentType,
      paymentTerms: workOrder.paymentTerms || '',
      status: workOrder.status,
      observations: workOrder.observations || '',
      items: workOrder.items?.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        iva: (item as any).iva || false,
        observations: item.observations || '',
        applyAiu: (item as any).applyAiu || false,
        aiuAdministration: (item as any).aiuAdministration || 0,
        aiuImprevistos: (item as any).aiuImprevistos || 0,
        aiuUtilidad: (item as any).aiuUtilidad || 0
      })) || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta orden de trabajo?')) return;
    try {
      await api.deleteWorkOrder(id);
      loadWorkOrders();
    } catch (error) {
      console.error('Failed to delete work order:', error);
    }
  };

  const resetForm = () => {
    setEditingWorkOrder(null);
    setFormData({
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Calcular automáticamente el plazo en días
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

      if (editingWorkOrder) {
        await api.updateWorkOrder(editingWorkOrder.id, dataToSend);
      } else {
        await api.createWorkOrder(dataToSend);
      }
      setShowModal(false);
      loadWorkOrders();
    } catch (error) {
      console.error('Failed to save work order:', error);
      alert('Error al guardar orden de trabajo');
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
      
      // Calcular AIU por ítem
      let aiuTotal = 0;
      if (item.applyAiu) {
        const aiuPercentage = (item.aiuAdministration || 0) + (item.aiuImprevistos || 0) + (item.aiuUtilidad || 0);
        aiuTotal = itemSubtotal * (aiuPercentage / 100);
      }
      
      // Total incluye AIU
      newItems[index].totalPrice = itemSubtotal + aiuTotal;
    }
    
    setFormData({ ...formData, items: newItems });
    recalculateTotal(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = (formData.items || []).filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
    recalculateTotal(newItems);
  };

  const calculateSubtotal = () => {
    // Subtotal incluyendo AIU (sin IVA)
    return (formData.items || []).reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      
      // Calcular AIU por ítem
      let aiuTotal = 0;
      if (item.applyAiu) {
        const aiuPercentage = (item.aiuAdministration || 0) + (item.aiuImprevistos || 0) + (item.aiuUtilidad || 0);
        aiuTotal = itemSubtotal * (aiuPercentage / 100);
      }
      
      return sum + itemSubtotal + aiuTotal;
    }, 0);
  };

  const calculateIVA = () => {
    // IVA 19% de items marcados
    return (formData.items || []).reduce((sum, item) => {
      if (item.iva) {
        return sum + (item.quantity * item.unitPrice * 0.19);
      }
      return sum;
    }, 0);
  };

  const calculateTotal = () => {
    // Total = Subtotal (que ya incluye IVA)
    return calculateSubtotal();
  };

  const recalculateTotal = (items: any[]) => {
    let subtotal = 0;
    let iva = 0;
    
    items.forEach(item => {
      const itemSubtotal = item.quantity * item.unitPrice;
      
      // Calcular AIU por ítem
      let aiuTotal = 0;
      if (item.applyAiu) {
        const aiuPercentage = (item.aiuAdministration || 0) + (item.aiuImprevistos || 0) + (item.aiuUtilidad || 0);
        aiuTotal = itemSubtotal * (aiuPercentage / 100);
      }
      
      // Subtotal incluye AIU
      subtotal += itemSubtotal + aiuTotal;
      
      // IVA se calcula sobre el costo directo (sin AIU)
      if (item.iva) {
        iva += itemSubtotal * 0.19;
      }
    });
    
    const total = subtotal + iva;
    setFormData(prev => ({ ...prev, totalValue: total }));
  };

  const getStatusBadgeClass = (status: WorkOrderStatus) => {
    switch (status) {
      case 'DRAFT': return 'badge--gray';
      case 'APPROVED': return 'badge--blue';
      case 'IN_PROGRESS': return 'badge--yellow';
      case 'COMPLETED': return 'badge--green';
      case 'SUSPENDED': return 'badge--orange';
      case 'CANCELLED': return 'badge--red';
      default: return '';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-CO');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
  };

  // Función para obtener el color del semáforo según días restantes
  const getTrafficLight = (days: number | null | undefined) => {
    if (days === null || days === undefined) {
      return { color: '#9ca3af', label: 'Sin fecha', icon: '⚪' }; // Gris
    }
    if (days < 0) {
      return { color: '#dc2626', label: 'Vencido', icon: '🔴' }; // Rojo - Vencido
    }
    if (days <= 30) {
      return { color: '#dc2626', label: `${days} días`, icon: '🔴' }; // Rojo - Crítico
    }
    if (days <= 90) {
      return { color: '#f59e0b', label: `${days} días`, icon: '🟡' }; // Amarillo - Advertencia
    }
    return { color: '#22c55e', label: `${days} días`, icon: '🟢' }; // Verde - OK
  };

  return (
    <div className="work-orders-page">
      <div className="page-header">
        <div>
          <h1>Órdenes de Trabajo</h1>
          <p>Gestión de contratos por actividades</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          ➕ Nueva Orden de Trabajo
        </button>
      </div>

      <div className="filters">
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
                <th>🔔</th>
                <th>Código</th>
                <th>Título</th>
                <th>Proveedor</th>
                <th>Proyecto</th>
                <th>Valor</th>
                <th>Estado</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(workOrders || []).map(wo => {
                const trafficLight = getTrafficLight(wo.daysUntilExpiration);
                return (
                <tr key={wo.id}>
                  <td>
                    <span 
                      style={{ 
                        color: trafficLight.color, 
                        fontSize: '18px',
                        cursor: 'help'
                      }} 
                      title={trafficLight.label}
                    >
                      {trafficLight.icon}
                    </span>
                  </td>
                  <td><code>{wo.code}</code></td>
                  <td>{wo.title}</td>
                  <td>{wo.supplierName || '-'}</td>
                  <td>{wo.projectName || '-'}</td>
                  <td>{formatCurrency(wo.totalValue)}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(wo.status)}`}>
                      {STATUS_OPTIONS.find(s => s.value === wo.status)?.label || wo.status}
                    </span>
                  </td>
                  <td>{formatDate(wo.startDate)}</td>
                  <td>{formatDate(wo.endDate)}</td>
                  <td>
                    <div className="actions">
                      <button className="btn-icon" onClick={() => handleExportPDF(wo)} title="Exportar PDF">
                        📄
                      </button>
                      <button className="btn-icon" onClick={() => handleEdit(wo)} title="Editar">
                        ✏️
                      </button>
                      <button className="btn-icon" onClick={() => handleDelete(wo.id)} title="Eliminar">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
              {(workOrders || []).length === 0 && (
                <tr>
                  <td colSpan={10} className="empty">No se encontraron órdenes de trabajo</td>
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
              <h2>{editingWorkOrder ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Proveedor *</label>
                    <select
                      value={formData.supplierId}
                      onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                      required
                    >
                      <option value="">Seleccionar proveedor</option>
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
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Fecha Inicio</label>
                    <input
                      type="date"
                      value={formData.startDate ? String(formData.startDate).split('T')[0] : ''}
                      onChange={e => {
                        const newStartDate = e.target.value;
                        setFormData({ ...formData, startDate: newStartDate });
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha Fin</label>
                    <input
                      type="date"
                      value={formData.endDate ? String(formData.endDate).split('T')[0] : ''}
                      onChange={e => {
                        const newEndDate = e.target.value;
                        setFormData({ ...formData, endDate: newEndDate });
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Plazo (días)</label>
                    <input
                      type="number"
                      value={(() => {
                        if (formData.startDate && formData.endDate) {
                          const start = new Date(formData.startDate);
                          const end = new Date(formData.endDate);
                          const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                          return diff > 0 ? diff : 0;
                        }
                        return formData.executionDays || '';
                      })()}
                      readOnly
                      style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                      title="Se calcula automáticamente entre fecha de inicio y fin"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Forma de Pago</label>
                    <select
                      value={formData.paymentType}
                      onChange={e => setFormData({ ...formData, paymentType: e.target.value as PaymentType })}
                    >
                      {PAYMENT_TYPE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Términos de Pago</label>
                    <input
                      type="text"
                      value={formData.paymentTerms}
                      onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                      placeholder="Ej: 50% anticipo, 50% entrega"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Items</label>
                  <div className="items-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Descripción</th>
                          <th>Cant.</th>
                          <th>Unidad</th>
                          <th>Precio Unit.</th>
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
                                placeholder="Descripción del item"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
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
                                title="Aplicar IVA 19%"
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={item.applyAiu || false}
                                onChange={e => updateItem(index, 'applyAiu', e.target.checked)}
                                title="Aplicar AIU (Administración, Imprevistos, Utilidad)"
                              />
                              {item.applyAiu && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px', fontSize: '10px' }}>
                                  <span>Admin: <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={item.aiuAdministration || 0}
                                    onChange={e => updateItem(index, 'aiuAdministration', parseFloat(e.target.value) || 0)}
                                    style={{ width: '40px', padding: '2px' }}
                                    title="% Administración"
                                  />%</span>
                                  <span>Impr: <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={item.aiuImprevistos || 0}
                                    onChange={e => updateItem(index, 'aiuImprevistos', parseFloat(e.target.value) || 0)}
                                    style={{ width: '40px', padding: '2px' }}
                                    title="% Imprevistos"
                                  />%</span>
                                  <span>Util: <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={item.aiuUtilidad || 0}
                                    onChange={e => updateItem(index, 'aiuUtilidad', parseFloat(e.target.value) || 0)}
                                    style={{ width: '40px', padding: '2px' }}
                                    title="% Utilidad"
                                  />%</span>
                                </div>
                              )}
                            </td>
                            <td>{formatCurrency(item.totalPrice || item.quantity * item.unitPrice)}</td>
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
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Subtotal</label>
                    <input
                      type="number"
                      step="0.01"
                      value={calculateSubtotal()}
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label>IVA (19%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={calculateIVA()}
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label>Total</label>
                    <input
                      type="number"
                      step="0.01"
                      value={calculateTotal()}
                      readOnly
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Observaciones</label>
                    <textarea
                      value={formData.observations}
                      onChange={e => setFormData({ ...formData, observations: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingWorkOrder ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Vista de Orden de Trabajo */}
      {showViewModal && viewingWorkOrder && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Orden de Trabajo: {viewingWorkOrder.code}</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Estado</label>
                  <span className={`badge badge--${viewingWorkOrder.status === 'APPROVED' ? 'blue' : viewingWorkOrder.status === 'COMPLETED' ? 'green' : viewingWorkOrder.status === 'CANCELLED' ? 'red' : 'gray'}`}>
                    {viewingWorkOrder.status}
                  </span>
                </div>
                <div className="form-group">
                  <label>Proveedor</label>
                  <p>{(viewingWorkOrder as any).supplierName || viewingWorkOrder.supplierId}</p>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Título</label>
                  <p>{viewingWorkOrder.title}</p>
                </div>
              </div>

              {viewingWorkOrder.description && (
                <div className="form-group">
                  <label>Descripción</label>
                  <p>{viewingWorkOrder.description}</p>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha Inicio</label>
                  <p>{viewingWorkOrder.startDate ? new Date(viewingWorkOrder.startDate).toLocaleDateString('es-CL') : '-'}</p>
                </div>
                <div className="form-group">
                  <label>Fecha Vencimiento</label>
                  <p>{viewingWorkOrder.endDate ? new Date(viewingWorkOrder.endDate).toLocaleDateString('es-CL') : '-'}</p>
                </div>
                <div className="form-group">
                  <label>Plazo (días)</label>
                  <p>{viewingWorkOrder.executionDays || '-'}</p>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Subtotal</label>
                  <p>${(viewingWorkOrder.subtotal || 0).toLocaleString('es-CL')}</p>
                </div>
                <div className="form-group">
                  <label>IVA (19%)</label>
                  <p>${(viewingWorkOrder.iva || 0).toLocaleString('es-CL')}</p>
                </div>
                <div className="form-group">
                  <label>Total</label>
                  <p style={{ fontWeight: 'bold', fontSize: '18px' }}>${(viewingWorkOrder.totalValue || 0).toLocaleString('es-CL')}</p>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de Pago</label>
                  <p>{viewingWorkOrder.paymentType}</p>
                </div>
                <div className="form-group">
                  <label>Términos de Pago</label>
                  <p>{viewingWorkOrder.paymentTerms || '-'}</p>
                </div>
              </div>

              {viewingWorkOrder.observations && (
                <div className="form-group">
                  <label>Observaciones</label>
                  <p>{viewingWorkOrder.observations}</p>
                </div>
              )}

              {viewingWorkOrder.items && viewingWorkOrder.items.length > 0 && (
                <div className="form-group">
                  <label>Items</label>
                  <table className="data-table" style={{ marginTop: '8px' }}>
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th>Cant.</th>
                        <th>Unidad</th>
                        <th>Precio Unit.</th>
                        <th>IVA</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingWorkOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.description}</td>
                          <td>{item.quantity}</td>
                          <td>{item.unit}</td>
                          <td>${item.unitPrice.toLocaleString('es-CL')}</td>
                          <td>{item.iva ? '✓' : '-'}</td>
                          <td>${item.totalPrice.toLocaleString('es-CL')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowViewModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
