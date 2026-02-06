// ============================================
// RESPONSIVE MENU FUNCTIONS
// ============================================
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.remove('active');
    }
}

// ============================================
// SECTION NAVIGATION
// ============================================
function showSection(sectionId, element) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    if (element) {
        element.classList.add('active');
    }
    
    // Close mobile sidebar after selection
    closeSidebar();
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.sidebar');
    const hamburger = document.querySelector('.hamburger-btn');
    
    if (sidebar && hamburger && window.innerWidth <= 767) {
        if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
            closeSidebar();
        }
    }
});

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
