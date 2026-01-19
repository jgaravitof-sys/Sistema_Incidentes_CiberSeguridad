// config/email.js - SPRINT 2: Notificaciones de Asignación
const nodemailer = require('nodemailer');

// Configurar transporte de email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verificar conexión
transporter.verify(function(error, success) {
  if (error) {
    console.log('⚠️ Error en configuración de email:', error.message);
    console.log('💡 Configura SMTP_USER y SMTP_PASS en tu archivo .env');
  } else {
    console.log('✅ Servidor de email listo');
  }
});

// ===============================
// ✅ SPRINT 2: NOTIFICACIÓN DE ASIGNACIÓN
// ===============================
const enviarNotificacionAsignacion = async (emailTecnico, nombreTecnico, tipoIncidente, descripcion, severidad, incidenteId) => {
  try {
    const severidadColor = severidad === 'Alta' ? '#e63946' : 
                          severidad === 'Media' ? '#ffb703' : '#90be6d';
    
    const mailOptions = {
      from: `"Sistema de Incidentes" <${process.env.SMTP_USER}>`,
      to: emailTecnico,
      subject: `🔔 Nuevo Incidente Asignado - ${tipoIncidente} [${severidad}]`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 30px;
            }
            .incident-box {
              background: #f8f9fa;
              border-left: 4px solid ${severidadColor};
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .incident-box h3 {
              margin: 0 0 15px 0;
              color: #333;
            }
            .info-row {
              display: flex;
              margin: 10px 0;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: bold;
              color: #666;
              width: 120px;
            }
            .info-value {
              color: #333;
              flex: 1;
            }
            .badge {
              display: inline-block;
              padding: 5px 12px;
              background: ${severidadColor};
              color: white;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .btn {
              display: inline-block;
              padding: 12px 30px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin-top: 20px;
            }
            .alert {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Nuevo Incidente Asignado</h1>
              <p>Sistema de Gestión de Incidentes</p>
            </div>
            
            <div class="content">
              <p><strong>Hola ${nombreTecnico},</strong></p>
              
              <p>Se te ha asignado un nuevo incidente para su gestión:</p>
              
              <div class="incident-box">
                <h3>📋 Detalles del Incidente</h3>
                
                <div class="info-row">
                  <div class="info-label">Tipo:</div>
                  <div class="info-value"><strong>${tipoIncidente}</strong></div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">Severidad:</div>
                  <div class="info-value"><span class="badge">${severidad}</span></div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">Descripción:</div>
                  <div class="info-value">${descripcion}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">ID Incidente:</div>
                  <div class="info-value"><code>${incidenteId}</code></div>
                </div>
              </div>
              
              <div class="alert">
                <strong>⚡ Acción Requerida:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Revisa los detalles del incidente</li>
                  <li>Actualiza el estado según avances</li>
                  <li>Agrega comentarios sobre tu investigación</li>
                  <li>Sube evidencias si es necesario</li>
                </ul>
              </div>

              <p><strong>📝 Próximos pasos:</strong></p>
              <ol>
                <li>Inicia sesión en el sistema</li>
                <li>Ve a "Mis Incidentes Asignados"</li>
                <li>Revisa y gestiona el incidente</li>
                <li>Mantén actualizado el estado</li>
              </ol>

              <div style="text-align: center;">
                <a href="${process.env.APP_URL || 'http://localhost:4000'}/dashboard.html" class="btn">
                  Ir al Dashboard
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Sistema de Gestión de Incidentes de Ciberseguridad</strong></p>
              <p style="font-size: 12px; color: #999;">Este es un correo automático, por favor no respondas a este mensaje.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Notificación de asignación enviada a ${emailTecnico}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error enviando notificación a ${emailTecnico}:`, error);
    return { success: false, error: error.message };
  }
};

// ===============================
// ✅ SPRINT 2: NOTIFICACIÓN DE CAMBIO DE ESTADO
// ===============================
const enviarNotificacionCambioEstado = async (emailTecnico, nombreTecnico, tipoIncidente, estadoAnterior, estadoNuevo, usuarioCambio, incidenteId) => {
  try {
    const estadoColor = estadoNuevo === 'Cerrado' ? '#90be6d' :
                       estadoNuevo === 'En progreso' ? '#ffb703' : '#e63946';
    
    const mailOptions = {
      from: `"Sistema de Incidentes" <${process.env.SMTP_USER}>`,
      to: emailTecnico,
      subject: `🔄 Cambio de Estado en Incidente - ${tipoIncidente}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: ${estadoColor};
              color: white;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 30px;
            }
            .status-change {
              background: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .status-arrow {
              font-size: 24px;
              margin: 0 10px;
              color: #667eea;
            }
            .status-badge {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              font-size: 14px;
            }
            .status-old {
              background: #e5e7eb;
              color: #666;
            }
            .status-new {
              background: ${estadoColor};
              color: white;
            }
            .btn {
              display: inline-block;
              padding: 12px 30px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin-top: 20px;
            }
            .info {
              background: #e8f4f8;
              border-left: 4px solid #2196F3;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔄 Cambio de Estado</h1>
              <p>Sistema de Gestión de Incidentes</p>
            </div>
            
            <div class="content">
              <p><strong>Hola ${nombreTecnico},</strong></p>
              
              <p>El estado de un incidente asignado a ti ha sido actualizado:</p>
              
              <div class="info">
                <strong>📋 Incidente:</strong> ${tipoIncidente}<br>
                <strong>🔑 ID:</strong> <code>${incidenteId}</code><br>
                <strong>👤 Modificado por:</strong> ${usuarioCambio}
              </div>
              
              <div class="status-change">
                <h3 style="margin-top: 0;">Cambio de Estado</h3>
                <div>
                  <span class="status-badge status-old">${estadoAnterior}</span>
                  <span class="status-arrow">→</span>
                  <span class="status-badge status-new">${estadoNuevo}</span>
                </div>
              </div>

              ${estadoNuevo === 'Cerrado' ? `
                <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <strong>✅ Incidente Cerrado</strong>
                  <p style="margin: 5px 0 0 0;">Este incidente ha sido marcado como resuelto. Gracias por tu gestión.</p>
                </div>
              ` : ''}

              <div style="text-align: center;">
                <a href="${process.env.APP_URL || 'http://localhost:4000'}/dashboard.html" class="btn">
                  Ver Incidente
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Sistema de Gestión de Incidentes de Ciberseguridad</strong></p>
              <p style="font-size: 12px; color: #999;">Este es un correo automático, por favor no respondas a este mensaje.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Notificación de cambio de estado enviada a ${emailTecnico}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error enviando notificación a ${emailTecnico}:`, error);
    return { success: false, error: error.message };
  }
};

// ===============================
// FUNCIONES EXISTENTES (Códigos de verificación, etc.)
// ===============================
const enviarCodigoVerificacion = async (email, codigo, rol, nombreSolicitante) => {
  try {
    const mailOptions = {
      from: `"Sistema de Incidentes" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `🔐 Código de Verificación - Rol: ${rol}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 30px;
            }
            .code-box {
              background: #f8f9fa;
              border: 3px dashed #667eea;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .code {
              font-size: 36px;
              font-weight: bold;
              color: #667eea;
              letter-spacing: 5px;
              font-family: 'Courier New', monospace;
            }
            .info {
              background: #e8f4f8;
              border-left: 4px solid #2196F3;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .alert {
              background: #fee;
              border-left: 4px solid #f44336;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            .badge {
              display: inline-block;
              padding: 5px 12px;
              background: #667eea;
              color: white;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .btn {
              display: inline-block;
              padding: 12px 30px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Código de Verificación</h1>
              <p>Sistema de Gestión de Incidentes</p>
            </div>
            
            <div class="content">
              <p><strong>Hola ${nombreSolicitante},</strong></p>
              
              <p>Has solicitado un código de verificación para registrarte con el rol: <span class="badge">${rol}</span></p>
              
              <div class="code-box">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Tu código de verificación es:</p>
                <div class="code">${codigo}</div>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">Cópialo exactamente como aparece</p>
              </div>
              
              <div class="info">
                <strong>ℹ️ Información importante:</strong>
                <ul style="margin: 10px 0;">
                  <li>Este código es válido por <strong>30 minutos</strong></li>
                  <li>Solo puede ser usado <strong>una vez</strong></li>
                  <li>Es específico para el rol: <strong>${rol}</strong></li>
                  <li>Debe ser usado con el email: <strong>${email}</strong></li>
                </ul>
              </div>

              <div class="alert">
                <strong>⚠️ IMPORTANTE - Proceso de Aprobación:</strong>
                <ul style="margin: 10px 0;">
                  <li>Tu cuenta se creará pero estará <strong>INACTIVA</strong></li>
                  <li>Un <strong>administrador revisará</strong> tu solicitud</li>
                  <li>Solo podrás iniciar sesión <strong>después de ser aprobado</strong></li>
                  <li>Recibirás un correo cuando tu cuenta sea aprobada o rechazada</li>
                </ul>
              </div>

              <div class="warning">
                <strong>🔒 Seguridad:</strong>
                <ul style="margin: 10px 0;">
                  <li>No compartas este código con nadie</li>
                  <li>Si no solicitaste este código, ignora este mensaje</li>
                  <li>El código expirará automáticamente</li>
                </ul>
              </div>

              <p><strong>📝 Pasos siguientes:</strong></p>
              <ol>
                <li>Ve a la página de registro</li>
                <li>Ingresa tu información personal</li>
                <li>Selecciona el rol: <strong>${rol}</strong></li>
                <li>Ingresa este código</li>
                <li>Completa el registro</li>
                <li><strong>Espera la aprobación del administrador</strong></li>
              </ol>

              <div style="text-align: center;">
                <a href="${process.env.APP_URL || 'http://localhost:4000'}/register.html" class="btn">
                  Ir a Registro Ahora
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Sistema de Gestión de Incidentes de Ciberseguridad</strong></p>
              <p style="font-size: 12px; color: #999;">Este es un correo automático, por favor no respondas a este mensaje.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Código de verificación enviado a ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error enviando código a ${email}:`, error);
    return { success: false, error: error.message };
  }
};

// Función para enviar código APROBADO (después de que admin apruebe)
const enviarCodigoAprobado = async (email, codigo, rol, nombreSolicitante) => {
  try {
    const mailOptions = {
      from: `"Sistema de Incidentes" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `✅ Código de Verificación APROBADO - Rol: ${rol}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 30px;
            }
            .code-box {
              background: #f8f9fa;
              border: 3px dashed #10b981;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .code {
              font-size: 36px;
              font-weight: bold;
              color: #10b981;
              letter-spacing: 5px;
              font-family: 'Courier New', monospace;
            }
            .info {
              background: #e8f4f8;
              border-left: 4px solid #2196F3;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .success {
              background: #d1fae5;
              border-left: 4px solid #10b981;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            .badge {
              display: inline-block;
              padding: 5px 12px;
              background: #10b981;
              color: white;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .btn {
              display: inline-block;
              padding: 12px 30px;
              background: #10b981;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 ¡Solicitud Aprobada!</h1>
              <p>Sistema de Gestión de Incidentes</p>
            </div>
            
            <div class="content">
              <p><strong>Hola ${nombreSolicitante},</strong></p>
              
              <div class="success">
                <strong>✅ ¡Excelentes noticias!</strong>
                <p style="margin: 5px 0 0 0;">Tu solicitud para registrarte con el rol de <span class="badge">${rol}</span> ha sido <strong>APROBADA</strong> por un administrador.</p>
              </div>
              
              <div class="code-box">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Tu código de verificación es:</p>
                <div class="code">${codigo}</div>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">Cópialo exactamente como aparece</p>
              </div>
              
              <div class="info">
                <strong>ℹ️ Información importante:</strong>
                <ul style="margin: 10px 0;">
                  <li>Este código es válido por <strong>24 horas</strong></li>
                  <li>Solo puede ser usado <strong>una vez</strong></li>
                  <li>Es específico para el rol: <strong>${rol}</strong></li>
                  <li>Debe ser usado con el email: <strong>${email}</strong></li>
                </ul>
              </div>

              <div class="warning">
                <strong>⚠️ Seguridad:</strong>
                <ul style="margin: 10px 0;">
                  <li>No compartas este código con nadie</li>
                  <li>Si no solicitaste este código, contacta al administrador</li>
                  <li>El código expirará automáticamente después de 24 horas</li>
                </ul>
              </div>

              <p><strong>📝 Para completar tu registro:</strong></p>
              <ol>
                <li>Ve a la página de registro del sistema</li>
                <li>Ingresa tu información personal</li>
                <li>Selecciona el rol: <strong>${rol}</strong></li>
                <li>Ingresa este código cuando se te solicite</li>
                <li>Completa tu contraseña y finaliza el registro</li>
              </ol>

              <div style="text-align: center;">
                <a href="${process.env.APP_URL || 'http://localhost:4000'}/register.html" class="btn">
                  Ir a Registro Ahora
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Sistema de Gestión de Incidentes de Ciberseguridad</strong></p>
              <p style="font-size: 12px; color: #999;">Este es un correo automático, por favor no respondas a este mensaje.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email de código APROBADO enviado a ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error enviando email a ${email}:`, error);
    return { success: false, error: error.message };
  }
};

// Función para notificar RECHAZO
const enviarNotificacionRechazo = async (email, rol, nombreSolicitante, motivo) => {
  try {
    const mailOptions = {
      from: `"Sistema de Incidentes" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `❌ Solicitud Rechazada - Rol: ${rol}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: #dc3545;
              color: white;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 30px;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Solicitud Rechazada</h1>
            </div>
            
            <div class="content">
              <p><strong>Hola ${nombreSolicitante},</strong></p>
              
              <p>Lamentamos informarte que tu solicitud para registrarte con el rol de <strong>${rol}</strong> ha sido <strong>rechazada</strong>.</p>
              
              ${motivo ? `<p><strong>Motivo:</strong> ${motivo}</p>` : ''}
              
              <p>Si crees que esto es un error o deseas más información, por favor contacta al administrador del sistema.</p>
              
              <p>Puedes registrarte como <strong>Cliente</strong> sin necesidad de aprobación.</p>
            </div>
            
            <div class="footer">
              <p>Sistema de Gestión de Incidentes de Ciberseguridad</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email de RECHAZO enviado a ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error enviando email de rechazo a ${email}:`, error);
    return { success: false, error: error.message };
  }
};

// Función para notificar al ADMIN de nueva solicitud
const notificarAdminNuevaSolicitud = async (adminEmail, nombreSolicitante, emailSolicitante, rol) => {
  try {
    const mailOptions = {
      from: `"Sistema de Incidentes" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `🔔 Nueva Solicitud de Registro - Rol: ${rol}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: #667eea;
              color: white;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 30px;
            }
            .info-table {
              width: 100%;
              background: #f8f9fa;
              border-radius: 8px;
              padding: 15px;
              margin: 15px 0;
            }
            .info-table td {
              padding: 8px;
              border-bottom: 1px solid #dee2e6;
            }
            .info-table tr:last-child td {
              border-bottom: none;
            }
            .btn {
              display: inline-block;
              padding: 12px 30px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin-top: 20px;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Nueva Solicitud de Registro</h1>
            </div>
            
            <div class="content">
              <p><strong>Hay una nueva solicitud de registro pendiente de aprobación:</strong></p>
              
              <table class="info-table">
                <tr>
                  <td><strong>Nombre:</strong></td>
                  <td>${nombreSolicitante}</td>
                </tr>
                <tr>
                  <td><strong>Email:</strong></td>
                  <td>${emailSolicitante}</td>
                </tr>
                <tr>
                  <td><strong>Rol Solicitado:</strong></td>
                  <td><strong>${rol}</strong></td>
                </tr>
              </table>
              
              <p>Por favor, ingresa al panel de administración para <strong>APROBAR o RECHAZAR</strong> esta solicitud.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.APP_URL || 'http://localhost:4000'}/dashboard.html" class="btn">
                  Ir al Panel de Administración
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p>Sistema de Gestión de Incidentes de Ciberseguridad</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Notificación al admin ${adminEmail} enviada:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error enviando notificación al admin ${adminEmail}:`, error);
    return { success: false, error: error.message };
  }
};

// ===============================
// ✅ NOTIFICAR USUARIO APROBADO
// ===============================
const notificarUsuarioAprobado = async (email, nombre, rol) => {
  try {
    const mailOptions = {
      from: `"Sistema de Incidentes" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `✅ ¡Tu cuenta ha sido aprobada! - Rol: ${rol}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px;">
            <h1 style="color: #10b981;">🎉 ¡Cuenta Aprobada!</h1>
            <p><strong>Hola ${nombre},</strong></p>
            <p>Tu cuenta con el rol de <strong>${rol}</strong> ha sido <strong>APROBADA</strong>.</p>
            <p>Ya puedes iniciar sesión en el sistema.</p>
            <a href="${process.env.APP_URL || 'http://localhost:4000'}/login.html" 
               style="display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Iniciar Sesión Ahora
            </a>
          </div>
        </body>
        </html>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email de aprobación enviado a ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error enviando email a ${email}:`, error);
    return { success: false, error: error.message };
  }
};

// ===============================
// ❌ NOTIFICAR USUARIO RECHAZADO
// ===============================
const notificarUsuarioRechazado = async (email, nombre, rol, motivo) => {
  try {
    const mailOptions = {
      from: `"Sistema de Incidentes" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `❌ Solicitud Rechazada - Rol: ${rol}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px;">
            <h1 style="color: #ef4444;">❌ Solicitud Rechazada</h1>
            <p><strong>Hola ${nombre},</strong></p>
            <p>Tu solicitud para el rol de <strong>${rol}</strong> ha sido rechazada.</p>
            ${motivo ? `<p><strong>Motivo:</strong> ${motivo}</p>` : ''}
            <p>Si crees que es un error, contacta al administrador.</p>
          </div>
        </body>
        </html>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email de rechazo enviado a ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error enviando email a ${email}:`, error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  transporter,
  enviarCodigoVerificacion,
  enviarCodigoAprobado,
  enviarNotificacionRechazo,
  notificarAdminNuevaSolicitud,
  notificarUsuarioAprobado,
  notificarUsuarioRechazado,
  enviarNotificacionAsignacion,
  enviarNotificacionCambioEstado

};