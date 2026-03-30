import { useState, useEffect } from 'react';
import api from '../api';
import type { DashboardStats, WorkOrder, Contract } from '../types';
import './DashboardPage.css';

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expiringWorkOrders, setExpiringWorkOrders] = useState<WorkOrder[]>([]);
  const [expiringContracts, setExpiringContracts] = useState<Contract[]>([]);

  useEffect(() => {
    loadStats();
    loadExpiringWorkOrders();
    loadExpiringContracts();
  }, []);

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
      title: 'Materiales',
      value: stats?.totalMaterials || 0,
      icon: '📦',
      color: 'blue',
      page: 'materials'
    },
    {
      title: 'Proveedores Activos',
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
        <div className="dashboard-section">
          <h2>Acciones Rápidas</h2>
          <div className="quick-actions">
            <button className="quick-action-btn" onClick={() => onNavigate?.('materials')}>
              ➕ Nuevo Material
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate?.('suppliers')}>
              ➕ Nuevo Proveedor
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate?.('projects')}>
              ➕ Nuevo Proyecto
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate?.('work-orders')}>
              ➕ Nueva Orden de Trabajo
            </button>
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
