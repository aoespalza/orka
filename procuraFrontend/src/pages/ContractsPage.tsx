import { useState, useEffect } from 'react';
import api from '../api';
import type { Contract, CreateContractDTO, Supplier, ContractStatus } from '../types';
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
  { value: 'SI', label: 'Sí' },
  { value: 'FIRMA', label: 'Firma' }
];

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [companyInfo, setCompanyInfo] = useState<any>({});

  useEffect(() => {
    loadContracts(); loadSuppliers(); loadCompanySettings();
  }, [statusFilter]);

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
    docRequierePoliza: 'N/A'
  });

  useEffect(() => {
    loadContracts();
    loadSuppliers();
  }, [statusFilter]);

  const loadContracts = async () => {
    try {
      setIsLoading(true);
      const filters = statusFilter ? { status: statusFilter } : undefined;
      const data = await api.getContracts(filters);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingContract) {
        await api.updateContract(editingContract.id, formData);
      } else
        await api.createContract(formData);
      setShowModal(false);
      loadContracts();
      resetForm();
    } catch (error) {
      console.error('Failed to save contract:', error);
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      workOrderId: contract.workOrderId || '',
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
      docRequierePoliza: contract.docRequierePoliza || 'N/A'
    });
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
      docRequierePoliza: 'N/A'
    });
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
      </div>

      {isLoading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
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
            {contracts.map(contract => (
              <tr key={contract.id}>
                <td><strong>{contract.code}</strong></td>
                <td>{contract.supplier?.name || contract.supplierId}</td>
                <td>{contract.docContratoFirmado === 'SI' ? '✅' : '❌'} / {contract.docRequierePoliza === 'SI' ? '✅' : contract.docRequierePoliza === 'N/A' ? 'N/A' : '❌'}</td>
                <td>{contract.startDate ? new Date(contract.startDate).toLocaleDateString('es-CL') : '-'}</td>
                <td>{contract.endDate ? new Date(contract.endDate).toLocaleDateString('es-CL') : '-'}</td>
                <td>{formatCurrency(contract.value)}</td>
                <td>{formatCurrency(contract.finalValue)}</td>
                <td>{contract.advancePayment > 0 ? `${contract.advancePayment}%` : '-'}</td>
                <td>{contract.fic}</td>
                <td><span className={`badge ${getStatusBadgeClass(contract.status)}`}>{getStatusLabel(contract.status)}</span></td>
                <td>
                  <button className="btn-icon" onClick={() => handleExportPDF(contract)} title="Exportar PDF">📄</button>
                  <button className="btn-icon" onClick={() => handleEdit(contract)} title="Editar">✏️</button>
                  <button className="btn-icon" onClick={() => handleDelete(contract.id)} title="Eliminar">🗑️</button>
                </td>
              </tr>
            ))}
            {contracts.length === 0 && (
              <tr>
                <td colSpan={11} className="empty">No hay contratos</td>
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
              </div>

              <div className="form-group">
                <label>Documentos</label>
                <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
                  <div>
                    <label style={{ fontWeight: 'normal', fontSize: '13px' }}>Contrato Firmado</label>
                    <select 
                      value={formData.docContratoFirmado} 
                      onChange={e => setFormData({...formData, docContratoFirmado: e.target.value as any})}
                      style={{ marginLeft: '8px' }}
                    >
                      <option value="NO">No</option>
                      <option value="SI">Sí</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'normal', fontSize: '13px' }}>Requiere Póliza</label>
                    <select 
                      value={formData.docRequierePoliza} 
                      onChange={e => setFormData({...formData, docRequierePoliza: e.target.value as any})}
                      style={{ marginLeft: '8px' }}
                    >
                      <option value="N/A">No aplica</option>
                      <option value="SI">Sí</option>
                      <option value="NO">No</option>
                    </select>
                  </div>
                </div>
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
