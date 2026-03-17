import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { Upload, Loader2, Camera, FileText, X } from 'lucide-react';

const documentTypes = [
  { value: 'w9', label: 'W-9' },
  { value: 'contract', label: 'Contrato' },
  { value: 'license', label: 'Licencia' },
  { value: 'certificate', label: 'Certificado' },
  { value: 'insurance', label: 'Seguro' },
  { value: 'id', label: 'Identificación' },
  { value: 'other', label: 'Otro' }
];

export default function AddDocumentModal({ open, onClose, contractorId, onSuccess }) {
  const [formData, setFormData] = useState({
    document_name: '',
    document_type: '',
    expiration_date: '',
    notes: ''
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    setIsLoading(true);
    
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    
    await base44.entities.Document.create({
      ...formData,
      contractor_id: contractorId,
      file_url,
      file_type: file.type
    });
    
    setIsLoading(false);
    onSuccess();
    onClose();
    setFormData({
      document_name: '',
      document_type: '',
      expiration_date: '',
      notes: ''
    });
    setFile(null);
    setPreview(null);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar Documento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nombre del Documento *</Label>
            <Input 
              value={formData.document_name}
              onChange={(e) => setFormData({...formData, document_name: e.target.value})}
              placeholder="Ej: W-9 2024"
              required
            />
          </div>
          
          <div>
            <Label>Tipo de Documento</Label>
            <Select value={formData.document_type} onValueChange={(v) => setFormData({...formData, document_type: v})}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Fecha de Vencimiento (opcional)</Label>
            <Input 
              type="date"
              value={formData.expiration_date}
              onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
            />
          </div>
          
          <div>
            <Label>Archivo *</Label>
            {file ? (
              <div className="mt-1 p-4 border rounded-lg bg-muted/30">
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-0 right-0 h-6 w-6"
                      onClick={clearFile}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-8 h-8 text-primary" />
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={clearFile}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-1 grid grid-cols-2 gap-2">
                <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground text-center">Subir archivo</span>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                  />
                </label>
                <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <Camera className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground text-center">Tomar foto</span>
                  <input 
                    ref={cameraInputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            )}
          </div>
          
          <div>
            <Label>Notas (opcional)</Label>
            <Textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Notas adicionales sobre el documento..."
              rows={2}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || !file || !formData.document_name}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar Documento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}