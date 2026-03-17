import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle, Bell, ArrowRight, Shield } from 'lucide-react';
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

export default function Alerts() {
  const { data: insurances = [] } = useQuery({
    queryKey: ['all-insurances'],
    queryFn: () => base44.entities.Insurance.list(),
  });
  
  const { data: contractors = [] } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => base44.entities.Contractor.list(),
  });
  
  const getContractor = (id) => contractors.find(c => c.id === id);
  
  const expiredInsurances = insurances
    .filter(i => isPast(new Date(i.expiration_date)))
    .sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));
  
  const expiringInsurances = insurances
    .filter(i => {
      const days = differenceInDays(new Date(i.expiration_date), new Date());
      return days <= 30 && days >= 0;
    })
    .sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));
  
  const totalAlerts = expiredInsurances.length + expiringInsurances.length;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Alertas</h1>
        <p className="text-muted-foreground mt-1">
          {totalAlerts > 0 
            ? `Tienes ${totalAlerts} alerta${totalAlerts !== 1 ? 's' : ''} que requieren atención`
            : 'No tienes alertas pendientes'
          }
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Seguros Vencidos</p>
                <p className="text-3xl font-bold text-red-700">{expiredInsurances.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-200/50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600">Por Vencer (30 días)</p>
                <p className="text-3xl font-bold text-amber-700">{expiringInsurances.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-200/50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600">Seguros al Día</p>
                <p className="text-3xl font-bold text-emerald-700">
                  {insurances.length - expiredInsurances.length - expiringInsurances.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-200/50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {expiredInsurances.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="border-b border-red-100 bg-red-50/50">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Seguros Vencidos ({expiredInsurances.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {expiredInsurances.map(insurance => {
                const contractor = getContractor(insurance.contractor_id);
                const daysExpired = Math.abs(differenceInDays(new Date(insurance.expiration_date), new Date()));
                
                return (
                  <div key={insurance.id} className="p-4 flex items-center justify-between hover:bg-red-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">{contractor?.company_name || 'Contratista'}</p>
                        <p className="text-sm text-muted-foreground">
                          {insuranceTypes[insurance.insurance_type]} • Vencido hace {daysExpired} días
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-red-100 text-red-700">
                        {format(new Date(insurance.expiration_date), "d MMM yyyy", { locale: es })}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/Contractor/${insurance.contractor_id}`}>
                          Ver <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {expiringInsurances.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader className="border-b border-amber-100 bg-amber-50/50">
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <Clock className="w-5 h-5" />
              Próximos a Vencer ({expiringInsurances.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {expiringInsurances.map(insurance => {
                const contractor = getContractor(insurance.contractor_id);
                const daysUntil = differenceInDays(new Date(insurance.expiration_date), new Date());
                
                return (
                  <div key={insurance.id} className="p-4 flex items-center justify-between hover:bg-amber-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">{contractor?.company_name || 'Contratista'}</p>
                        <p className="text-sm text-muted-foreground">
                          {insuranceTypes[insurance.insurance_type]} • Vence en {daysUntil} días
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-amber-100 text-amber-700">
                        {format(new Date(insurance.expiration_date), "d MMM yyyy", { locale: es })}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/Contractor/${insurance.contractor_id}`}>
                          Ver <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {totalAlerts === 0 && (
        <Card className="p-12 text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">¡Todo al día!</h3>
          <p className="text-muted-foreground">No hay seguros vencidos ni próximos a vencer en los próximos 30 días</p>
        </Card>
      )}
    </div>
  );
}