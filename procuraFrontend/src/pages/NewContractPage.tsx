import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import type { CreateContractDTO, CreateContractItemDTO, Supplier, PolicyType, Policy } from '../types';
import './ContractsPage.css';

const POLICY_TYPE_LABELS: Record<PolicyType, string> = {
  CUMPLIMIENTO: 'Cumplimiento',
  CALIDAD_SUMINISTROS: 'Calidad de Suministros',
  ESTABILIDAD_OBRA: 'Estabilidad de Obra/Calidad de Servicio',
  SALARIOS_PRESTACIONES: 'Salarios y Prestaciones',
  RESPONSABILIDAD_CIVIL: 'Responsabilidad Civil',
  BUEN_MANEJO_ANTICIPO: 'Buen Manejo del Anticipo',
};

const PolicyTypes: PolicyType[] = [
  'CUMPLIMIENTO',
  'CALIDAD_SUMINISTROS', 
  'ESTABILIDAD_OBRA',
  'SALARIOS_PRESTACIONES',
  'RESPONSABILIDAD_CIVIL',
  'BUEN_MANEJO_ANTICIPO'
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

export default function NewContractPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get('id');
  const isEditing = !!contractId;
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<any>({});

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
    items: []
  });

  const [contractItems, setContractItems] = useState<CreateContractItemDTO[]>([]);
  const [policies, setPolicies] = useState<any[]>([
    { type: 'CUMPLIMIENTO', startDate: '', endDate: '', insuredValue: 0 },
    { type: 'CALIDAD_SUMINISTROS', startDate: '', endDate: '', insuredValue: 0 },
    { type: 'ESTABILIDAD_OBRA', startDate: '', endDate: '', insuredValue: 0 },
    { type: 'SALARIOS_PRESTACIONES', startDate: '', endDate: '', insuredValue: 0 },
    { type: 'RESPONSABILIDAD_CIVIL', startDate: '', endDate: '', insuredValue: 0 },
    { type: 'BUEN_MANEJO_ANTICIPO', startDate: '', endDate: '', insuredValue: 0 },
  ]);
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

  // Estado para múltiples Otro Sí
  const [otroSis, setOtroSis] = useState<any[]>([]);
  const [newOtroSi, setNewOtroSi] = useState<{ numero: number; endDate: string; value: number }>({
    numero: 1,
    endDate: '',
    value: 0
  });

  useEffect(() => {
    loadSuppliers();
    loadProjects();
    loadCompanySettings();
    if (contractId) {
      loadContract();
    }
  }, []);

  const loadContract = async () => {
    if (!contractId) return;
    try {
      // Usar getContract directamente para obtener el contrato con todos los datos incluyendo otroSis
      const contract = await api.getContract(contractId);
      if (contract) {
        // Cargar items con el total calculado
        const itemsWithTotal = (contract.items || []).map((item: any) => ({
          ...item,
          total: (item.quantity * item.unitPrice) * (1 + ((item.aiuAdministration || 0) + (item.aiuImprevistos || 0) + (item.aiuUtilidad || 0)) / 100)
        }));
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
        });
        setContractItems(itemsWithTotal);
        setPolicies(contract.policies || []);
        setOtroSis(contract.otroSis || []);
      }
    } catch (error) {
      console.error('Failed to load contract:', error);
    }
  };

  const loadCompanySettings = async () => {
    try {
      const settings = await api.getSettingsByCategory('general');
      const settingsMap: Record<string, any> = {};
      (Array.isArray(settings) ? settings : settings.data || []).forEach((s: any) => { settingsMap[s.key] = s.value; });
      setCompanyInfo(settingsMap);
    } catch (error) { console.error('Failed to load company settings:', error); }
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
    // Incluir valor de Otro Sí en el total
    const otroSiTotal = calculateOtroSisTotal();
    return { 
      subtotal, 
      iva, 
      otroSi: otroSiTotal,
      total: subtotal + iva + otroSiTotal 
    };
  };

  const addItem = () => {
    if (!newItem.description || newItem.quantity <= 0 || newItem.unitPrice <= 0) {
      alert('Por favor complete los campos obligatorios del ítem');
      return;
    }
    const itemWithTotal = { ...newItem, total: calculateItemTotal(newItem) };
    setContractItems([...contractItems, itemWithTotal]);
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

  // Funciones para Otro Sí
  const addOtroSi = () => {
    if (!newOtroSi.numero || newOtroSi.numero <= 0) {
      alert('Por favor ingrese el número del Otro Sí');
      return;
    }
    // Verificar que no exista otro con el mismo número
    if (otroSis.some(os => os.numero === newOtroSi.numero)) {
      alert(`Ya existe Otro Sí #${newOtroSi.numero}`);
      return;
    }
    setOtroSis([...otroSis, { ...newOtroSi }]);
    setNewOtroSi({
      numero: (newOtroSi.numero || 0) + 1,
      endDate: '',
      value: 0
    });
  };

  const removeOtroSi = (index: number) => {
    setOtroSis(otroSis.filter((_, i) => i !== index));
  };

  const calculateFinalValue = () => {
    const otroSisTotal = otroSis.reduce((sum, os) => sum + (os.value || 0), 0);
    return (formData.value || 0) + otroSisTotal;
  };

  const calculateOtroSisTotal = () => {
    return otroSis.reduce((sum, os) => sum + (os.value || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasOtroSi = formData.otroSiNumber || formData.otroSiEndDate;
    const requiresPoliza = formData.docRequierePoliza === 'SI';
    const hasPoliciesWithDates = policies.some(p => p.startDate && p.endDate);
    let shouldNotifyPolicyUpdate = false;
    
    if (hasOtroSi && requiresPoliza) {
      const confirmSubmit = window.confirm(
        '⚠️ El contrato requiere póliza y se está agregando un Otro Sí.\n\n' +
        '¿Desea continuar sin actualizar las fechas de la póliza?\n\n' +
        'Recuerde que debe actualizar la fecha de vencimiento de la póliza para que las notificaciones funcionen correctamente.'
      );
      if (!confirmSubmit) return;
      shouldNotifyPolicyUpdate = true;
    }
    
    try {
      setIsLoading(true);
      const contractData = {
        ...formData,
        items: contractItems,
        otroSis: otroSis
      };
      
      let result;
      if (isEditing && contractId) {
        result = await api.updateContract(contractId, contractData);
      } else {
        result = await api.createContract(contractData);
      }
      
      // Save policies if contract was created and has policy dates
      if (result.id && hasPoliciesWithDates) {
        try {
          for (const policy of policies) {
            if (policy.startDate && policy.endDate) {
              await api.createPolicy({
                contractId: result.id,
                type: policy.type,
                startDate: policy.startDate,
                endDate: policy.endDate,
                insuredValue: policy.insuredValue
              });
            }
          }
        } catch (policyError) {
          console.error('Error al guardar pólizas:', policyError);
        }
      }
      
      if (shouldNotifyPolicyUpdate && result.id) {
        try {
          await api.notifyPolicyUpdate([result.id]);
          alert('✅ Contrato guardado. Se ha enviado un email recordatorio sobre la actualización de la póliza.');
        } catch (notifyError) {
          console.error('Error al enviar notificación de póliza:', notifyError);
          alert('✅ Contrato guardado (sin notificación de póliza)');
        }
      }
      
      localStorage.setItem('PROCURA_PAGE', 'contracts');
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to save contract:', error);
      alert('Error al guardar el contrato');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="contracts-page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1>📜 Nuevo Contrato</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="contract-form">
        {/* Datos Básicos */}
        <div className="form-section">
          <h3>📋 Datos del Contrato</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Contratista *</label>
              <select 
                name="supplierId" 
                required 
                value={formData.supplierId} 
                onChange={e => setFormData({...formData, supplierId: e.target.value})}
              >
                <option value="">Seleccionar...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Proyecto</label>
              <select 
                name="projectId" 
                value={formData.projectId} 
                onChange={e => setFormData({...formData, projectId: e.target.value})}
              >
                <option value="">Sin proyecto</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fecha Inicio</label>
              <input 
                type="date" 
                value={formData.startDate} 
                onChange={e => setFormData({...formData, startDate: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Fecha Fin</label>
              <input 
                type="date" 
                value={formData.endDate} 
                onChange={e => setFormData({...formData, endDate: e.target.value})} 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Valor Contrato</label>
              <input 
                type="number" 
                value={formData.value} 
                onChange={e => setFormData({...formData, value: Number(e.target.value)})} 
              />
            </div>
            <div className="form-group">
              <label>Pago Anticipado (%)</label>
              <input 
                type="number" 
                min="0" 
                max="100" 
                step="0.01"
                value={formData.advancePayment} 
                onChange={e => setFormData({...formData, advancePayment: Number(e.target.value)})} 
              />
              {(formData.advancePayment || 0) > 0 && (
                <span style={{ fontSize: '12px', color: '#666', display: 'block', marginTop: '4px' }}>
                  = ${((formData.value || 0) * (formData.advancePayment || 0) / 100).toLocaleString('es-CL')}
                </span>
              )}
            </div>
            <div className="form-group">
              <label>Estado</label>
              <select 
                value={formData.status} 
                onChange={e => setFormData({...formData, status: e.target.value as any})}
              >
                <option value="DRAFT">Borrador</option>
                <option value="ACTIVE">Activo</option>
                <option value="SUSPENDED">Suspendido</option>
                <option value="COMPLETED">Completado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* FIC y Póliza */}
        <div className="form-section">
          <h3>📄 Documentación</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>FIC</label>
              <select 
                value={formData.fic} 
                onChange={e => setFormData({...formData, fic: e.target.value as any})}
              >
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
              <select 
                value={formData.docRequierePoliza} 
                onChange={e => setFormData({...formData, docRequierePoliza: e.target.value as any})}
              >
                {POLIZA_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {formData.docRequierePoliza === 'SI' && (
            <div className="form-section" style={{background: '#f9fafb', padding: '20px', marginTop: '20px'}}>
              <h3>🛡️ Pólizas del Contrato</h3>
              <p style={{fontSize: '13px', color: '#666'}}>Complete las pólizas requeridas con sus fechas de vigencia y valor asegurado</p>
              
              <div className="policies-grid">
                {PolicyTypes.map(policyType => (
                  <div key={policyType} className="policy-card">
                    <div className="policy-card-header">
                      <span className="policy-type-label">{POLICY_TYPE_LABELS[policyType]}</span>
                    </div>
                    <div className="policy-card-body">
                      <div className="form-group">
                        <label>Fecha Inicio</label>
                        <input
                          type="date"
                          value={policies.find(p => p.type === policyType)?.startDate || ''}
                          onChange={e => setPolicies(policies.map(p => p.type === policyType ? {...p, startDate: e.target.value} : p))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Fecha Fin</label>
                        <input
                          type="date"
                          value={policies.find(p => p.type === policyType)?.endDate || ''}
                          onChange={e => setPolicies(policies.map(p => p.type === policyType ? {...p, endDate: e.target.value} : p))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Valor Asegurado ($)</label>
                        <input
                          type="number"
                          value={policies.find(p => p.type === policyType)?.insuredValue || 0}
                          onChange={e => setPolicies(policies.map(p => p.type === policyType ? {...p, insuredValue: parseFloat(e.target.value) || 0} : p))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Otro Sí - Múltiples */}
        <div className="form-section">
          <h3>📝 Otro Sí</h3>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
            (Agregar prorrogas o adiciones al contrato)
          </p>

          {otroSis.length > 0 && (
            <table className="data-table" style={{ marginBottom: '12px', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nueva Fecha Fin</th>
                  <th>Valor Adicional</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {otroSis.map((os, index) => (
                  <tr key={index}>
                    <td>Otro Sí #{os.numero}</td>
                    <td>{os.endDate ? new Date(os.endDate).toLocaleDateString('es-CL') : '-'}</td>
                    <td>${(os.value || 0).toLocaleString('es-CL')}</td>
                    <td>
                      <button type="button" onClick={() => removeOtroSi(index)} title="Eliminar">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {calculateOtroSisTotal() > 0 && (
            <div style={{ 
              marginTop: '8px', 
              padding: '8px', 
              backgroundColor: '#e8f5e9', 
              borderRadius: '4px',
              fontSize: '13px'
            }}>
              <strong>Valor Otro Sí:</strong> ${calculateOtroSisTotal().toLocaleString('es-CL')}
            </div>
          )}

          {/* Agregar nuevo Otro Sí */}
          <div className="form-row" style={{ marginTop: '12px' }}>
            <div className="form-group">
              <label style={{ fontWeight: 'normal', fontSize: '13px' }}>Número</label>
              <input 
                type="number" 
                placeholder="Ej: 1" 
                value={newOtroSi.numero} 
                onChange={e => setNewOtroSi({...new OtroSi, numero: Number(e.target.value)})} 
              />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 'normal', fontSize: '13px' }}>Nueva Fecha Fin (prórroga)</label>
              <input 
                type="date" 
                value={newOtroSi.endDate} 
                onChange={e => setNewOtroSi({...newOtroSi, endDate: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 'normal', fontSize: '13px' }}>Valor Adicional</label>
              <input 
                type="number" 
                value={newOtroSi.value} 
                onChange={e => setNewOtroSi({...newOtroSi, value: Number(e.target.value)})} 
              />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                type="button" 
                onClick={addOtroSi}
                style={{ backgroundColor: '#22c55e', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                ➕ Agregar
              </button>
            </div>
          </div>

          {(formData.value || 0) > 0 && calculateOtroSisTotal() > 0 && (
            <div style={{ 
              marginTop: '8px', 
              padding: '8px', 
              backgroundColor: '#fef3c7', 
              borderRadius: '4px',
              fontSize: '13px'
            }}>
              <strong>Valor Final del Contrato:</strong> ${(formData.value || 0).toLocaleString('es-CL')} + ${calculateOtroSisTotal().toLocaleString('es-CL')} = <strong>${calculateFinalValue().toLocaleString('es-CL')}</strong>
            </div>
          )}
        </div>

        {/* Items del Contrato */}
        <div className="form-section">
          <h3>📋 Items del Contrato</h3>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
            (Con AIU - Administración, Imprevistos, Utilidad)
          </p>

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
                        <span style={{ color: '#22c55e', fontSize: '11px' }}>✓</span>
                      ) : '-'}
                    </td>
                    <td>{item.iva ? '✓' : '-'}</td>
                    <td>${item.total.toLocaleString('es-CL')}</td>
                    <td>
                      <button type="button" onClick={() => removeItem(index)} title="Eliminar">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Agregar nuevo item */}
        <div className="form-section">
          <h3>➕ Agregar Item</h3>
          <div className="form-row">
            <div className="form-group" style={{ flex: 3 }}>
              <label>Descripción</label>
              <input 
                type="text" 
                value={newItem.description} 
                onChange={e => setNewItem({...newItem, description: e.target.value})}
                placeholder="Descripción del item"
              />
            </div>
            <div className="form-group">
              <label>Cantidad</label>
              <input 
                type="number" 
                min="1"
                value={newItem.quantity} 
                onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})}
              />
            </div>
            <div className="form-group">
              <label>Unidad</label>
              <select 
                value={newItem.unit} 
                onChange={e => setNewItem({...newItem, unit: e.target.value})}
              >
                <option value="UNITS">Unidades</option>
                <option value="METERS">Metros</option>
                <option value="M2">M2</option>
                <option value="M3">M3</option>
                <option value="KG">Kilogramos</option>
                <option value="HOURS">Horas</option>
                <option value="DAYS">Días</option>
                <option value="GLOBAL">Global</option>
              </select>
            </div>
            <div className="form-group">
              <label>Precio Unitario</label>
              <input 
                type="number" 
                value={newItem.unitPrice} 
                onChange={e => setNewItem({...newItem, unitPrice: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newItem.applyAiu}
                  onChange={e => setNewItem({...newItem, applyAiu: e.target.checked})}
                />
                Aplicar AIU
              </label>
            </div>
            {newItem.applyAiu && (
              <>
                <div className="form-group">
                  <label style={{ fontWeight: 'normal', fontSize: '13px' }}>Admin %</label>
                  <input 
                    type="number" 
                    value={newItem.aiuAdministration} 
                    onChange={e => setNewItem({...newItem, aiuAdministration: Number(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'normal', fontSize: '13px' }}>Imprevistos %</label>
                  <input 
                    type="number" 
                    value={newItem.aiuImprevistos} 
                    onChange={e => setNewItem({...newItem, aiuImprevistos: Number(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'normal', fontSize: '13px' }}>Utilidad %</label>
                  <input 
                    type="number" 
                    value={newItem.aiuUtilidad} 
                    onChange={e => setNewItem({...newItem, aiuUtilidad: Number(e.target.value)})}
                  />
                </div>
              </>
            )}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newItem.iva}
                  onChange={e => setNewItem({...newItem, iva: e.target.checked})}
                />
                IVA (19%)
              </label>
            </div>
          </div>

          {newItem.description && newItem.quantity > 0 && newItem.unitPrice > 0 && (
            <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
              <strong>Total Item:</strong> ${calculateItemTotal(newItem).toLocaleString('es-CL')}
              {newItem.iva && <span> + IVA (19%): ${(newItem.quantity * newItem.unitPrice * 0.19).toLocaleString('es-CL')}</span>}
            </div>
          )}

          <button 
            type="button" 
            className="btn-primary"
            onClick={addItem}
            style={{ marginTop: '12px' }}
          >
            ➕ Agregar Item
          </button>
        </div>

        {/* Totales - mostrar cuando hay items O cuando hay otroSis */}
        {(contractItems.length > 0 || calculateOtroSisTotal() > 0) && (
          <div className="form-section">
            <h3>💰 Totales del Contrato</h3>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: '300px' }}>
                {contractItems.length > 0 ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                      <span>Subtotal:</span>
                      <span>${calculateContractTotals().subtotal.toLocaleString('es-CL')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                      <span>IVA (19%):</span>
                      <span>${calculateContractTotals().iva.toLocaleString('es-CL')}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                      <span>Valor Contrato:</span>
                      <span>${(formData.value || 0).toLocaleString('es-CL')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                      <span>IVA (19%):</span>
                      <span>${((formData.value || 0) * 0.19).toLocaleString('es-CL')}</span>
                    </div>
                  </>
                )}
                {calculateContractTotals().otroSi > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb', color: '#1976d2' }}>
                    <span>Otro Sí (Adiciones):</span>
                    <span>+${calculateContractTotals().otroSi.toLocaleString('es-CL')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 'bold', fontSize: '18px' }}>
                  <span>Total:</span>
                  <span style={{ color: '#0d47a1' }}>${calculateContractTotals().total.toLocaleString('es-CL')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Observaciones */}
        <div className="form-section">
          <h3>📝 Observaciones</h3>
          <textarea 
            value={formData.observations} 
            onChange={e => setFormData({...formData, observations: e.target.value})}
            rows={4}
            placeholder="Observaciones adicionales del contrato..."
          />
        </div>

        {/* Acciones */}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Guardando...' : isEditing ? '💾 Actualizar Contrato' : '💾 Guardar Contrato'}
          </button>
        </div>
      </form>
    </div>
  );
}