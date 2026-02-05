// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    console.log('FiscalBTP Pro - Initialisation...');
    
    // Initialiser les données
    // Les modules sont maintenant globaux via window.*
    
    if (window.ChantiersModule) window.ChantiersModule.init();
    
    // Initialiser l'interface utilisateur
    if (window.UIModule) window.UIModule.init();
    
    // Initialiser le tableau de bord
    if (window.DashboardModule) window.DashboardModule.init();
    
    // Initialiser le calendrier
    if (window.CalendarModule) window.CalendarModule.init();
    
    console.log('Application prête.');
});
