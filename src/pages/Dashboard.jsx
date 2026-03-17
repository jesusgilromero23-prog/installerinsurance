import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, Shield, AlertTriangle, CheckCircle, 
  Plus, ArrowRight, Clock, FileText 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { differenceInDays, isPast, format } from 'date-fns';
import { es } from 'date-fns/locale';
import ContractorCard from '@/components/contractors/ContractorCard';

export default function Dashboard() {
  const { data: contractors = [], isLoading: loadingContractors } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => base44.entities.Contractor.list('-created_date'),
  });
  
  const { data: insurances = [], isLoading: loadingInsurances } = useQuery({
    queryKey: ['insurances'],
    queryFn: () => base44.entities.Insurance.list(),
  });
  
  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list(),
  });
  
  const getInsuranceStatus = (contractorId) => {
    const contractorInsurances = insurances.filter(i => i.contractor_id === contractorId);
    if (contractorInsurances.length === 0) return null;
    
    const hasExpired = contractorInsurances.some(i => isPast(new Date(i.expiration_date)));
    const expiringSoon = contractorInsurances.filter(i => {
      const days = differenceInDays(new Date(i.expiration_date), new Date());
      return days <= 30 && days >= 0;
    });
    
    return {
      hasExpired,
      expiringSoon: expiringSoon.length > 0,
      daysUntilExpiry: expiringSoon.length > 0 
        ? Math.min(...expiringSoon.map(i => differenceInDays(new Date(i.expiration_date), new Date())))
        : null
    };
  };
  
  const expiredInsurances = insurances.filter(i => isPast(new Date(i.expiration_date)));
  const expiringInsurances = insurances.filter(i => {
    const days = differenceInDays(new Date(i.expiration_date), new Date());
    return days <= 30 && days >= 0;
  });
  const activeInsurances = insurances.filter(i => {
    const days = differenceInDays(new Date(i.expiration_date), new Date());
    return days > 30;
  });
  
  const recentContractors = contractors.slice(0, 4);
  
  const stats = [
    { 
      label: 'Contratistas', 
      value: contractors.length, 
      icon: Users, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      label: 'Seguros Activos', 
      value: activeInsurances.length, 
      icon: Shield, 
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    { 
      label: 'Por Vencer', 
      value: expiringInsurances.length, 
      icon: Clock, 
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50'
    },
    { 
      label: 'Vencidos', 
      value: expiredInsurances.length, 
      icon: AlertTriangle, 
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50'
    },
  ];
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Bienvenido a tu panel de gestión de contratistas</p>
        </div>
        <Button asChild>
          <Link to="/Contractors/new">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Contratista
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} style={{ color: stat.color.includes('blue') ? '#3b82f6' : stat.color.includes('emerald') ? '#10b981' : stat.color.includes('amber') ? '#f59e0b' : '#ef4444' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {(expiredInsurances.length > 0 || expiringInsurances.length > 0) && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
              Alertas de Seguros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiredInsurances.slice(0, 3).map(ins => {
                const contractor = contractors.find(c => c.id === ins.contractor_id);
                return (
                  <div key={ins.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100">
                    <div>
                      <p className="font-medium text-red-700">{contractor?.company_name || 'Contratista'}</p>
                      <p className="text-sm text-red-600">Seguro vencido - {ins.insurance_type?.replace(/_/g, ' ')}</p>
                    </div>
                    <Link to={`/Contractor/${ins.contractor_id}`}>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200">
                        Ver <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                );
              })}
              {expiringInsurances.slice(0, 3).map(ins => {
                const contractor = contractors.find(c => c.id === ins.contractor_id);
                const days = differenceInDays(new Date(ins.expiration_date), new Date());
                return (
                  <div key={ins.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100">
                    <div>
                      <p className="font-medium text-amber-700">{contractor?.company_name || 'Contratista'}</p>
                      <p className="text-sm text-amber-600">Vence en {days} días - {ins.insurance_type?.replace(/_/g, ' ')}</p>
                    </div>
                    <Link to={`/Contractor/${ins.contractor_id}`}>
                      <Button variant="outline" size="sm" className="text-amber-600 border-amber-200">
                        Ver <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Contratistas Recientes</h2>
          <Link to="/Contractors" className="text-primary hover:underline text-sm flex items-center gap-1">
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {loadingContractors ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <Card key={i} className="h-48 animate-pulse bg-muted" />
            ))}
          </div>
        ) : recentContractors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentContractors.map(contractor => (
              <ContractorCard 
                key={contractor.id} 
                contractor={contractor}
                insuranceStatus={getInsuranceStatus(contractor.id)}
              />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg mb-2">Sin contratistas</h3>
            <p className="text-muted-foreground mb-4">Comienza agregando tu primer contratista</p>
            <Button asChild>
              <Link to="/Contractors/new">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Contratista
              </Link>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}