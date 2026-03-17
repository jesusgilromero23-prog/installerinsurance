import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Clock, CheckCircle, XCircle, FileText, Image as ImageIcon, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';

const documentTypes = {
  w9: 'W-9',
  contract: 'Contrato',
  license: 'Licencia',
  certificate: 'Certificado',
  insurance: 'Seguro',
  id: 'Identificación',
  other: 'Otro'
};

export default function DocumentReview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reviewDialog, setReviewDialog] = useState(null);
  const [comments, setComments] = useState('');
  const [action, setAction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents-review'],
    queryFn: () => base44.asServiceRole.entities.Document.list('-created_date'),
  });
  
  const { data: contractors = [] } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => base44.entities.Contractor.list(),
  });
  
  const getContractor = (id) => contractors.find(c => c.id === id);
  
  const pendingDocuments = documents.filter(d => d.data.status === 'pending_review');
  const approvedDocuments = documents.filter(d => d.data.status === 'approved');
  const rejectedDocuments = documents.filter(d => d.data.status === 'rejected');
  
  const handleReview = (document, reviewAction) => {
    setReviewDialog(document);
    setAction(reviewAction);
    setComments('');
  };
  
  const submitReview = async () => {
    if (!comments.trim()) {
      toast.error('Agrega comentarios para completar la revisión');
      return;
    }
    
    setIsSubmitting(true);
    
    await base44.asServiceRole.entities.Document.update(reviewDialog.id, {
      ...reviewDialog.data,
      status: action === 'approve' ? 'approved' : 'rejected',
      approval_comments: comments,
      reviewed_by: user?.email,
      reviewed_date: new Date().toISOString()
    });
    
    // Enviar notificación al contratista
    const contractor = getContractor(reviewDialog.data.contractor_id);
    if (contractor) {
      const emailSubject = action === 'approve' 
        ? `✅ Documento Aprobado: ${reviewDialog.data.document_name}`
        : `❌ Documento Rechazado: ${reviewDialog.data.document_name}`;
      
      const emailBody = action === 'approve'
        ? `Hola ${contractor.data.contact_name || contractor.data.company_name},\n\nTu documento "${reviewDialog.data.document_name}" ha sido APROBADO.\n\nComentarios: ${comments}\n\nSaludos,\nSistema de Gestión de Contratistas`
        : `Hola ${contractor.data.contact_name || contractor.data.company_name},\n\nTu documento "${reviewDialog.data.document_name}" ha sido RECHAZADO.\n\nRazón: ${comments}\n\nPor favor, sube una nueva versión correcta.\n\nSaludos,\nSistema de Gestión de Contratistas`;
      
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: contractor.data.email,
        subject: emailSubject,
        body: emailBody,
        from_name: 'ContractorHub'
      });
    }
    
    toast.success(action === 'approve' ? 'Documento aprobado' : 'Documento rechazado');
    queryClient.invalidateQueries({ queryKey: ['documents-review'] });
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    
    setIsSubmitting(false);
    setReviewDialog(null);
    setComments('');
  };
  
  const DocumentPreview = ({ doc }) => {
    const isImage = doc.data.file_type?.startsWith('image') || 
      ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => doc.data.file_url?.toLowerCase().includes(ext));
    
    return (
      <div className="space-y-4">
        <div className="border rounded-lg overflow-hidden bg-muted">
          {isImage ? (
            <img src={doc.data.file_url} alt="" className="max-h-96 w-full object-contain" />
          ) : (
            <div className="h-48 flex items-center justify-center">
              <FileText className="w-16 h-16 text-muted-foreground/50" />
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" asChild className="w-full">
          <a href={doc.data.file_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir en nueva pestaña
          </a>
        </Button>
      </div>
    );
  };
  
  const TabSection = ({ title, documents, icon, bgColor }) => (
    <div>
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        {icon && React.createElement(icon, { className: 'w-5 h-5' })}
        {title} ({documents.length})
      </h3>
      
      {documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => {
            const contractor = getContractor(doc.data.contractor_id);
            
            return (
              <Card key={doc.id} className={bgColor}>
                <CardContent className="p-4">
                  <div className="mb-3">
                    <h4 className="font-medium line-clamp-1">{doc.data.document_name}</h4>
                    <p className="text-sm text-muted-foreground">{contractor?.data.company_name}</p>
                    <Badge variant="outline" className="mt-2">
                      {documentTypes[doc.data.document_type]}
                    </Badge>
                  </div>
                  
                  <div className="mb-4 p-3 border rounded bg-background/50 min-h-24 max-h-32 overflow-auto">
                    {doc.data.file_url ? (
                      doc.data.file_type?.startsWith('image') || 
                      ['jpg', 'jpeg', 'png', 'gif'].some(ext => doc.data.file_url?.toLowerCase().includes(ext))
                        ? <img src={doc.data.file_url} alt="" className="max-h-24 w-full object-contain" />
                        : <div className="h-24 flex items-center justify-center"><FileText className="w-8 h-8 text-muted-foreground" /></div>
                    ) : null}
                  </div>
                  
                  {doc.data.approval_comments && (
                    <div className="text-xs bg-muted p-2 rounded mb-4 max-h-20 overflow-auto">
                      <p className="font-medium mb-1">Comentarios:</p>
                      <p>{doc.data.approval_comments}</p>
                    </div>
                  )}
                  
                  {doc.data.status === 'pending_review' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleReview(doc, 'approve')}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aprobar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleReview(doc, 'reject')}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rechazar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center text-muted-foreground">
          <p>No hay documentos en esta sección</p>
        </Card>
      )}
    </div>
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Revisión de Documentos</h1>
        <p className="text-muted-foreground mt-1">Revisa y aprueba documentos de contratistas</p>
      </div>
      
      <TabSection 
        title="Pendiente de Revisión" 
        documents={pendingDocuments}
        icon={Clock}
        bgColor="border-amber-200 bg-amber-50/50"
      />
      
      <TabSection 
        title="Aprobados" 
        documents={approvedDocuments}
        icon={CheckCircle}
        bgColor="border-emerald-200 bg-emerald-50/50"
      />
      
      <TabSection 
        title="Rechazados" 
        documents={rejectedDocuments}
        icon={XCircle}
        bgColor="border-red-200 bg-red-50/50"
      />
      
      <Dialog open={!!reviewDialog} onOpenChange={() => setReviewDialog(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? '✅ Aprobar Documento' : '❌ Rechazar Documento'}
            </DialogTitle>
          </DialogHeader>
          
          {reviewDialog && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Documento</p>
                <p className="font-medium">{reviewDialog.data.document_name}</p>
                <p className="text-sm text-muted-foreground">
                  {getContractor(reviewDialog.data.contractor_id)?.data.company_name}
                </p>
              </div>
              
              <DocumentPreview doc={reviewDialog} />
              
              <div>
                <label className="text-sm font-medium">Comentarios</label>
                <Textarea 
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={action === 'approve' 
                    ? 'Ej: Documento verificado correctamente' 
                    : 'Ej: Calidad insuficiente, por favor sube una imagen más clara'}
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(null)}>Cancelar</Button>
            <Button 
              onClick={submitReview}
              disabled={isSubmitting}
              className={action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {action === 'approve' ? 'Aprobar' : 'Rechazar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}