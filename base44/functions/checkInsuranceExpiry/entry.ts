import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Verificar que sea un admin (solo admins pueden ejecutar esta función)
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    // Configurar Twilio (validar que existan las credenciales)
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');
    
    const twilioAuth = accountSid && authToken ? btoa(`${accountSid}:${authToken}`) : null;
    
    // Obtener configuración de la aplicación
    const appConfigs = await base44.asServiceRole.entities.AppConfig.list();
    const appConfig = appConfigs.length > 0 ? appConfigs[0].data : null;
    const companyEmail = appConfig?.notification_email;
    const notificationDays = appConfig?.notification_days_before || 3;
    
    // Obtener todos los seguros y contratistas (usando límite para optimizar)
    const insurances = await base44.asServiceRole.entities.Insurance.list('-created_date', 1000);
    const contractors = await base44.asServiceRole.entities.Contractor.list('-created_date', 1000);
    
    const now = new Date();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const notificationDate = new Date(now.getTime() + notificationDays * MS_PER_DAY);
    
    let emailsSent = 0;
    let smsSent = 0;
    const alerts = [];
    let companyAlerts = [];
    
    for (const insurance of insurances) {
      const expirationDate = new Date(insurance.data.expiration_date);
      const contractor = contractors.find(c => c.id === insurance.data.contractor_id);
      
      if (!contractor) continue;
      
      const daysUntilExpiry = Math.floor((expirationDate - now) / MS_PER_DAY);
      
      // Seguro vencido
      if (expirationDate < now && !insurance.data.reminder_sent) {
        const emailBody = `Hola ${contractor.data.contact_name || contractor.data.company_name},

      Le escribimos de FF Construction and Remodeling, para notificarle que su aseguranza HA VENCIDO.

      LE AGRADECEMOS que envíe su aseguranza actualizada a nuestro correo: jesus@fantasticfloorskc.com

      Para seguir llevando su proceso de pago normalmente se les agradece.

      Detalle:
      • Tipo: ${insurance.data.insurance_type.replace(/_/g, ' ')}
      • Compañía: ${insurance.data.insurance_company || 'N/A'}
      • Póliza: ${insurance.data.policy_number || 'N/A'}
      • Vencimiento: ${expirationDate.toLocaleDateString('es-ES')}

      Saludos,
      FF Construction and Remodeling
        `;
        
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: contractor.data.email,
          subject: `⚠️ URGENTE: Seguro Vencido - ${contractor.data.company_name}`,
          body: emailBody,
          from_name: 'FF Construction Aseguranzas'
        });
        
        // Enviar SMS si está configurado Twilio
        if (twilioAuth && twilioPhone && contractor.data.phone) {
          const smsMessage = `⚠️ URGENTE: El seguro de ${contractor.data.company_name} ha VENCIDO. Tipo: ${insurance.data.insurance_type.replace(/_/g, ' ')}. Por favor, renuévalo lo antes posible.`;

          const formData = new URLSearchParams();
          formData.append('From', twilioPhone);
          formData.append('To', contractor.data.phone);
          formData.append('Body', smsMessage);

          try {
            await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${twilioAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: formData.toString()
            });
            smsSent++;
          } catch (smsError) {
            console.error('Error enviando SMS:', smsError.message);
          }
        }
        
        // Actualizar estado
        await base44.asServiceRole.entities.Insurance.update(insurance.id, {
          ...insurance.data,
          status: 'expired',
          reminder_sent: true
        });
        
        emailsSent++;
        alerts.push({
          type: 'expired',
          contractor: contractor.data.company_name,
          insuranceType: insurance.data.insurance_type
        });
      }
      
      // Seguro próximo a vencer (1-30 días)
       else if (daysUntilExpiry > 0 && daysUntilExpiry <= 30 && !insurance.data.reminder_sent) {
         const emailBody = `Hola ${contractor.data.contact_name || contractor.data.company_name},

      Le escribimos de FF Construction and Remodeling, para recordarle que su aseguranza está a punto de vencer.

      LE AGRADECEMOS que envíe su aseguranza actualizada a nuestro correo: jesus@fantasticfloorskc.com

      Para seguir llevando su proceso de pago normalmente se les agradece.

      Detalle:
      • Tipo: ${insurance.data.insurance_type.replace(/_/g, ' ')}
      • Compañía: ${insurance.data.insurance_company || 'N/A'}
      • Póliza: ${insurance.data.policy_number || 'N/A'}
      • Vence: ${expirationDate.toLocaleDateString('es-ES')}
      • Días restantes: ${daysUntilExpiry}

      Saludos,
      FF Construction and Remodeling
         `;
        
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: contractor.data.email,
          subject: `📅 Recordatorio: Seguro por Vencer en ${daysUntilExpiry} días - ${contractor.data.company_name}`,
          body: emailBody,
          from_name: 'FF Construction Aseguranzas'
        });
        
        // Enviar SMS si está configurado Twilio
        if (twilioAuth && twilioPhone && contractor.data.phone) {
          const smsMessage = `📅 Recordatorio: El seguro de ${contractor.data.company_name} vence en ${daysUntilExpiry} días. Tipo: ${insurance.data.insurance_type.replace(/_/g, ' ')}. Renuévalo con anticipación.`;

          const formData = new URLSearchParams();
          formData.append('From', twilioPhone);
          formData.append('To', contractor.data.phone);
          formData.append('Body', smsMessage);

          try {
            await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${twilioAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: formData.toString()
            });
            smsSent++;
          } catch (smsError) {
            console.error('Error enviando SMS:', smsError.message);
          }
        }
        
        // Actualizar estado
        await base44.asServiceRole.entities.Insurance.update(insurance.id, {
          ...insurance.data,
          status: 'expiring_soon',
          reminder_sent: true
        });
        
        emailsSent++;
        alerts.push({
          type: 'expiring_soon',
          contractor: contractor.data.company_name,
          insuranceType: insurance.data.insurance_type,
          daysUntilExpiry
        });
        
        // Agregar a alertas de la empresa
        companyAlerts.push({
          type: 'insurance',
          contractor: contractor.data.company_name,
          item: `Seguro: ${insurance.data.insurance_type.replace(/_/g, ' ')}`,
          expirationDate: insurance.data.expiration_date,
          daysUntilExpiry
        });
      }
    }
    
    // Enviar notificación a la empresa si hay alertas
    if (companyAlerts.length > 0 && companyEmail) {
      const companyEmailBody = `Resumen de Alertas de Vencimiento en ${notificationDays} días:\n\n${
        companyAlerts.map(alert => 
          `• ${alert.contractor}\n  ${alert.item}\n  Vence: ${alert.expirationDate} (en ${alert.daysUntilExpiry} días)\n`
        ).join('\n')
      }\n\nPor favor, verifica el sistema para más detalles.`;
      
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: companyEmail,
          subject: `⚠️ Resumen de Vencimientos Próximos - ${new Date().toLocaleDateString('es-MX')}`,
          body: companyEmailBody,
          from_name: 'FF Construction Aseguranzas'
        });
      } catch (emailError) {
        console.error('Error enviando email a empresa:', emailError.message);
      }
    }
    
    return Response.json({
      success: true,
      message: `Se procesaron ${insurances.length} seguros. ${emailsSent} correos y ${smsSent} SMS enviados. Alerta a empresa: ${companyAlerts.length > 0 ? 'Sí' : 'No'}.`,
      alerts,
      companyAlerts,
      emailsSent,
      smsSent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});