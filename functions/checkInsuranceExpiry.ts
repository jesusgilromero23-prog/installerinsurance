import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Configurar Twilio
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');
    
    const twilioAuth = btoa(`${accountSid}:${authToken}`);
    
    // Obtener configuración de la aplicación
    const appConfigs = await base44.asServiceRole.entities.AppConfig.list();
    const appConfig = appConfigs.length > 0 ? appConfigs[0].data : null;
    const companyEmail = appConfig?.notification_email;
    const notificationDays = appConfig?.notification_days_before || 3;
    
    // Obtener todos los seguros y contratistas
    const insurances = await base44.asServiceRole.entities.Insurance.list();
    const contractors = await base44.asServiceRole.entities.Contractor.list();
    const documents = await base44.asServiceRole.entities.Document.list();
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const notificationDate = new Date(now.getTime() + notificationDays * 24 * 60 * 60 * 1000);
    
    let emailsSent = 0;
    let smsSent = 0;
    const alerts = [];
    let companyAlerts = [];
    
    for (const insurance of insurances) {
      const expirationDate = new Date(insurance.data.expiration_date);
      const contractor = contractors.find(c => c.id === insurance.data.contractor_id);
      
      if (!contractor) continue;
      
      const daysUntilExpiry = Math.floor((expirationDate - now) / (1000 * 60 * 60 * 24));
      
      // Seguro vencido
      if (expirationDate < now && !insurance.data.reminder_sent) {
        const emailBody = `
Hola ${contractor.data.contact_name || contractor.data.company_name},

El seguro de ${contractor.data.company_name} ha VENCIDO:

📋 Detalles:
• Tipo: ${insurance.data.insurance_type.replace(/_/g, ' ')}
• Compañía: ${insurance.data.insurance_company || 'N/A'}
• Póliza: ${insurance.data.policy_number || 'N/A'}
• Fecha de vencimiento: ${expirationDate.toLocaleDateString('es-ES')}

⚠️ Acción Requerida: Por favor, renueva este seguro lo antes posible para mantener el cumplimiento normativo.

Accede a tu cuenta para más detalles: ${req.headers.get('origin') || 'https://tu-app.com'}

Saludos,
Sistema de Gestión de Contratistas
        `;
        
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: contractor.data.email,
          subject: `⚠️ URGENTE: Seguro Vencido - ${contractor.data.company_name}`,
          body: emailBody,
          from_name: 'ContractorHub'
        });
        
        // Enviar SMS si está configurado Twilio
        if (accountSid && authToken && twilioPhone && contractor.data.phone) {
          const smsMessage = `⚠️ URGENTE: El seguro de ${contractor.data.company_name} ha VENCIDO. Tipo: ${insurance.data.insurance_type.replace(/_/g, ' ')}. Por favor, renuévalo lo antes posible. Accede a tu cuenta para más detalles.`;
          
          const formData = new URLSearchParams();
          formData.append('From', twilioPhone);
          formData.append('To', contractor.data.phone);
          formData.append('Body', smsMessage);
          
          await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${twilioAuth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
          });
          
          smsSent++;
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
        const emailBody = `
Hola ${contractor.data.contact_name || contractor.data.company_name},

El seguro de ${contractor.data.company_name} VENCE PRONTO:

📋 Detalles:
• Tipo: ${insurance.data.insurance_type.replace(/_/g, ' ')}
• Compañía: ${insurance.data.insurance_company || 'N/A'}
• Póliza: ${insurance.data.policy_number || 'N/A'}
• Fecha de vencimiento: ${expirationDate.toLocaleDateString('es-ES')}
• Días restantes: ${daysUntilExpiry}

📌 Recordatorio: Te recomendamos renovar este seguro con anticipación para evitar interrupciones en la cobertura.

Accede a tu cuenta para más detalles: ${req.headers.get('origin') || 'https://tu-app.com'}

Saludos,
Sistema de Gestión de Contratistas
        `;
        
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: contractor.data.email,
          subject: `📅 Recordatorio: Seguro por Vencer en ${daysUntilExpiry} días - ${contractor.data.company_name}`,
          body: emailBody,
          from_name: 'ContractorHub'
        });
        
        // Enviar SMS si está configurado Twilio
        if (accountSid && authToken && twilioPhone && contractor.data.phone) {
          const smsMessage = `📅 Recordatorio: El seguro de ${contractor.data.company_name} vence en ${daysUntilExpiry} días. Tipo: ${insurance.data.insurance_type.replace(/_/g, ' ')}. Renuévalo con anticipación.`;
          
          const formData = new URLSearchParams();
          formData.append('From', twilioPhone);
          formData.append('To', contractor.data.phone);
          formData.append('Body', smsMessage);
          
          await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${twilioAuth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
          });
          
          smsSent++;
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
      
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: companyEmail,
        subject: `⚠️ Resumen de Vencimientos Próximos - ${new Date().toLocaleDateString('es-MX')}`,
        body: companyEmailBody,
        from_name: 'ContractorHub'
      });
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