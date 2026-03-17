import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Edit, Trash2, Building2, Phone, Mail, MapPin, 
  FileText, Shield, Plus, Loader2, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import InsuranceCard from '@/components/contractors/InsuranceCard';
import DocumentCard from '@/components/contractors/DocumentCard';
import AddInsuranceModal from '@/components/contractors/AddInsuranceModal';
import AddDocumentModal from '@/components/contractors/AddDocumentModal';

const statusConfig = {
  active: { label: 'Activo', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  inactive: { label: 'Inactivo', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-200' }
};

export default function ContractorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteInsurance, setDeleteInsurance] = useState(null);
  const [deleteDocument, setDeleteDocument] = useState(null);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  
  const { data: contractors, isLoading } = useQuery({
    queryKey: ['contractor', id],
    queryFn: () => base44.entities.Contractor.filter({ id }),
    staleTime: 5 * 60 * 1000,
    retry: 2
  });
  
  const { data: insurances = [], refetch: refetchInsurances } = useQuery({
    queryKey: ['insurances', id],
    queryFn: () => base44.entities.Insurance.filter({ contractor_id: id }),
    staleTime: 3 * 60 * 1000,
    retry: 2
  });
  
  const { data: documents = [], refetch: refetchDocuments } = useQuery({
    queryKey: ['documents', id],
    queryFn: () => base44.entities.Document.filter({ contractor_id: id }),
    staleTime: 3 * 60 * 1000,
    retry: 2
  });
  
  const contractor = contractors?.[0];
  
  const handleDeleteContractor = async () => {
    try {
      await base44.entities.Contractor.delete(id);
      toast.success('Contratista eliminado');
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      navigate('/Contractors');
    } catch (error) {
      toast.error('Error al eliminar el contratista');
    }
  };
  
  const handleDeleteInsurance = async () => {
    try {
      await base44.entities.Insurance.delete(deleteInsurance.id);
      toast.success('Seguro eliminado');
      await refetchInsurances();
      setDeleteInsurance(null);
    } catch (error) {
      toast.error('Error al eliminar el seguro');
    }
  };
  
  const handleDeleteDocument = async () => {
    try {
      await base44.entities.Document.delete(deleteDocument.id);
      toast.success('Documento eliminado');
      await refetchDocuments();
      setDeleteDocument(null);
    } catch (error) {
      toast.error('Error al eliminar el documento');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!contractor) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Contratista no encontrado</h2>
        <Button onClick={() => navigate('/Contractors')}>Volver a contratistas</Button>
      </div>
    );
  }
  
  const status = statusConfig[contractor.status] || statusConfig.active;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/Contractors')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              {contractor.profile_image ? (
                <img src={contractor.profile_image} alt="" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Building2 className="w-8 h-8 text-primary" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{contractor.company_name}</h1>
                <Badge variant="outline" className={status.color}>{status.label}</Badge>
              </div>
              <p className="text-muted-foreground">{contractor.profession || 'Sin profesión especificada'}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/Contractors/${id}`}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Link>
          </Button>
          <Button variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => setDeleteDialog(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contractor.contact_name && (
              <div>
                <p className="text-sm text-muted-foreground">Contacto</p>
                <p className="font-medium">{contractor.contact_name}</p>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <a href={`tel:${contractor.phone}`} className="hover:text-primary">{contractor.phone}</a>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <a href={`mailto:${contractor.email}`} className="hover:text-primary">{contractor.email}</a>
            </div>
            {contractor.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p>{contractor.address}</p>
                  <p>{contractor.city}, {contractor.state} {contractor.zip_code}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información Fiscal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Número del IRS</p>
              <p className="font-medium font-mono">{contractor.irs_number}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{contractor.notes || 'Sin notas'}</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="insurances" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insurances" className="gap-2">
            <Shield className="w-4 h-4" />
            Seguros ({insurances.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="w-4 h-4" />
            Documentos ({documents.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="insurances" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowInsuranceModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Seguro
            </Button>
          </div>
          
          {insurances.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insurances.map(insurance => (
                <InsuranceCard 
                  key={insurance.id} 
                  insurance={insurance} 
                  onDelete={setDeleteInsurance}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg mb-2">Sin seguros registrados</h3>
              <p className="text-muted-foreground mb-4">Agrega los seguros de este contratista</p>
              <Button onClick={() => setShowInsuranceModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Seguro
              </Button>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowDocumentModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Documento
            </Button>
          </div>
          
          {documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map(doc => (
                <DocumentCard 
                  key={doc.id} 
                  document={doc} 
                  onDelete={setDeleteDocument}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg mb-2">Sin documentos</h3>
              <p className="text-muted-foreground mb-4">Sube documentos PDF o imágenes</p>
              <Button onClick={() => setShowDocumentModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Documento
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contratista?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los datos, seguros y documentos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContractor} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={!!deleteInsurance} onOpenChange={() => setDeleteInsurance(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInsurance} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={!!deleteDocument} onOpenChange={() => setDeleteDocument(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDocument} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AddInsuranceModal 
        open={showInsuranceModal}
        onClose={() => setShowInsuranceModal(false)}
        contractorId={id}
        onSuccess={refetchInsurances}
      />
      
      <AddDocumentModal 
        open={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        contractorId={id}
        onSuccess={refetchDocuments}
      />
    </div>
  );
}