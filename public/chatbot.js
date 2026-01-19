// public/chatbot.js - Asistente Virtual del Sistema

(function() {
  'use strict';

  // Estilos del chatbot
  const styles = `
    .chatbot-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .chatbot-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
      color: white;
      font-size: 24px;
    }
    
    .chatbot-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
    
    .chatbot-window {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      display: none;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.3s ease-out;
    }
    
    .chatbot-window.active {
      display: flex;
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .chatbot-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .chatbot-title {
      font-weight: 600;
      font-size: 16px;
    }
    
    .chatbot-close {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .chatbot-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f8f9fa;
    }
    
    .chatbot-message {
      margin-bottom: 12px;
      display: flex;
      animation: fadeIn 0.3s;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .chatbot-message.bot {
      justify-content: flex-start;
    }
    
    .chatbot-message.user {
      justify-content: flex-end;
    }
    
    .message-bubble {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
    }
    
    .message-bubble.bot {
      background: white;
      color: #333;
      border-bottom-left-radius: 4px;
    }
    
    .message-bubble.user {
      background: #667eea;
      color: white;
      border-bottom-right-radius: 4px;
    }
    
    .chatbot-quick-actions {
      padding: 12px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    
    .quick-action-btn {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 16px;
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .quick-action-btn:hover {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }
    
    .chatbot-input-container {
      padding: 12px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
    }
    
    .chatbot-input {
      flex: 1;
      border: 1px solid #d1d5db;
      border-radius: 20px;
      padding: 8px 16px;
      font-size: 14px;
      outline: none;
    }
    
    .chatbot-input:focus {
      border-color: #667eea;
    }
    
    .chatbot-send {
      background: #667eea;
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: white;
      transition: all 0.2s;
    }
    
    .chatbot-send:hover {
      background: #5568d3;
    }
    
    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 10px 14px;
      background: white;
      border-radius: 12px;
      border-bottom-left-radius: 4px;
      width: fit-content;
    }
    
    .typing-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #667eea;
      animation: typing 1.4s infinite;
    }
    
    .typing-dot:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    .typing-dot:nth-child(3) {
      animation-delay: 0.4s;
    }
    
    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
      }
      30% {
        transform: translateY(-10px);
      }
    }
  `;

  // Inyectar estilos
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Base de conocimiento del chatbot
  const knowledge = {
    saludos: ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hey', 'qué tal'],
    ayuda: ['ayuda', 'help', 'ayúdame', 'necesito ayuda'],
    login: ['login', 'iniciar sesión', 'entrar', 'acceder', 'no puedo entrar', 'inicio sesión'],
    registro: ['registro', 'registrarse', 'crear cuenta', 'cuenta nueva', 'sign up', 'me registro'],
    incidente: ['incidente', 'reportar', 'crear incidente', 'problema', 'reporte', 'creo un incidente'],
    estado: ['estado', 'cambiar estado', 'progreso', 'cerrado'],
    usuario: ['usuario', 'usuarios', 'crear usuario', 'roles'],
    evidencia: ['evidencia', 'archivo', 'subir archivo', 'adjunto'],
    reporte: ['reporte', 'reportes', 'estadísticas', 'gráficos', 'genero reportes'],
    auditoría: ['auditoría', 'auditoria', 'logs', 'registro'],
    captcha: ['captcha', 'verificación', 'código']
  };

  // Respuestas del chatbot
  const responses = {
    saludo: '¡Hola! 👋 Soy el asistente virtual del Sistema de Gestión de Incidentes. ¿En qué puedo ayudarte hoy?',
    
    ayuda: `Puedo ayudarte con:
    
📝 Registro e inicio de sesión
🚨 Creación y gestión de incidentes
👥 Administración de usuarios
📊 Generación de reportes
📋 Consulta de auditorías
🔒 Seguridad y permisos

¿Sobre qué tema necesitas ayuda?`,

    login: `Para iniciar sesión:

1️⃣ Ingresa tu correo electrónico
2️⃣ Ingresa tu contraseña
3️⃣ Resuelve el captcha matemático
4️⃣ Haz clic en "Iniciar sesión"

⚠️ Tienes 3 intentos. Después serás bloqueado por 1 minuto.

¿Olvidaste tu contraseña? Contacta al administrador.`,

    registro: `Para registrarte:

👤 Como CLIENTE (sin código):
- Ve a "Registrarse"
- Completa tus datos
- Resuelve el captcha
- ¡Listo! Puedes iniciar sesión inmediatamente

🎭 Como ROL ESPECIAL (Técnico/Analista/Auditor):
1️⃣ Solicita un código (pestaña "Solicitar Código")
2️⃣ Recibirás el código por email
3️⃣ Completa el registro con tu código
4️⃣ Espera la aprobación del administrador
5️⃣ Te notificaremos por email cuando seas aprobado`,

    incidente: `Para crear un incidente:

1️⃣ Ve al Dashboard
2️⃣ Completa el formulario "Crear incidente"
   - Tipo (phishing, malware, etc.)
   - Severidad (Baja/Media/Alta)
   - Descripción detallada
3️⃣ Haz clic en "Crear incidente"

Para cambiar el estado:
Selecciona el estado en el dropdown del incidente.

Para subir evidencias:
Usa el botón "Subir evidencia" en cada incidente.`,

    usuario: `Gestión de usuarios (solo Administrador):

✅ Aprobar usuarios pendientes
❌ Rechazar solicitudes
👥 Ver lista de todos los usuarios
🔄 Activar/desactivar cuentas
🎭 Cambiar roles
🗑️ Eliminar usuarios

Los usuarios con roles especiales deben ser aprobados antes de poder iniciar sesión.`,

    reporte: `Para generar reportes:

1️⃣ Haz clic en "Ver reportes"
2️⃣ Aplica filtros:
   - Rango de fechas
   - Severidad
   - Estado
3️⃣ Exporta:
   📊 Excel - Datos detallados
   📄 PDF - Reporte visual con gráficos

Los reportes incluyen estadísticas por severidad y estado.`,

    auditoría: `Panel de Auditoría (Admin/Auditor):

📋 Ver todas las acciones del sistema:
- Inicios de sesión
- Creación de incidentes
- Cambios de estado
- Gestión de usuarios
- Subida de evidencias

Funciones disponibles:
🔍 Filtrar por usuario, módulo, fechas
📊 Exportar a Excel
📈 Ver estadísticas de actividad`,

    captcha: `El captcha es una medida de seguridad:

🔢 Resuelve operaciones matemáticas simples
   - Suma: 5 + 3 = ?
   - Resta: 10 - 4 = ?
   - Multiplicación: 3 × 2 = ?

🔄 Puedes generar un nuevo captcha con el botón "Nuevo Captcha"

Se requiere en:
- Login
- Solicitud de código
- Registro`,

    noEntiendo: 'Lo siento, no entiendo tu pregunta. 😅 Intenta preguntarme sobre: login, registro, incidentes, usuarios, reportes o auditoría.',

    despedida: '¡Hasta pronto! 👋 Si necesitas más ayuda, aquí estaré.'
  };

  // Crear HTML del chatbot
  const chatbotHTML = `
    <div class="chatbot-container">
      <button class="chatbot-button" id="chatbot-toggle">
        💬
      </button>
      <div class="chatbot-window" id="chatbot-window">
        <div class="chatbot-header">
          <div class="chatbot-title">🤖 Asistente Virtual</div>
          <button class="chatbot-close" id="chatbot-close">×</button>
        </div>
        <div class="chatbot-messages" id="chatbot-messages"></div>
        <div class="chatbot-quick-actions" id="quick-actions"></div>
        <div class="chatbot-input-container">
          <input type="text" class="chatbot-input" id="chatbot-input" placeholder="Escribe tu pregunta...">
          <button class="chatbot-send" id="chatbot-send">➤</button>
        </div>
      </div>
    </div>
  `;

  // Inyectar HTML
  document.addEventListener('DOMContentLoaded', () => {
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    initChatbot();
  });

  function initChatbot() {
    const toggleBtn = document.getElementById('chatbot-toggle');
    const closeBtn = document.getElementById('chatbot-close');
    const chatWindow = document.getElementById('chatbot-window');
    const messagesContainer = document.getElementById('chatbot-messages');
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    const quickActionsContainer = document.getElementById('quick-actions');

    // Mensaje de bienvenida
    addMessage(responses.saludo, 'bot');
    showQuickActions();

    // Toggle chatbot
    toggleBtn.addEventListener('click', () => {
      chatWindow.classList.toggle('active');
      if (chatWindow.classList.contains('active')) {
        input.focus();
      }
    });

    closeBtn.addEventListener('click', () => {
      chatWindow.classList.remove('active');
    });

    // Enviar mensaje
    function sendMessage() {
      const text = input.value.trim();
      if (!text) return;

      addMessage(text, 'user');
      input.value = '';

      // Mostrar indicador de escritura
      showTypingIndicator();

      // Responder después de un delay
      setTimeout(() => {
        removeTypingIndicator();
        const response = getResponse(text);
        addMessage(response, 'bot');
        showQuickActions();
      }, 800);
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    function addMessage(text, type) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `chatbot-message ${type}`;
      messageDiv.innerHTML = `<div class="message-bubble ${type}">${text.replace(/\n/g, '<br>')}</div>`;
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function showTypingIndicator() {
      const indicator = document.createElement('div');
      indicator.className = 'chatbot-message bot';
      indicator.id = 'typing-indicator';
      indicator.innerHTML = `
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      `;
      messagesContainer.appendChild(indicator);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function removeTypingIndicator() {
      const indicator = document.getElementById('typing-indicator');
      if (indicator) indicator.remove();
    }

    function getResponse(text) {
      const lowerText = text.toLowerCase();

      // Despedida
      if (lowerText.match(/adi[oó]s|chao|hasta luego|bye/)) {
        return responses.despedida;
      }

      // Saludos
      if (knowledge.saludos.some(s => lowerText.includes(s))) {
        return responses.saludo;
      }

      // Ayuda
      if (knowledge.ayuda.some(s => lowerText.includes(s))) {
        return responses.ayuda;
      }

      // Temas específicos
      if (knowledge.login.some(s => lowerText.includes(s))) {
        return responses.login;
      }

      if (knowledge.registro.some(s => lowerText.includes(s))) {
        return responses.registro;
      }

      if (knowledge.incidente.some(s => lowerText.includes(s))) {
        return responses.incidente;
      }

      if (knowledge.usuario.some(s => lowerText.includes(s))) {
        return responses.usuario;
      }

      if (knowledge.reporte.some(s => lowerText.includes(s))) {
        return responses.reporte;
      }

      if (knowledge.auditoría.some(s => lowerText.includes(s))) {
        return responses.auditoría;
      }

      if (knowledge.captcha.some(s => lowerText.includes(s))) {
        return responses.captcha;
      }

      return responses.noEntiendo;
    }

    function showQuickActions() {
      const actions = [
        { text: '🔐 Login', query: '¿Cómo inicio sesión?' },
        { text: '✍️ Registro', query: '¿Cómo me registro?' },
        { text: '🚨 Incidentes', query: '¿Cómo creo un incidente?' },
        { text: '📊 Reportes', query: '¿Cómo genero reportes?' }
      ];

      quickActionsContainer.innerHTML = '';
      
      actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = 'quick-action-btn';
        btn.textContent = action.text;
        btn.addEventListener('click', () => {
          input.value = action.query;
          sendMessage();
        });
        quickActionsContainer.appendChild(btn);
      });
    }
  }
})();