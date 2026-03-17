import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { Upload, Loader2 } from 'lucide-react';

const insuranceTypes = [
  { value: 'general_liability', label: 'Responsabilidad General' },
  { value: 'workers_comp', label: 'Compensación Laboral' },
  { value: 'auto', label: 'Automóvil' },
  { value: 'professional', label: 'Responsabilidad Profesional' },
  { value: 'umbrella', label: 'Umbrella' },
  { value: 'other', label: 'Otro' }
];

export default function AddInsuranceModal({ open, onClose, contractorId, onSuccess }) {
  const [formData, setFormData] = useState({
    insurance_type: '',
    insurance_company: '',
    policy_number: '',
    coverage_amount: '',
    start_date: '',
    expiration_date: ''
  });
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    let documentUrl = '';
    if (file) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      documentUrl = file_url;
    }
    
    await base44.entities.Insurance.create({
      ...formData,
      contractor_id: contractorId,
      coverage_amount: parseFloat(formData.coverage_amount) || 0,
      document_url: documentUrl,
      status: 'active'
    });
    
    setIsLoading(false);
    onSuccess();
    onClose();
    setFormData({
      insurance_type: '',
      insurance_company: '',
      policy_number: '',
      coverage_amount: '',
      start_date: '',
      expiration_date: ''
    });
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar Seguro</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Tipo de Seguro *</Label>
              <Select value={formData.insurance_type} onValueChange={(v) => setFormData({...formData, insurance_type: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {insuranceTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2">
              <Label>Compañía Aseguradora</Label>
              <Input 
                value={formData.insurance_company}
                onChange={(e) => setFormData({...formData, insurance_company: e.target.value})}
                placeholder="Nombre de la aseguradora"
              />
            </div>
            
            <div>
              <Label>Número de Póliza</Label>
              <Input 
                value={formData.policy_number}
                onChange={(e) => setFormData({...formData, policy_number: e.target.value})}
                placeholder="Ej: POL-123456"
              />
            </div>
            
            <div>
              <Label>Monto de Cobertura</Label>
              <Input 
                type="number"
                value={formData.coverage_amount}
                onChange={(e) => setFormData({...formData, coverage_amount: e.target.value})}
                placeholder="$0.00"
              />
            </div>
            
            <div>
              <Label>Fecha de Inicio</Label>
              <Input 
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
            </div>
            
            <div>
              <Label>Fecha de Vencimiento *</Label>
              <Input 
                type="date"
                value={formData.expiration_date}
                onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
                required
              />
            </div>
            
            <div className="col-span-2">
              <Label>Documento del Seguro</Label>
              <div className="mt-1">
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {file ? file.name : 'Subir documento (PDF o imagen)'}
                  </span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,image/*"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || !formData.insurance_type || !formData.expiration_date}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar Seguro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}