import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings as SettingsIcon, Mail, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [daysNotification, setDaysNotification] = useState(3);
  const [isSaving, setIsSaving] = useState(false);

  const { data: config } = useQuery({
    queryKey: ['app-config'],
    queryFn: async () => {
      const configs = await base44.asServiceRole.entities.AppConfig.list();
      return configs.length > 0 ? configs[0] : null;
    }
  });

  useEffect(() => {
    if (config?.data) {
      setEmail(config.data.notification_email || '');
      setDaysNotification(config.data.notification_days_before || 3);
    }
  }, [config]);

  const handleSave = async () => {
    if (!email.trim()) {
      toast.error('Ingresa un correo válido');
      return;
    }

    setIsSaving(true);

    if (config?.id) {
      await base44.asServiceRole.entities.AppConfig.update(config.id, {
        notification_email: email,
        notification_days_before: daysNotification
      });
    } else {
      await base44.asServiceRole.entities.AppConfig.create({
        notification_email: email,
        notification_days_before: daysNotification
      });
    }

    queryClient.invalidateQueries({ queryKey: ['app-config'] });
    setIsSaving(false);
    toast.success('Configuración guardada correctamente');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <SettingsIcon className="w-8 h-8" />
          Configuración
        </h1>
        <p className="text-muted-foreground mt-1">Gestiona los parámetros de notificación del sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Notificaciones de Vencimiento
          </CardTitle>
          <CardDescription>
            Recibe alertas por correo cuando seguros o documentos estén próximos a vencer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 ml-2">
              Las notificaciones se enviarán automáticamente a este correo cuando haya seguros o documentos próximos a vencer.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-base font-medium">
                Correo de Notificación
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Ingresa el correo de tu empresa donde deseas recibir las alertas
              </p>
            </div>

            <div>
              <Label htmlFor="days" className="text-base font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Días de Anticipación
              </Label>
              <Input
                id="days"
                type="number"
                value={daysNotification}
                onChange={(e) => setDaysNotification(parseInt(e.target.value) || 3)}
                min="1"
                max="30"
                className="mt-2 w-32"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Notificaciones {daysNotification} días antes del vencimiento
              </p>
            </div>
          </div>

          <Button 
            onClick={handleSave}
            disabled={isSaving}
            size="lg"
            className="w-full md:w-auto"
          >
            {isSaving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-emerald-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            ¿Cómo funciona?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-emerald-900 space-y-2">
          <p>✅ Cada día se verifica automáticamente el estado de seguros y documentos</p>
          <p>✅ Si hay vencimientos dentro de {daysNotification} días, recibirás un email detallado</p>
          <p>✅ Incluye información del contratista y tipo de seguro/documento</p>
          <p>✅ Los contratistas también reciben notificaciones directas</p>
        </CardContent>
      </Card>
    </div>
  );
}