import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Grid3X3, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import ContractorCard from '@/components/contractors/ContractorCard';
import { differenceInDays, isPast } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const statusConfig = {
  active: { label: 'Activo', color: 'bg-emerald-100 text-emerald-700' },
  inactive: { label: 'Inactivo', color: 'bg-gray-100 text-gray-600' },
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' }
};

export default function Contractors() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  
  const { data: contractors = [], isLoading } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => base44.entities.Contractor.list('-created_date'),
  });
  
  const { data: insurances = [] } = useQuery({
    queryKey: ['insurances'],
    queryFn: () => base44.entities.Insurance.list(),
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
  
  const filteredContractors = contractors.filter(c => {
    const matchesSearch = !search || 
      c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.profession?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Contratistas</h1>
          <p className="text-muted-foreground mt-1">{contractors.length} contratistas registrados</p>
        </div>
        <Button asChild>
          <Link to="/Contractors/new">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Contratista
          </Link>
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre, empresa, profesión..."
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
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border rounded-lg overflow-hidden">
          <Button 
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <Card key={i} className="h-48 animate-pulse bg-muted" />
          ))}
        </div>
      ) : filteredContractors.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContractors.map(contractor => (
              <ContractorCard 
                key={contractor.id} 
                contractor={contractor}
                insuranceStatus={getInsuranceStatus(contractor.id)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Profesión</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContractors.map(contractor => {
                  const status = statusConfig[contractor.status] || statusConfig.active;
                  return (
                    <TableRow key={contractor.id} className="cursor-pointer hover:bg-muted">
                      <TableCell>
                        <Link to={`/Contractor/${contractor.id}`} className="font-medium hover:text-primary">
                          {contractor.company_name}
                        </Link>
                      </TableCell>
                      <TableCell>{contractor.contact_name || '-'}</TableCell>
                      <TableCell>{contractor.phone}</TableCell>
                      <TableCell>{contractor.profession || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.color}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )
      ) : (
        <Card className="p-8 text-center">
          <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium text-lg mb-2">Sin resultados</h3>
          <p className="text-muted-foreground">No se encontraron contratistas con los filtros aplicados</p>
        </Card>
      )}
    </div>
  );
}