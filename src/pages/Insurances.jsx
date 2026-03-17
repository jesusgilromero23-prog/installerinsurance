import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Shield, Building2, Calendar, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, differenceInDays, isPast } from 'date-fns';
import { es } from 'date-fns/locale';

const insuranceTypes = {
  general_liability: 'Responsabilidad General',
  workers_comp: 'Compensación Laboral',
  auto: 'Automóvil',
  professional: 'Responsabilidad Profesional',
  umbrella: 'Umbrella',
  other: 'Otro'
};

export default function Insurances() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const { data: insurances = [], isLoading } = useQuery({
    queryKey: ['all-insurances'],
    queryFn: () => base44.entities.Insurance.list('-expiration_date'),
  });
  
  const { data: contractors = [] } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => base44.entities.Contractor.list(),
  });
  
  const getContractor = (id) => contractors.find(c => c.id === id);
  
  const getInsuranceStatus = (insurance) => {
    const expDate = new Date(insurance.expiration_date);
    if (isPast(expDate)) return 'expired';
    if (differenceInDays(expDate, new Date()) <= 30) return 'expiring';
    return 'active';
  };
  
  const filteredInsurances = insurances.filter(ins => {
    const contractor = getContractor(ins.contractor_id);
    const matchesSearch = !search || 
      contractor?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      ins.insurance_company?.toLowerCase().includes(search.toLowerCase()) ||
      ins.policy_number?.toLowerCase().includes(search.toLowerCase());
    
    const status = getInsuranceStatus(ins);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    const matchesType = typeFilter === 'all' || ins.insurance_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });
  
  const statusBadge = (status) => {
    switch (status) {
      case 'expired':
        return <Badge className="bg-red-100 text-red-700">Vencido</Badge>;
      case 'expiring':
        return <Badge className="bg-amber-100 text-amber-700">Por vencer</Badge>;
      default:
        return <Badge className="bg-emerald-100 text-emerald-700">Vigente</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Seguros</h1>
        <p className="text-muted-foreground mt-1">{insurances.length} seguros registrados</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por empresa, aseguradora, póliza..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Vigentes</SelectItem>
            <SelectItem value="expiring">Por vencer</SelectItem>
            <SelectItem value="expired">Vencidos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-52">
            <SelectValue placeholder="Tipo de seguro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(insuranceTypes).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="h-24 animate-pulse bg-muted" />
          ))}
        </div>
      ) : filteredInsurances.length > 0 ? (
        <div className="space-y-3">
          {filteredInsurances.map(insurance => {
            const contractor = getContractor(insurance.contractor_id);
            const status = getInsuranceStatus(insurance);
            const daysUntil = differenceInDays(new Date(insurance.expiration_date), new Date());
            
            return (
              <Card key={insurance.id} className={`transition-colors ${
                status === 'expired' ? 'border-red-200 bg-red-50/30' :
                status === 'expiring' ? 'border-amber-200 bg-amber-50/30' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Link to={`/Contractor/${insurance.contractor_id}`} className="font-medium hover:text-primary">
                            {contractor?.company_name || 'Contratista'}
                          </Link>
                          {statusBadge(status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {insuranceTypes[insurance.insurance_type]} • {insurance.insurance_company || 'Sin aseguradora'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Vencimiento</p>
                        <p className={`font-medium ${status === 'expired' ? 'text-red-600' : status === 'expiring' ? 'text-amber-600' : ''}`}>
                          {format(new Date(insurance.expiration_date), "d MMM yyyy", { locale: es })}
                          {status !== 'expired' && (
                            <span className="text-sm font-normal ml-1">({daysUntil} días)</span>
                          )}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        {insurance.document_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={insurance.document_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/Contractor/${insurance.contractor_id}`}>
                            Ver
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium text-lg mb-2">Sin resultados</h3>
          <p className="text-muted-foreground">No se encontraron seguros con los filtros aplicados</p>
        </Card>
      )}
    </div>
  );
}