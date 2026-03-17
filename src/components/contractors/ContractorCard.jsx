import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Phone, Mail, MapPin, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const statusConfig = {
  active: { label: 'Activo', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  inactive: { label: 'Inactivo', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-200' }
};

export default function ContractorCard({ contractor, insuranceStatus }) {
  const status = statusConfig[contractor.status] || statusConfig.active;
  
  return (
    <Link to={`/Contractor/${contractor.id}`}>
      <Card className="group hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden">
        <CardContent className="p-0">
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                  {contractor.profile_image ? (
                    <img src={contractor.profile_image} alt="" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Building2 className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {contractor.company_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{contractor.profession || 'Sin especificar'}</p>
                </div>
              </div>
              <Badge variant="outline" className={status.color}>
                {status.label}
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              {contractor.contact_name && (
                <p className="font-medium text-foreground">{contractor.contact_name}</p>
              )}
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{contractor.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="truncate">{contractor.email}</span>
              </div>
              {contractor.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{contractor.city}, {contractor.state}</span>
                </div>
              )}
            </div>
          </div>
          
          {insuranceStatus && (
            <div className={`px-5 py-3 border-t flex items-center gap-2 text-sm ${
              insuranceStatus.hasExpired ? 'bg-red-50 text-red-700 border-red-100' :
              insuranceStatus.expiringSoon ? 'bg-amber-50 text-amber-700 border-amber-100' :
              'bg-emerald-50 text-emerald-700 border-emerald-100'
            }`}>
              {insuranceStatus.hasExpired ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Seguro vencido</span>
                </>
              ) : insuranceStatus.expiringSoon ? (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Vence en {insuranceStatus.daysUntilExpiry} días</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Seguros al día</span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}