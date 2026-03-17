import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Calendar, DollarSign, FileText, Trash2, ExternalLink } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { es } from 'date-fns/locale';

const insuranceTypes = {
  general_liability: { label: 'Responsabilidad General', icon: '🛡️' },
  workers_comp: { label: 'Compensación Laboral', icon: '👷' },
  auto: { label: 'Automóvil', icon: '🚗' },
  professional: { label: 'Responsabilidad Profesional', icon: '💼' },
  umbrella: { label: 'Umbrella', icon: '☂️' },
  other: { label: 'Otro', icon: '📋' }
};

export default function InsuranceCard({ insurance, onDelete }) {
  const expirationDate = new Date(insurance.expiration_date);
  const daysUntilExpiry = differenceInDays(expirationDate, new Date());
  const isExpired = isPast(expirationDate);
  const isExpiringSoon = daysUntilExpiry <= 30 && !isExpired;
  
  const typeInfo = insuranceTypes[insurance.insurance_type] || insuranceTypes.other;
  
  const getStatusBadge = () => {
    if (isExpired) {
      return <Badge className="bg-red-100 text-red-700 border-red-200">Vencido</Badge>;
    }
    if (isExpiringSoon) {
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Vence pronto</Badge>;
    }
    return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Vigente</Badge>;
  };
  
  return (
    <Card className={`overflow-hidden ${isExpired ? 'border-red-200 bg-red-50/30' : isExpiringSoon ? 'border-amber-200 bg-amber-50/30' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{typeInfo.icon}</div>
            <div>
              <h4 className="font-medium text-foreground">{typeInfo.label}</h4>
              <p className="text-sm text-muted-foreground">{insurance.insurance_company}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>Póliza: {insurance.policy_number || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            <span>${insurance.coverage_amount?.toLocaleString() || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground col-span-2">
            <Calendar className="w-4 h-4" />
            <span>
              Vence: {format(expirationDate, "d 'de' MMMM, yyyy", { locale: es })}
              {!isExpired && (
                <span className={`ml-1 ${isExpiringSoon ? 'text-amber-600 font-medium' : ''}`}>
                  ({daysUntilExpiry} días)
                </span>
              )}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pt-3 border-t">
          {insurance.document_url && (
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <a href={insurance.document_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver documento
              </a>
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(insurance)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}