import { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api';
import type { DashboardStats, WorkOrder, Contract } from '../types';
import './DashboardPage.css';

interface ContractsByProject {
  projectId: string;
  projectName: string;
  contractCount: number;
  totalValue: number;
}

interface WorkOrdersByProject {
  projectId: string;
  projectName: string;
  workOrderCount: number;
  totalValue: number;
}

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expiringWorkOrders, setExpiringWorkOrders] = useState<WorkOrder[]>([]);
  const [expiringContracts, setExpiringContracts] = useState<Contract[]>([]);
  const [contractsByProject, setContractsByProject] = useState<ContractsByProject[]>([]);
  const [workOrdersByProject, setWorkOrdersByProject] = useState<WorkOrdersByProject[]>([]);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartReady, setChartReady] = useState(false);

  // Preparar datos para la gráfica
  const chartData = useMemo(() => {
    const projectMap = new Map();
    
    // Agregar contratos por proyecto
    contractsByProject.forEach(item => {
      if (!projectMap.has(item.projectCode)) {
        projectMap.set(item.projectCode, { name: item.projectCode, contracts: 0, workOrders: 0 });
      }
      projectMap.get(item.projectCode).contracts = item.contractCount;
    });
    
    // Agregar órdenes de trabajo por proyecto
    workOrdersByProject.forEach(item => {
      if (!projectMap.has(item.projectCode)) {
        projectMap.set(item.projectCode, { name: item.projectCode, contracts: 0, workOrders: 0 });
      }
      projectMap.get(item.projectCode).workOrders = item.workOrderCount;
    });
    
    return Array.from(projectMap.values());
  }, [contractsByProject, workOrdersByProject]);

  useEffect(() => {
    loadStats();
    loadExpiringWorkOrders();
    loadExpiringContracts();
    loadContractsByProject();
    loadWorkOrdersByProject();
  }, []);

  // Detect when chart container has dimensions and data is loaded
  useEffect(() => {
    const checkReady = () => {
      if (!chartContainerRef.current) return;
      const hasDimensions = chartContainerRef.current.offsetWidth > 0 && chartContainerRef.current.offsetHeight > 0;
      const hasData = contractsByProject.length > 0 || workOrdersByProject.length > 0;
      
      if (hasDimensions && hasData) {
        setChartReady(true);
      }
    };
    
    // Check immediately and after a delays
    checkReady();
    const timer1 = setTimeout(checkReady, 100);
    const timer2 = setTimeout(checkReady, 500);
    const timer3 = setTimeout(checkReady, 1000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [contractsByProject, workOrdersByProject]);

  const loadStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExpiringWorkOrders = async () => {
    try {
      const response = await api.getWorkOrders();
      const workOrders = Array.isArray(response) ? response : (response as any).data || [];
      const today = new Date();
      const sixtyDaysFromNow = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
      
      // Filtrar órdenes con fecha de vencimiento y dentro de 60 días (incluye vencidas)
      const expiring = workOrders.filter((wo: WorkOrder) => {
        if (!wo.endDate) return false;
        const endDate = new Date(wo.endDate);
        return endDate <= sixtyDaysFromNow;
      });
      
      // Ordenar por fecha de vencimiento (más cercanas primero)
      expiring.sort((a: WorkOrder, b: WorkOrder) => 
        new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime()
      );
      
      setExpiringWorkOrders(expiring);
    } catch (error) {
      console.error('Failed to load work orders:', error);
    }
  };

  const loadExpiringContracts = async () => {
    try {
      const response = await api.getContracts({});
      const contracts = Array.isArray(response) ? response : (response as any).data || [];
      const today = new Date();
      const sixtyDaysFromNow = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
      
      // Filtrar contratos activos con fecha de vencimiento y dentro de 60 días (incluye vencidos)
      const expiring = contracts.filter((c: Contract) => {
        if (!c.endDate || c.status === 'COMPLETED' || c.status === 'CANCELLED') return false;
        const endDate = new Date(c.endDate);
        return endDate <= sixtyDaysFromNow;
      });
      
      // Ordenar por fecha de vencimiento (más cercanos primero)
      expiring.sort((a: Contract, b: Contract) => 
        new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime()
      );
      
      setExpiringContracts(expiring);
    } catch (error) {
      console.error('Failed to load contracts:', error);
    }
  };

  const loadContractsByProject = async () => {
    try {
      const data = await api.getContractsByProject();
      setContractsByProject(data);
    } catch (error) {
      console.error('Failed to load contracts by project:', error);
    }
  };

  const loadWorkOrdersByProject = async () => {
    try {
      const data = await api.getWorkOrdersByProject();
      setWorkOrdersByProject(data);
    } catch (error) {
      console.error('Failed to load work orders by project:', error);
    }
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getTrafficLightColor = (daysLeft: number) => {
    if (daysLeft < 0) return 'red';        // Ya vencido
    if (daysLeft <= 7) return 'red';       // Crítico: <= 7 días
    if (daysLeft <= 15) return 'orange';   // Alerta: 8-15 días
    if (daysLeft <= 30) return 'yellow';   // Precaución: 16-30 días
    return 'green';                        // Normal: > 30 días
  };

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Contratistas Activos',
      value: stats?.activeSuppliers || 0,
      icon: '🏢',
      color: 'green',
      page: 'suppliers'
    },
    {
      title: 'Proyectos',
      value: stats?.totalProjects || 0,
      icon: '🏗️',
      color: 'purple',
      page: 'projects'
    },
    {
      title: 'Órdenes de Trabajo',
      value: stats?.totalWorkOrders || 0,
      icon: '🔧',
      color: 'orange',
      page: 'work-orders'
    },
    {
      title: 'Contratos Activos',
      value: stats?.activeContracts || 0,
      icon: '📜',
      color: 'yellow',
      page: 'contracts'
    }
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Resumen del sistema</p>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div 
            key={index} 
            className={`stat-card stat-card--${stat.color}`}
            onClick={() => onNavigate?.(stat.page)}
          >
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-title">{stat.title}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-sections">
        {/* Gráfico de Barras: Activos por Proyecto */}
        <div className="dashboard-section">
          <h2>Contratos y Órdenes de Trabajo Activas por Proyecto</h2>
          {chartData.length === 0 ? (
            <p className="empty-message">No hay datos para mostrar</p>
          ) : (
            <div ref={chartContainerRef} style={{ width: '100%', height: 320, minHeight: 200 }}>
              {chartReady ? (
                <ResponsiveContainer>
                  <BarChart 
                  data={chartData} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    interval={0}
                    tick={{ fill: '#374151', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: '#374151', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number, name: string) => [
                      value, 
                      name === 'contracts' ? '📜 Contratos' : '🔧 Órdenes de Trabajo'
                    ]}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <Bar 
                    dataKey="contracts" 
                    name="Contratos" 
                    fill="url(#colorContracts)" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                  <Bar 
                    dataKey="workOrders" 
                    name="Órdenes de Trabajo" 
                    fill="url(#colorWorkOrders)" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                  <defs>
                    <linearGradient id="colorContracts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" />
                      <stop offset="95%" stopColor="#d97706" />
                    </linearGradient>
                    <linearGradient id="colorWorkOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" />
                      <stop offset="95%" stopColor="#0891b2" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
                  Cargando gráfico...
                </div>
              )}
            </div>
          )}
        </div>

        <div className="dashboard-grid-2cols">
          {/* Contratos Activos por Proyecto */}
          <div className="dashboard-section">
            <h2>Contratos Activos por Proyecto</h2>
            {contractsByProject.length === 0 ? (
              <p className="empty-message">No hay contratos activos</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Proyecto</th>
                    <th>Contratos</th>
                    <th>Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {contractsByProject.map((item) => (
                    <tr key={item.projectId}>
                      <td>{item.projectName}</td>
                      <td>{item.contractCount}</td>
                      <td>${item.totalValue.toLocaleString('es-CL')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Órdenes de Trabajo Activas por Proyecto */}
          <div className="dashboard-section">
            <h2>Órdenes de Trabajo Activas por Proyecto</h2>
            {workOrdersByProject.length === 0 ? (
              <p className="empty-message">No hay órdenes de trabajo activas</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Proyecto</th>
                    <th>Órdenes</th>
                    <th>Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrdersByProject.map((item) => (
                    <tr key={item.projectId}>
                      <td>{item.projectName}</td>
                      <td>{item.workOrderCount}</td>
                      <td>${item.totalValue.toLocaleString('es-CL')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Órdenes de Trabajo por Vencer */}
        <div className="dashboard-section">
          <h2>Órdenes de Trabajo por Vencer</h2>
          {expiringWorkOrders.length === 0 ? (
            <p className="empty-message">No hay órdenes de trabajo por vencer</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Proveedor</th>
                  <th>Fecha Fin</th>
                  <th>Días Restantes</th>
                </tr>
              </thead>
              <tbody>
                {expiringWorkOrders.slice(0, 5).map((wo) => {
                  const daysLeft = getDaysUntilExpiry(wo.endDate!);
                  return (
                    <tr 
                      key={wo.id} 
                      className="clickable-row"
                      onClick={() => {
                        localStorage.setItem('PROCURA_OPEN_WORKORDER', wo.id);
                        onNavigate?.('work-orders');
                      }}
                    >
                      <td>{wo.code}</td>
                      <td>{wo.supplierName || '-'}</td>
                      <td>{new Date(wo.endDate!).toLocaleDateString('es-CL')}</td>
                      <td>
                        <span className="days-left-cell">
                          <span className="traffic-light" style={{ backgroundColor: getTrafficLightColor(daysLeft) }}></span>
                          <span className="days-text">
                            {daysLeft < 0 ? `Vencido (${Math.abs(daysLeft)} días)` : `${daysLeft} días`}
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Contratos por Vencer */}
        <div className="dashboard-section">
          <h2>Contratos por Vencer</h2>
          {expiringContracts.length === 0 ? (
            <p className="empty-message">No hay contratos por vencer</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Proveedor</th>
                  <th>Fecha Fin</th>
                  <th>Días Restantes</th>
                </tr>
              </thead>
              <tbody>
                {expiringContracts.slice(0, 5).map((contract) => {
                  const daysLeft = getDaysUntilExpiry(contract.endDate!);
                  return (
                    <tr 
                      key={contract.id} 
                      className="clickable-row"
                      onClick={() => {
                        localStorage.setItem('PROCURA_OPEN_CONTRACT', contract.id);
                        onNavigate?.('contracts');
                      }}
                    >
                      <td>{contract.code}</td>
                      <td>{contract.supplier?.name || '-'}</td>
                      <td>{new Date(contract.endDate!).toLocaleDateString('es-CL')}</td>
                      <td>
                        <span className="days-left-cell">
                          <span className="traffic-light" style={{ backgroundColor: getTrafficLightColor(daysLeft) }}></span>
                          <span className="days-text">
                            {daysLeft < 0 ? `Vencido (${Math.abs(daysLeft)} días)` : `${daysLeft} días`}
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        </div>
    </div>
  );
}
