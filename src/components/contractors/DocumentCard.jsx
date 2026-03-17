import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Image, Download, Trash2, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const documentTypes = {
  w9: { label: 'W-9', color: 'bg-blue-100 text-blue-700' },
  contract: { label: 'Contrato', color: 'bg-purple-100 text-purple-700' },
  license: { label: 'Licencia', color: 'bg-green-100 text-green-700' },
  certificate: { label: 'Certificado', color: 'bg-amber-100 text-amber-700' },
  insurance: { label: 'Seguro', color: 'bg-teal-100 text-teal-700' },
  id: { label: 'Identificación', color: 'bg-pink-100 text-pink-700' },
  other: { label: 'Otro', color: 'bg-gray-100 text-gray-700' }
};

const statusConfig = {
  pending_review: { 
    label: 'Pendiente de Revisión', 
    icon: Clock, 
    color: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-700'
  },
  approved: { 
    label: 'Aprobado', 
    icon: CheckCircle, 
    color: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700'
  },
  rejected: { 
    label: 'Rechazado', 
    icon: XCircle, 
    color: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-700'
  }
};

export default function DocumentCard({ document, onDelete, showStatus = true }) {
  const typeInfo = documentTypes[document.document_type] || documentTypes.other;
  const status = statusConfig[document.status] || statusConfig.pending_review;
  const StatusIcon = status.icon;
  
  const isImage = document.file_type?.startsWith('image') || 
    ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => document.file_url?.toLowerCase().includes(ext));
  
  return (
    <Card className={`overflow-hidden group hover:shadow-md transition-shadow border ${status.color}`}>
      <CardContent className="p-0">
        {isImage ? (
          <div className="h-32 bg-muted overflow-hidden relative">
            <img 
              src={document.file_url} 
              alt={document.document_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {showStatus && (
              <div className="absolute top-2 right-2">
                <Badge className={status.badge}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
            )}
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative">
            <FileText className="w-12 h-12 text-muted-foreground/50" />
            {showStatus && (
              <div className="absolute top-2 right-2">
                <Badge className={status.badge}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
            )}
          </div>
        )}
        
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-medium text-foreground line-clamp-1">{document.document_name}</h4>
            <Badge variant="secondary" className={typeInfo.color}>
              {typeInfo.label}
            </Badge>
          </div>
          
          {document.expiration_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Calendar className="w-4 h-4" />
              <span>Vence: {format(new Date(document.expiration_date), "d MMM yyyy", { locale: es })}</span>
            </div>
          )}
          
          {document.notes && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{document.notes}</p>
          )}
          
          {document.approval_comments && (
            <div className={`text-sm p-2 rounded mb-3 ${
              document.status === 'rejected' 
                ? 'bg-red-50 text-red-700 border border-red-100' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}>
              <p className="font-medium mb-1">
                {document.status === 'rejected' ? '❌ Razón del rechazo:' : '✅ Comentarios:'}
              </p>
              <p>{document.approval_comments}</p>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <a href={document.file_url} target="_blank" rel="noopener noreferrer" download>
                <Download className="w-4 h-4 mr-2" />
                Descargar
              </a>
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(document)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}