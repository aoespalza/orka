import { useState, useEffect } from 'react';
import api from '../api';
import type { Contract, CreateContractDTO, CreateContractItemDTO, Supplier, ContractStatus } from '../types';
import { generateContractPDF } from '../utils/pdfGenerator';
import './ContractsPage.css';

const CONTRACT_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'SUSPENDED', label: 'Suspendido' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'CANCELLED', label: 'Cancelado' }
];

const FIC_OPTIONS = [
  { value: 'NO', label: 'No' },
  { value: 'SI', label: 'Sí' }
];

const POLIZA_OPTIONS = [
  { value: 'NO', label: 'No' },
  { value: 'SI', label: 'Sí' },
  { value: 'N/A', label: 'N/A' }
];

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [companyInfo, setCompanyInfo] = useState<any>({});

  useEffect(() => {
    loadContracts(); loadSuppliers(); loadProjects(); loadCompanySettings();
  }, [statusFilter, supplierFilter, projectFilter]);

  // Effect para abrir contrato desde el dashboard
  useEffect(() => {
    const openContractId = localStorage.getItem('PROCURA_OPEN_CONTRACT');
    if (openContractId && contracts.length > 0) {
      localStorage.removeItem('PROCURA_OPEN_CONTRACT');
      const contract = contracts.find(c => c.id === openContractId);
      if (contract) {
        handleEdit(contract);
      }
    }
  }, [contracts]);

  const loadCompanySettings = async () => {
    try {
      const settings = await api.getSettingsByCategory('general');
      const settingsMap: Record<string, any> = {};
      (Array.isArray(settings) ? settings : settings.data || []).forEach((s: any) => { settingsMap[s.key] = s.value; });
      setCompanyInfo(settingsMap);
    } catch (error) { console.error('Failed to load company settings:', error); }
  };

  const handleExportPDF = (contract: Contract) => {
    generateContractPDF(contract, {
      name: companyInfo.COMPANY_NAME || 'Gestiona',
      rut: companyInfo.COMPANY_RUT,
      address: companyInfo.COMPANY_ADDRESS,
      phone: companyInfo.COMPANY_PHONE,
      email: companyInfo.COMPANY_EMAIL
    }, {
      name: contract.supplier?.name || '',
      rut: contract.supplier?.rut,
      address: contract.supplier?.address,
      phone: contract.supplier?.phone,
      email: contract.supplier?.email
    }, undefined);
  };

  const [formData, setFormData] = useState<CreateContractDTO>({
    workOrderId: '',
    projectId: '',
    supplierId: '',
    startDate: '',
    endDate: '',
    value: 0,
    fic: 'NO',
    actaStartDate: '',
    actaEndDate: '',
    otroSiNumber: undefined,
    otroSiEndDate: '',
    otroSiValue: 0,
    advancePayment: 0,
    status: 'DRAFT',
    observations: '',
    docContratoFirmado: 'NO',
    docRequierePoliza: 'N/A',
    polizaStartDate: '',
    polizaEndDate: '',
    items: []
  });

  // Estado para items del contrato
  const [contractItems, setContractItems] = useState<CreateContractItemDTO[]>([]);
  const [newItem, setNewItem] = useState<CreateContractItemDTO>({
    description: '',
    quantity: 1,
    unit: 'UNITS',
    unitPrice: 0,
    iva: false,
    applyAiu: false,
    aiuAdministration: 0,
    aiuImprevistos: 0,
    aiuUtilidad: 0
  });

  useEffect(() => {
    loadContracts();
    loadSuppliers();
  }, [statusFilter, supplierFilter, projectFilter]);

  const loadContracts = async () => {
    try {
      setIsLoading(true);
      const filters = statusFilter ? { status: statusFilter } : undefined;
      let data = await api.getContracts(filters);
      
      // Apply client-side filters
      if (supplierFilter) {
        data = data.filter((c: Contract) => c.supplierId === supplierFilter);
      }
      if (projectFilter) {
        data = data.filter((c: Contract) => c.projectId === projectFilter);
      }
      
      setContracts(data);
    } catch (error) {
      console.error('Failed to load contracts:', error);
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
      setProjects(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      workOrderId: contract.workOrderId || '',
      projectId: contract.projectId || '',
      supplierId: contract.supplierId,
      startDate: contract.startDate ? contract.startDate.split('T')[0] : '',
      endDate: contract.endDate ? contract.endDate.split('T')[0] : '',
      value: contract.value,
      fic: contract.fic,
      actaStartDate: contract.actaStartDate ? contract.actaStartDate.split('T')[0] : '',
      actaEndDate: contract.actaEndDate ? contract.actaEndDate.split('T')[0] : '',
      otroSiNumber: contract.otroSiNumber || undefined,
      otroSiEndDate: contract.otroSiEndDate ? contract.otroSiEndDate.split('T')[0] : '',
      otroSiValue: contract.otroSiValue,
      advancePayment: contract.advancePayment,
      status: contract.status,
      observations: contract.observations || '',
      docContratoFirmado: contract.docContratoFirmado || 'NO',
      docRequierePoliza: contract.docRequierePoliza || 'N/A',
      polizaStartDate: contract.polizaStartDate ? contract.polizaStartDate.split('T')[0] : '',
      polizaEndDate: contract.polizaEndDate ? contract.polizaEndDate.split('T')[0] : '',
      items: contract.items?.map(item => ({
        materialId: item.materialId,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        iva: item.iva,
        observations: item.observations,
        applyAiu: item.applyAiu,
        aiuAdministration: item.aiuAdministration,
        aiuImprevistos: item.aiuImprevistos,
        aiuUtilidad: item.aiuUtilidad
      })) || []
    });
    setContractItems(contract.items?.map(item => ({
      materialId: item.materialId,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      iva: item.iva,
      observations: item.observations,
      applyAiu: item.applyAiu,
      aiuAdministration: item.aiuAdministration,
      aiuImprevistos: item.aiuImprevistos,
      aiuUtilidad: item.aiuUtilidad
    })) || []);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este contrato?')) return;
    try {
      await api.deleteContract(id);
      loadContracts();
    } catch (error) {
      console.error('Failed to delete contract:', error);
    }
  };

  const resetForm = () => {
    setEditingContract(null);
    setFormData({
      workOrderId: '',
      supplierId: '',
      startDate: '',
      endDate: '',
      value: 0,
      fic: 'NO',
      actaStartDate: '',
      actaEndDate: '',
      otroSiNumber: undefined,
      otroSiEndDate: '',
      otroSiValue: 0,
      advancePayment: 0,
      status: 'DRAFT',
      observations: '',
      docContratoFirmado: 'NO',
      docRequierePoliza: 'N/A',
      items: []
    });
    setContractItems([]);
    setNewItem({
      description: '',
      quantity: 1,
      unit: 'UNITS',
      unitPrice: 0,
      iva: false,
      applyAiu: false,
      aiuAdministration: 0,
      aiuImprevistos: 0,
      aiuUtilidad: 0
    });
  };

  // Funciones para manejar items
  const calculateItemTotal = (item: CreateContractItemDTO) => {
    const subtotal = item.quantity * item.unitPrice;
    let aiuTotal = 0;
    if (item.applyAiu) {
      const aiuPercentage = (item.aiuAdministration || 0) + (item.aiuImprevistos || 0) + (item.aiuUtilidad || 0);
      aiuTotal = subtotal * (aiuPercentage / 100);
    }
    return subtotal + aiuTotal;
  };

  const calculateContractTotals = () => {
    let subtotal = 0;
    let iva = 0;
    contractItems.forEach(item => {
      const itemSubtotal = item.quantity * item.unitPrice;
      let aiuTotal = 0;
      if (item.applyAiu) {
        const aiuPercentage = (item.aiuAdministration || 0) + (item.aiuImprevistos || 0) + (item.aiuUtilidad || 0);
        aiuTotal = itemSubtotal * (aiuPercentage / 100);
      }
      subtotal += itemSubtotal + aiuTotal;
      if (item.iva) {
        iva += itemSubtotal * 0.19;
      }
    });
    return { subtotal, iva, total: subtotal + iva };
  };

  const addItem = () => {
    if (!newItem.description || newItem.quantity <= 0 || newItem.unitPrice <= 0) {
      alert('Por favor complete los campos obligatorios del ítem');
      return;
    }
    setContractItems([...contractItems, { ...newItem }]);
    setNewItem({
      description: '',
      quantity: 1,
      unit: 'UNITS',
      unitPrice: 0,
      iva: false,
      applyAiu: false,
      aiuAdministration: 0,
      aiuImprevistos: 0,
      aiuUtilidad: 0
    });
  };

  const removeItem = (index: number) => {
    setContractItems(contractItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar si se está agregando un OtroSi y si requiere póliza
    const hasOtroSi = formData.otroSiNumber || formData.otroSiEndDate;
    const requiresPoliza = formData.docRequierePoliza === 'SI';
    let shouldNotifyPolicyUpdate = false;
    
    if (hasOtroSi && requiresPoliza) {
      const confirmSubmit = window.confirm(
        '⚠️ El contrato requiere póliza y se está agregando un Otro Sí.\n\n' +
        '¿Desea continuar sin actualizar las fechas de la póliza?\n\n' +
        'Recuerde que debe actualizar la fecha de vencimiento de la póliza para que las notificaciones funcionen correctamente.'
      );
      if (!confirmSubmit) {
        return;
      }
      shouldNotifyPolicyUpdate = true;
    }
    
    try {
      const contractData = {
        ...formData,
        items: contractItems
      };
      
      let savedContractId = null;
      if (editingContract) {
        await api.updateContract(editingContract.id, contractData);
        savedContractId = editingContract.id;
      } else {
        const result = await api.createContract(contractData);
        savedContractId = result.id;
      }
      
      // Enviar notificación de actualización de póliza si aplica
      if (shouldNotifyPolicyUpdate && savedContractId) {
        try {
          await api.notifyPolicyUpdate([savedContractId]);
          alert('✅ Contrato guardado. Se ha enviado un email recordatorio sobre la actualización de la póliza.');
        } catch (notifyError) {
          console.error('Error al enviar notificación de póliza:', notifyError);
          alert('✅ Contrato guardado (sin notificación de póliza)');
        }
      }
      
      setShowModal(false);
      loadContracts();
      resetForm();
    } catch (error) {
      console.error('Failed to save contract:', error);
    }
  };

  const getStatusBadgeClass = (status: ContractStatus) => {
    switch (status) {
      case 'DRAFT': return 'badge--gray';
      case 'ACTIVE': return 'badge--green';
      case 'SUSPENDED': return 'badge--orange';
      case 'COMPLETED': return 'badge--blue';
      case 'CANCELLED': return 'badge--red';
      default: return 'badge--gray';
    }
  };

  const getStatusLabel = (status: ContractStatus) => {
    return CONTRACT_STATUS_OPTIONS.find(o => o.value === status)?.label || status;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL').format(value);
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

  const calculateFinalValue = () => {
    return (formData.value || 0) + (formData.otroSiValue || 0);
  };

  return (
    <div className="contracts-page">
      <div className="page-header">
        <h1>📜 Contratos</h1>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          ➕ Nuevo Contrato
        </button>
      </div>

      <div className="filters">
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {CONTRACT_STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select 
          value={supplierFilter} 
          onChange={e => setSupplierFilter(e.target.value)}
        >
          <option value="">Todos los proveedores</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select 
          value={projectFilter} 
          onChange={e => setProjectFilter(e.target.value)}
        >
          <option value="">Todos los proyectos</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>🔔</th>
              <th>Código</th>
              <th>Proyecto</th>
              <th>Proveedor</th>
              <th>Docs</th>
              <th>Fecha Inicio</th>
              <th>Fecha Fin</th>
              <th>Valor</th>
              <th>Valor Final</th>
              <th>Anticipo</th>
              <th>FIC</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map(contract => {
              const trafficLight = getTrafficLight(contract.daysUntilExpiration);
              return (
              <tr key={contract.id}>
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
                <td><strong>{contract.code}</strong></td>
                <td>{contract.project?.name || '-'}</td>
                <td>{contract.supplier?.name || contract.supplierId}</td>
                <td>{contract.docContratoFirmado === 'SI' ? '✅' : '❌'} / {contract.docRequierePoliza === 'SI' ? '✅' : contract.docRequierePoliza === 'N/A' ? 'N/A' : '❌'}</td>
                <td>{contract.startDate ? new Date(contract.startDate).toLocaleDateString('es-CL') : '-'}</td>
                <td>{contract.endDate ? new Date(contract.endDate).toLocaleDateString('es-CL') : '-'}</td>
                <td>{formatCurrency(contract.value)}</td>
                <td>{formatCurrency(contract.finalValue)}</td>
                <td>{contract.advancePayment > 0 ? `${contract.advancePayment}%` : '-'}</td>
                <td>
                  {contract.fic === 'SI' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>Sí</span>
                      {contract.docContratoFirmado === 'SI' ? (
                        <span style={{ color: 'green', fontSize: '14px' }}>✓</span>
                      ) : (
                        <span style={{ color: 'red', fontSize: '14px' }}>✗</span>
                      )}
                    </span>
                  ) : 'No'}
                </td>
                <td><span className={`badge ${getStatusBadgeClass(contract.status)}`}>{getStatusLabel(contract.status)}</span></td>
                <td>
                  <button className="btn-icon" onClick={() => handleExportPDF(contract)} title="Exportar PDF">📄</button>
                  <button className="btn-icon" onClick={() => handleEdit(contract)} title="Editar">✏️</button>
                  <button className="btn-icon" onClick={() => handleDelete(contract.id)} title="Eliminar">🗑️</button>
                </td>
              </tr>
              );
            })}
            {contracts.length === 0 && (
              <tr>
                <td colSpan={13} className="empty">No hay contratos</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingContract ? 'Editar Contrato' : 'Nuevo Contrato'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Proveedor *</label>
                <select name="supplierId" required value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})}>
                  <option value="">Seleccionar...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Proyecto</label>
                <select name="projectId" value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})}>
                  <option value="">Sin proyecto</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha Inicio</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Fecha Fin</label>
                  <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Valor Contrato</label>
                  <input type="number" value={formData.value} onChange={e => setFormData({...formData, value: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Pago Anticipado (%)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={formData.advancePayment} 
                    onChange={e => setFormData({...formData, advancePayment: Number(e.target.value)})} 
                  />
                  {(formData.advancePayment || 0) > 0 && (
                    <span style={{ fontSize: '12px', color: '#666', display: 'block', marginTop: '4px' }}>
                      = ${((formData.value || 0) * (formData.advancePayment || 0) / 100).toLocaleString('es-CL')}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Estado</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                    {CONTRACT_STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>FIC</label>
                  <select value={formData.fic} onChange={e => setFormData({...formData, fic: e.target.value as any})}>
                    {FIC_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {formData.fic === 'SI' && (
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.docContratoFirmado === 'SI'}
                        onChange={e => setFormData({...formData, docContratoFirmado: e.target.checked ? 'SI' : 'NO'})}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      ✓ Contrato Firmado
                    </label>
                  </div>
                )}

                <div className="form-group">
                  <label>Requiere Póliza</label>
                  <select value={formData.docRequierePoliza} onChange={e => setFormData({...formData, docRequierePoliza: e.target.value as any})}>
                    {POLIZA_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {formData.docRequierePoliza === 'SI' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Fecha Inicio Póliza</label>
                      <input
                        type="date"
                        value={formData.polizaStartDate || ''}
                        onChange={e => setFormData({...formData, polizaStartDate: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Fecha Fin Póliza</label>
                      <input
                        type="date"
                        value={formData.polizaEndDate || ''}
                        onChange={e => setFormData({...formData, polizaEndDate: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ 
                border: '2px solid #e0e0e0', 
                borderRadius: '8px', 
                padding: '16px',
                backgroundColor: '#f8f9fa',
                marginTop: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <strong style={{ color: '#0A2540' }}>📝 Otro Sí</strong>
                  <span style={{ fontSize: '12px', color: '#666' }}>(Modifica el valor y/o fecha de terminación del contrato)</span>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label style={{ fontWeight: 'normal', fontSize: '13px' }}>Número de Otro Sí</label>
                    <input 
                      type="number" 
                      placeholder="Ej: 1" 
                      value={formData.otroSiNumber || ''} 
                      onChange={e => setFormData({...formData, otroSiNumber: e.target.value ? Number(e.target.value) : undefined})} 
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: 'normal', fontSize: '13px' }}>Nueva Fecha Fin (prórroga)</label>
                    <input 
                      type="date" 
                      placeholder="Nueva fecha de terminación"
                      value={formData.otroSiEndDate} 
                      onChange={e => setFormData({...formData, otroSiEndDate: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: 'normal', fontSize: '13px' }}>Valor Adicional</label>
                    <input 
                      type="number" 
                      placeholder="Valor adicional por otro sí"
                      value={formData.otroSiValue} 
                      onChange={e => setFormData({...formData, otroSiValue: Number(e.target.value)})} 
                    />
                  </div>
                </div>
                {(formData.otroSiValue || 0) > 0 && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '8px', 
                    backgroundColor: '#e8f5e9', 
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}>
                    <strong>Valor Final del Contrato:</strong> ${(formData.value || 0).toLocaleString('es-CL')} + ${(formData.otroSiValue || 0).toLocaleString('es-CL')} = <strong>${calculateFinalValue().toLocaleString('es-CL')}</strong>
                  </div>
                )}
              </div>

              {/* Items del contrato con AIU */}
              <div className="form-group" style={{ 
                border: '2px solid #e0e0e0', 
                borderRadius: '8px', 
                padding: '16px',
                backgroundColor: '#f8f9fa',
                marginTop: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <strong style={{ color: '#0A2540' }}>📋 Items del Contrato</strong>
                  <span style={{ fontSize: '12px', color: '#666' }}>(Con AIU - Administración, Imprevistos, Utilidad)</span>
                </div>

                {/* Lista de items */}
                {contractItems.length > 0 && (
                  <table className="data-table" style={{ marginBottom: '12px', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th>Cant</th>
                        <th>Unidad</th>
                        <th>Precio</th>
                        <th>AIU</th>
                        <th>IVA</th>
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {contractItems.map((item, index) => (
                        <tr key={index}>
                          <td>{item.description}</td>
                          <td>{item.quantity}</td>
                          <td>{item.unit}</td>
                          <td>${item.unitPrice.toLocaleString('es-CL')}</td>
                          <td>
                            {item.applyAiu ? (
                              <span style={{ color: '#22c55e', fontSize: '11px' }}>
                                A:{item.aiuAdministration}% I:{item.aiuImprevistos}% U:{item.aiuUtilidad}%
                              </span>
                            ) : '-'}
                          </td>
                          <td>{item.iva ? '✅' : '-'}</td>
                          <td><strong>${calculateItemTotal(item).toLocaleString('es-CL')}</strong></td>
                          <td>
                            <button type="button" className="btn-icon" onClick={() => removeItem(index)} title="Eliminar">🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Agregar nuevo item */}
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#fff', 
                  borderRadius: '6px',
                  border: '1px solid #ddd'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>➕ Agregar Ítem</div>
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 2 }}>
                      <label style={{ fontWeight: 'normal', fontSize: '12px' }}>Descripción *</label>
                      <input 
                        type="text" 
                        placeholder="Descripción del ítem"
                        value={newItem.description}
                        onChange={e => setNewItem({...newItem, description: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: 'normal', fontSize: '12px' }}>Cantidad</label>
                      <input 
                        type="number"
                        min="1"
                        value={newItem.quantity}
                        onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: 'normal', fontSize: '12px' }}>Unidad</label>
                      <select 
                        value={newItem.unit}
                        onChange={e => setNewItem({...newItem, unit: e.target.value})}
                      >
                        <option value="UNITS">Unidades</option>
                        <option value="KG">Kilogramos</option>
                        <option value="TON">Toneladas</option>
                        <option value="METER">Metros</option>
                        <option value="LITER">Litros</option>
                        <option value="BOX">Cajas</option>
                        <option value="BAG">Bolsas</option>
                        <option value="PALLET">Paletas</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: 'normal', fontSize: '12px' }}>Precio Unit.</label>
                      <input 
                        type="number"
                        min="0"
                        value={newItem.unitPrice}
                        onChange={e => setNewItem({...newItem, unitPrice: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  {/* AIU Checkbox */}
                  <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox"
                        checked={newItem.applyAiu}
                        onChange={e => setNewItem({...newItem, applyAiu: e.target.checked})}
                      />
                      <span style={{ fontWeight: '600', color: '#0A2540' }}>Aplicar AIU</span>
                    </label>
                  </div>

                  {/* AIU Porcentajes */}
                  {newItem.applyAiu && (
                    <div className="form-row" style={{ marginTop: '8px' }}>
                      <div className="form-group">
                        <label style={{ fontWeight: 'normal', fontSize: '12px' }}>Administración %</label>
                        <input 
                          type="number"
                          min="0"
                          max="100"
                          value={newItem.aiuAdministration}
                          onChange={e => setNewItem({...newItem, aiuAdministration: Number(e.target.value)})}
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontWeight: 'normal', fontSize: '12px' }}>Imprevistos %</label>
                        <input 
                          type="number"
                          min="0"
                          max="100"
                          value={newItem.aiuImprevistos}
                          onChange={e => setNewItem({...newItem, aiuImprevistos: Number(e.target.value)})}
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontWeight: 'normal', fontSize: '12px' }}>Utilidad %</label>
                        <input 
                          type="number"
                          min="0"
                          max="100"
                          value={newItem.aiuUtilidad}
                          onChange={e => setNewItem({...newItem, aiuUtilidad: Number(e.target.value)})}
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontWeight: 'normal', fontSize: '12px' }}>Total AIU</label>
                        <div style={{ 
                          padding: '6px 10px', 
                          backgroundColor: '#e8f5e9', 
                          borderRadius: '4px',
                          fontWeight: '600',
                          color: '#2e7d32'
                        }}>
                          ${calculateItemTotal(newItem).toLocaleString('es-CL')}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* IVA Checkbox */}
                  <div style={{ marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox"
                        checked={newItem.iva}
                        onChange={e => setNewItem({...newItem, iva: e.target.checked})}
                      />
                      <span>Aplicar IVA (19%)</span>
                    </label>
                  </div>

                  <button 
                    type="button"
                    className="btn-primary"
                    onClick={addItem}
                    style={{ marginTop: '12px' }}
                  >
                    ➕ Agregar Ítem
                  </button>
                </div>

                {/* Totales del contrato */}
                {contractItems.length > 0 && (
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '12px', 
                    backgroundColor: '#e3f2fd', 
                    borderRadius: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Subtotal:</span>
                      <strong>${calculateContractTotals().subtotal.toLocaleString('es-CL')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>IVA (19%):</span>
                      <strong>${calculateContractTotals().iva.toLocaleString('es-CL')}</strong>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '16px',
                      paddingTop: '8px',
                      borderTop: '1px solid #bbdefb'
                    }}>
                      <span>Total Contrato:</span>
                      <strong style={{ color: '#0d47a1' }}>${calculateContractTotals().total.toLocaleString('es-CL')}</strong>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea value={formData.observations} onChange={e => setFormData({...formData, observations: e.target.value})} rows={3} />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancelar</button>
                <button type="submit" className="btn-primary">{editingContract ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
