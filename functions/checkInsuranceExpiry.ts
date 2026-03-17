import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Obtener todos los seguros y contratistas
    const insurances = await base44.asServiceRole.entities.Insurance.list();
    const contractors = await base44.asServiceRole.entities.Contractor.list();
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    let emailsSent = 0;
    const alerts = [];
    
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
      }
    }
    
    return Response.json({
      success: true,
      message: `Se procesaron ${insurances.length} seguros. ${emailsSent} notificaciones enviadas.`,
      alerts,
      emailsSent,
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