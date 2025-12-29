/* ============================================
   CURUZA HUB F LTD - MAIN JAVASCRIPT
   Version: 1.1.0 (Dynamic CMS Integration)
   Features:
   - Dynamic content loading from JSON
   - Admin Panel integration
   - Netlify Identity authentication
   - Service Worker for offline support
   ============================================ */

// Global configuration
const CONFIG = {
    apiBase: '/content',
    cacheDuration: 5 * 60 * 1000, // 5 minutes
    enableServiceWorker: true,
    enableAnalytics: false
};

// Global state
const APP_STATE = {
    currentUser: null,
    loadedData: {
        services: null,
        opportunities: null,
        pages: null
    },
    lastFetch: {},
    language: 'en'
};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    console.log('🚀 CURUZA HUB F LTD - Initializing Dynamic CMS Website');
    
    // ===== INITIALIZATION =====
    initializeApp();
    
    // ===== SIDEBAR FUNCTIONALITY =====
    initSidebar();
    
    // ===== DYNAMIC CONTENT LOADING =====
    initDynamicContent();
    
    // ===== ADMIN PANEL INTEGRATION =====
    initAdminIntegration();
    
    // ===== UI INTERACTIONS =====
    initUIInteractions();
    
    // ===== PERFORMANCE OPTIMIZATIONS =====
    initPerformance();
    
    console.log('✅ Website initialization complete');
});

// ===== APP INITIALIZATION =====
function initializeApp() {
    // Set language from localStorage or browser
    const savedLang = localStorage.getItem('curuza_language');
    if (savedLang) {
        APP_STATE.language = savedLang;
    } else {
        // Detect browser language
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('rw')) {
            APP_STATE.language = 'rw';
        }
    }
    
    // Apply language
    applyLanguage(APP_STATE.language);
    
    // Initialize Netlify Identity if available
    if (typeof netlifyIdentity !== 'undefined') {
        netlifyIdentity.init();
        netlifyIdentity.on('init', user => {
            APP_STATE.currentUser = user;
            updateUIForUser(user);
        });
        
        netlifyIdentity.on('login', user => {
            APP_STATE.currentUser = user;
            updateUIForUser(user);
            showNotification(`Welcome back, ${user.email}`, 'success');
        });
        
        netlifyIdentity.on('logout', () => {
            APP_STATE.currentUser = null;
            updateUIForUser(null);
            showNotification('Logged out successfully', 'info');
        });
    }
}

// ===== SIDEBAR FUNCTIONALITY =====
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    
    if (toggleSidebarBtn && sidebar) {
        toggleSidebarBtn.addEventListener('click', toggleSidebar);
    }
    
    if (closeSidebarBtn && sidebar) {
        closeSidebarBtn.addEventListener('click', closeSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    // Close sidebar with ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar?.classList.contains('active')) {
            closeSidebar();
        }
    });
    
    // Close sidebar when clicking on a link (mobile)
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 992) {
                closeSidebar();
            }
        });
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar.classList.contains('active')) {
        closeSidebar();
    } else {
        sidebar.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (overlay) overlay.style.display = 'block';
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.remove('active');
    document.body.style.overflow = '';
    if (overlay) overlay.style.display = 'none';
}

// ===== DYNAMIC CONTENT LOADING =====
function initDynamicContent() {
    // Check which page we're on and load appropriate content
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    switch(currentPage) {
        case 'index.html':
            loadHomepageContent();
            break;
        case 'services.html':
            loadServicesContent();
            break;
        case 'opportunities.html':
            loadOpportunitiesContent();
            break;
        case 'about.html':
            loadAboutContent();
            break;
        case 'profile.html':
            loadProfileContent();
            break;
        case 'contact.html':
            loadContactContent();
            break;
    }
    
    // Load common data needed on all pages
    loadCommonData();
}

async function loadHomepageContent() {
    try {
        // Load services for homepage highlights
        const services = await fetchWithCache(`${CONFIG.apiBase}/services/services.json`);
        if (services && services.length > 0) {
            renderHomepageServices(services.filter(s => s.featured).slice(0, 4));
            APP_STATE.loadedData.services = services;
        }
        
        // Load opportunities count for stats
        const opportunities = await fetchWithCache(`${CONFIG.apiBase}/opportunities/opportunities.json`);
        if (opportunities) {
            updateHomepageStats(opportunities);
            APP_STATE.loadedData.opportunities = opportunities;
        }
        
    } catch (error) {
        console.warn('Could not load homepage content:', error);
        showFallbackContent();
    }
}

async function loadServicesContent() {
    const loadingEl = document.getElementById('servicesLoading');
    const container = document.getElementById('servicesContainer');
    
    if (loadingEl) loadingEl.style.display = 'flex';
    
    try {
        const services = await fetchWithCache(`${CONFIG.apiBase}/services/services.json`);
        
        if (services && services.length > 0) {
            APP_STATE.loadedData.services = services;
            renderServices(services);
        } else {
            showNoContentMessage(container, 'services');
        }
        
    } catch (error) {
        console.error('Error loading services:', error);
        showErrorMessage(container, 'services');
    } finally {
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

async function loadOpportunitiesContent() {
    const loadingEl = document.getElementById('loadingContainer');
    const container = document.getElementById('opportunitiesContainer');
    
    if (loadingEl) loadingEl.style.display = 'block';
    
    try {
        const opportunities = await fetchWithCache(`${CONFIG.apiBase}/opportunities/opportunities.json`);
        
        if (opportunities && opportunities.length > 0) {
            APP_STATE.loadedData.opportunities = opportunities;
            renderOpportunities(opportunities);
            updateOpportunityStats(opportunities);
        } else {
            showNoContentMessage(container, 'opportunities');
        }
        
    } catch (error) {
        console.error('Error loading opportunities:', error);
        showErrorMessage(container, 'opportunities');
    } finally {
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

async function loadAboutContent() {
    try {
        const aboutData = await fetchWithCache(`${CONFIG.apiBase}/pages/about.json`);
        if (aboutData) {
            APP_STATE.loadedData.pages = APP_STATE.loadedData.pages || {};
            APP_STATE.loadedData.pages.about = aboutData;
            renderAboutContent(aboutData);
        }
    } catch (error) {
        console.warn('Could not load about content:', error);
    }
}

async function loadProfileContent() {
    try {
        const profileData = await fetchWithCache(`${CONFIG.apiBase}/pages/profile.json`);
        if (profileData) {
            APP_STATE.loadedData.pages = APP_STATE.loadedData.pages || {};
            APP_STATE.loadedData.pages.profile = profileData;
            renderProfileContent(profileData);
        }
    } catch (error) {
        console.warn('Could not load profile content:', error);
    }
}

async function loadContactContent() {
    try {
        const contactData = await fetchWithCache(`${CONFIG.apiBase}/pages/contact.json`);
        if (contactData) {
            APP_STATE.loadedData.pages = APP_STATE.loadedData.pages || {};
            APP_STATE.loadedData.pages.contact = contactData;
            renderContactContent(contactData);
        }
    } catch (error) {
        console.warn('Could not load contact content:', error);
    }
}

async function loadCommonData() {
    // Load data that might be needed across multiple pages
    // This runs in background and caches data
    try {
        // Pre-fetch services data if not already loaded
        if (!APP_STATE.loadedData.services) {
            const services = await fetchWithCache(`${CONFIG.apiBase}/services/services.json`);
            APP_STATE.loadedData.services = services;
        }
        
        // Pre-fetch contact info for footer/header
        if (!APP_STATE.loadedData.pages?.contact) {
            const contact = await fetchWithCache(`${CONFIG.apiBase}/pages/contact.json`);
            APP_STATE.loadedData.pages = APP_STATE.loadedData.pages || {};
            APP_STATE.loadedData.pages.contact = contact;
        }
        
    } catch (error) {
        // Silently fail for common data
        console.debug('Background data loading failed:', error);
    }
}

// ===== CACHE MANAGEMENT =====
async function fetchWithCache(url) {
    const cacheKey = `cache_${btoa(url)}`;
    const now = Date.now();
    
    // Check if we have valid cached data
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (now - timestamp < CONFIG.cacheDuration) {
            console.log(`📦 Using cached data for: ${url.split('/').pop()}`);
            return data;
        }
    }
    
    // Fetch fresh data
    try {
        console.log(`🌐 Fetching fresh data: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // Cache the data
        localStorage.setItem(cacheKey, JSON.stringify({
            data,
            timestamp: now
        }));
        
        // Update last fetch time
        APP_STATE.lastFetch[url] = now;
        
        return data;
        
    } catch (error) {
        console.error(`Fetch failed for ${url}:`, error);
        
        // Return cached data even if stale
        if (cached) {
            const { data } = JSON.parse(cached);
            console.warn(`⚠️ Using stale cached data for ${url}`);
            return data;
        }
        
        throw error;
    }
}

function clearCache() {
    // Clear all cached data
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cache_')) {
            localStorage.removeItem(key);
        }
    });
    
    APP_STATE.lastFetch = {};
    showNotification('Cache cleared successfully', 'success');
}

// ===== CONTENT RENDERING FUNCTIONS =====
function renderServices(services) {
    const container = document.getElementById('servicesContainer');
    if (!container) return;
    
    // Sort by order
    const sortedServices = [...services].sort((a, b) => (a.order || 999) - (b.order || 999));
    
    const html = sortedServices.map(service => `
        <div class="service-card ${service.featured ? 'featured' : ''}" data-id="${service.id}">
            <div class="service-icon">
                <i class="${service.icon || 'fas fa-handshake'}"></i>
                ${service.featured ? '<span class="featured-badge">Featured</span>' : ''}
            </div>
            <h3>${APP_STATE.language === 'rw' ? service.title_rw : service.title_en}</h3>
            <p>${APP_STATE.language === 'rw' ? service.description_rw : service.description_en}</p>
            <div class="service-actions">
                <a href="contact.html?service=${service.id}" class="btn-inquire">
                    <i class="fas fa-envelope"></i> Inquire
                </a>
                <button class="btn-details" onclick="showServiceDetails('${service.id}')">
                    <i class="fas fa-info-circle"></i> Details
                </button>
            </div>
            ${service.updated ? `
            <div class="service-meta">
                <small><i class="fas fa-clock"></i> Updated: ${formatDate(service.updated)}</small>
            </div>
            ` : ''}
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function renderOpportunities(opportunities) {
    const container = document.getElementById('opportunitiesContainer');
    if (!container) return;
    
    // Filter active opportunities by default
    const activeOpportunities = opportunities.filter(opp => opp.status === 'active');
    
    // Group by type
    const grouped = {
        job: activeOpportunities.filter(opp => opp.type === 'job'),
        business: activeOpportunities.filter(opp => opp.type === 'business'),
        investment: activeOpportunities.filter(opp => opp.type === 'investment'),
        partnership: activeOpportunities.filter(opp => opp.type === 'partnership')
    };
    
    let html = '';
    
    Object.entries(grouped).forEach(([type, opps]) => {
        if (opps.length === 0) return;
        
        const typeLabels = {
            job: 'Job Opportunities',
            business: 'Business Opportunities',
            investment: 'Investment Opportunities',
            partnership: 'Partnership Opportunities'
        };
        
        html += `
            <div class="opportunity-category" data-type="${type}">
                <div class="category-header">
                    <h3><i class="fas ${getOpportunityIcon(type)}"></i> ${typeLabels[type]}</h3>
                    <span class="category-count">${opps.length} ${opps.length === 1 ? 'opportunity' : 'opportunities'}</span>
                </div>
                <div class="opportunities-grid">
                    ${opps.map(opp => `
                        <div class="opportunity-card ${type}" data-id="${opp.id}">
                            ${getStatusBadge(opp.status)}
                            <div class="opportunity-header">
                                <h4>${opp.title}</h4>
                                <div class="opportunity-meta">
                                    ${opp.company ? `<span class="meta-item"><i class="fas fa-building"></i> ${opp.company}</span>` : ''}
                                    <span class="meta-item"><i class="fas fa-map-marker-alt"></i> ${opp.location}</span>
                                </div>
                            </div>
                            <div class="opportunity-body">
                                <p>${opp.description.substring(0, 150)}${opp.description.length > 150 ? '...' : ''}</p>
                                <div class="opportunity-tags">
                                    <span class="tag">${type}</span>
                                    ${opp.expiry_date ? `<span class="tag deadline">Until ${formatDate(opp.expiry_date)}</span>` : ''}
                                </div>
                            </div>
                            <div class="opportunity-footer">
                                <button class="btn-view-details" onclick="viewOpportunity('${opp.id}')">
                                    View Details
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html || '<div class="no-opportunities"><p>No active opportunities at the moment. Check back soon!</p></div>';
}

function renderAboutContent(aboutData) {
    // Update page content with about data
    const lang = APP_STATE.language;
    const content = aboutData[lang] || aboutData.en;
    
    if (!content) return;
    
    // Update mission
    const missionEl = document.getElementById('missionContent');
    if (missionEl && content.mission) {
        missionEl.textContent = content.mission;
    }
    
    // Update vision
    const visionEl = document.getElementById('visionContent');
    if (visionEl && content.vision) {
        visionEl.textContent = content.vision;
    }
    
    // Update values
    const valuesEl = document.getElementById('valuesList');
    if (valuesEl && content.values) {
        valuesEl.innerHTML = content.values.map(value => `<li>${value}</li>`).join('');
    }
    
    // Update overview
    const overviewEl = document.getElementById('overviewContent');
    if (overviewEl && content.overview) {
        overviewEl.innerHTML = content.overview;
    }
}

// ===== ADMIN PANEL INTEGRATION =====
function initAdminIntegration() {
    // Check if user is admin and add edit buttons
    if (APP_STATE.currentUser) {
        addAdminEditButtons();
        setupAdminShortcuts();
    }
    
    // Listen for auth changes
    if (typeof netlifyIdentity !== 'undefined') {
        netlifyIdentity.on('login', () => {
            addAdminEditButtons();
            setupAdminShortcuts();
        });
        
        netlifyIdentity.on('logout', () => {
            removeAdminEditButtons();
        });
    }
}

function addAdminEditButtons() {
    // Remove existing edit buttons
    removeAdminEditButtons();
    
    // Add edit button based on current page
    const currentPage = window.location.pathname.split('/').pop();
    let editUrl = '/admin/#/';
    
    switch(currentPage) {
        case 'services.html':
            editUrl += 'collections/services';
            break;
        case 'opportunities.html':
            editUrl += 'collections/opportunities';
            break;
        case 'about.html':
            editUrl += 'collections/pages/entries/about';
            break;
        case 'profile.html':
            editUrl += 'collections/pages/entries/profile';
            break;
        case 'contact.html':
            editUrl += 'collections/pages/entries/contact';
            break;
        default:
            editUrl += 'collections';
    }
    
    // Create edit button
    const editBtn = document.createElement('a');
    editBtn.href = editUrl;
    editBtn.className = 'admin-edit-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Page';
    editBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #3b82f6;
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        text-decoration: none;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.3s;
    `;
    
    editBtn.addEventListener('mouseenter', () => {
        editBtn.style.transform = 'translateY(-2px)';
        editBtn.style.boxShadow = '0 6px 12px rgba(59, 130, 246, 0.3)';
    });
    
    editBtn.addEventListener('mouseleave', () => {
        editBtn.style.transform = 'translateY(0)';
        editBtn.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    });
    
    document.body.appendChild(editBtn);
}

function removeAdminEditButtons() {
    document.querySelectorAll('.admin-edit-btn').forEach(btn => btn.remove());
}

function setupAdminShortcuts() {
    // Add keyboard shortcuts for admins
    document.addEventListener('keydown', (e) => {
        if (!APP_STATE.currentUser) return;
        
        // Ctrl+E opens admin panel
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            window.open('/admin/', '_blank');
        }
        
        // Ctrl+R reloads data
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            clearCache();
            initDynamicContent();
        }
    });
}

// ===== UI INTERACTIONS =====
function initUIInteractions() {
    // Language toggle
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const lang = e.target.dataset.lang;
            if (lang) {
                setLanguage(lang);
            }
        });
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.target.dataset.filter;
            if (filter) {
                applyFilter(filter);
            }
        });
    });
    
    // Search functionality
    const searchInput = document.getElementById('opportunitySearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            performSearch(e.target.value);
        }, 300));
    }
    
    // Modal handling
    initModals();
    
    // Form validation
    initForms();
    
    // Smooth scrolling
    initSmoothScroll();
}

function setLanguage(lang) {
    APP_STATE.language = lang;
    localStorage.setItem('curuza_language', lang);
    applyLanguage(lang);
    
    // Update UI
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    // Reload content with new language
    initDynamicContent();
    
    showNotification(`Language changed to ${lang === 'en' ? 'English' : 'Kinyarwanda'}`, 'info');
}

function applyLanguage(lang) {
    // Update language attribute
    document.documentElement.lang = lang;
    
    // Update language toggle buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
}

function applyFilter(filter) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    // Apply filter to opportunities
    if (APP_STATE.loadedData.opportunities) {
        const filtered = filter === 'all' 
            ? APP_STATE.loadedData.opportunities
            : APP_STATE.loadedData.opportunities.filter(opp => opp.type === filter);
        
        renderOpportunities(filtered);
    }
}

function performSearch(query) {
    if (!APP_STATE.loadedData.opportunities) return;
    
    const normalizedQuery = query.toLowerCase().trim();
    
    if (normalizedQuery.length === 0) {
        renderOpportunities(APP_STATE.loadedData.opportunities);
        return;
    }
    
    const results = APP_STATE.loadedData.opportunities.filter(opp => 
        opp.title.toLowerCase().includes(normalizedQuery) ||
        opp.description.toLowerCase().includes(normalizedQuery) ||
        opp.location.toLowerCase().includes(normalizedQuery) ||
        (opp.company && opp.company.toLowerCase().includes(normalizedQuery))
    );
    
    renderOpportunities(results);
}

// ===== MODAL SYSTEM =====
function initModals() {
    // Close modals when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
            }
        });
    });
    
    // Close modals with ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(closeModal);
        }
    });
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modal) {
    if (modal.classList) {
        modal.classList.remove('active');
    }
    document.body.style.overflow = '';
}

// ===== FORM HANDLING =====
function initForms() {
    // Contact form validation
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
        
        // Character counter for message
        const messageInput = contactForm.querySelector('textarea');
        if (messageInput) {
            const counter = document.getElementById('charCount');
            messageInput.addEventListener('input', () => {
                if (counter) counter.textContent = messageInput.value.length;
            });
        }
    }
    
    // Newsletter form
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    }
}

async function handleContactSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Basic validation
    const name = form.querySelector('#fullName').value.trim();
    const email = form.querySelector('#userEmail').value.trim();
    const message = form.querySelector('#userMessage').value.trim();
    
    if (!name || !email || !message) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    try {
        // Prepare data for EmailJS
        const templateParams = {
            from_name: name,
            from_email: email,
            to_name: 'Curuza Hub',
            message: message,
            phone: form.querySelector('#userPhone')?.value || 'Not provided',
            subject: form.querySelector('#messageSubject')?.value || 'General Inquiry'
        };
        
        // Send email using EmailJS
        await emailjs.send(
            'service_egx36yx', // Service ID
            'template_phu9nbq', // Template ID
            templateParams
        );
        
        // Show success message
        showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
        
        // Reset form
        form.reset();
        document.getElementById('charCount').textContent = '0';
        
        // Show success state
        const successEl = document.getElementById('successMessage');
        if (successEl) {
            successEl.classList.remove('hidden');
            form.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Email send failed:', error);
        showNotification('Failed to send message. Please try again or contact us directly.', 'error');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function handleNewsletterSubmit(e) {
    e.preventDefault();
    
    const email = e.target.querySelector('input[type="email"]').value.trim();
    
    if (!validateEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // In production, send to your backend
    console.log('Newsletter subscription:', email);
    
    // Simulate success
    showNotification('Thank you for subscribing to our newsletter!', 'success');
    e.target.reset();
}

// ===== UTILITY FUNCTIONS =====
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getOpportunityIcon(type) {
    const icons = {
        job: 'fa-briefcase',
        business: 'fa-handshake',
        investment: 'fa-chart-line',
        partnership: 'fa-users'
    };
    return icons[type] || 'fa-briefcase';
}

function getStatusBadge(status) {
    const badges = {
        active: '<span class="status-badge active">Active</span>',
        closed: '<span class="status-badge closed">Closed</span>',
        'coming-soon': '<span class="status-badge coming">Coming Soon</span>',
        filled: '<span class="status-badge filled">Filled</span>'
    };
    return badges[status] || '';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.global-notification').forEach(n => n.remove());
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `global-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        zIndex: '99999',
        transform: 'translateX(150%)',
        transition: 'transform 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.transform = 'translateX(150%)';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(150%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function showErrorMessage(container, type) {
    if (container) {
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Unable to Load ${type.charAt(0).toUpperCase() + type.slice(1)}</h3>
                <p>There was an error loading the ${type}. Please try again later.</p>
                <button onclick="location.reload()" class="btn-retry">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }
}

function showNoContentMessage(container, type) {
    if (container) {
        container.innerHTML = `
            <div class="no-content">
                <i class="fas fa-${type === 'services' ? 'concierge-bell' : 'briefcase'}"></i>
                <h3>No ${type.charAt(0).toUpperCase() + type.slice(1)} Available</h3>
                <p>There are currently no ${type} available. Please check back later.</p>
            </div>
        `;
    }
}

// ===== PERFORMANCE OPTIMIZATIONS =====
function initPerformance() {
    // Lazy load images
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => imageObserver.observe(img));
    }
    
    // Prefetch important pages
    if ('connection' in navigator && !navigator.connection.saveData) {
        const links = document.querySelectorAll('a[href^="/"]');
        links.forEach(link => {
            if (link.href && !link.href.includes('#') && link.hostname === window.location.hostname) {
                const prefetchLink = document.createElement('link');
                prefetchLink.rel = 'prefetch';
                prefetchLink.href = link.href;
                document.head.appendChild(prefetchLink);
            }
        });
    }
    
    // Register service worker
    if ('serviceWorker' in navigator && CONFIG.enableServiceWorker) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
        });
    }
}

// ===== GLOBAL EXPORTS =====
// Make important functions available globally
window.CURUZA_HUB = {
    reloadData: () => {
        clearCache();
        initDynamicContent();
    },
    switchLanguage: setLanguage,
    showNotification,
    clearCache,
    viewOpportunity: (id) => {
        if (APP_STATE.loadedData.opportunities) {
            const opportunity = APP_STATE.loadedData.opportunities.find(opp => opp.id === id);
            if (opportunity) {
                // Show opportunity in modal
                const modal = document.getElementById('opportunityModal');
                if (modal) {
                    modal.querySelector('.modal-title').textContent = opportunity.title;
                    modal.querySelector('.modal-body').innerHTML = `
                        <div class="opportunity-detail">
                            <p><strong>Company:</strong> ${opportunity.company || 'Not specified'}</p>
                            <p><strong>Location:</strong> ${opportunity.location}</p>
                            <p><strong>Deadline:</strong> ${formatDate(opportunity.expiry_date)}</p>
                            <div class="description">
                                ${opportunity.description.replace(/\n/g, '<br>')}
                            </div>
                            ${opportunity.requirements ? `
                            <div class="requirements">
                                <h4>Requirements</h4>
                                <ul>
                                    ${opportunity.requirements.map(req => `<li>${req}</li>`).join('')}
                                </ul>
                            </div>
                            ` : ''}
                            ${opportunity.contact_email ? `
                            <div class="contact-info">
                                <h4>Contact</h4>
                                <p>Email: <a href="mailto:${opportunity.contact_email}">${opportunity.contact_email}</a></p>
                            </div>
                            ` : ''}
                        </div>
                    `;
                    showModal('opportunityModal');
                }
            }
        }
    },
    showServiceDetails: (id) => {
        if (APP_STATE.loadedData.services) {
            const service = APP_STATE.loadedData.services.find(s => s.id === id);
            if (service) {
                const lang = APP_STATE.language;
                const details = lang === 'rw' ? service.details_rw : service.details_en;
                
                if (details) {
                    const modal = document.getElementById('serviceModal');
                    if (modal) {
                        modal.querySelector('.modal-title').textContent = 
                            lang === 'rw' ? service.title_rw : service.title_en;
                        modal.querySelector('.modal-body').innerHTML = details;
                        showModal('serviceModal');
                    }
                }
            }
        }
    }
};

// ===== INITIALIZATION ON WINDOW LOAD =====
window.addEventListener('load', function() {
    // Hide loading spinner if exists
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        setTimeout(() => {
            loadingSpinner.style.opacity = '0';
            setTimeout(() => {
                loadingSpinner.style.display = 'none';
            }, 300);
        }, 500);
    }
    
    // Add loaded class for animations
    document.body.classList.add('loaded');
    
    // Log performance
    if ('performance' in window) {
        const perf = performance.getEntriesByType('navigation')[0];
        if (perf) {
            console.log(`⏱️ Page loaded in ${perf.loadEventEnd - perf.startTime}ms`);
        }
    }
});

// Console greeting
console.log(`
███████╗██╗   ██╗██████╗ ██╗   ██╗███████╗ █████╗ 
██╔════╝██║   ██║██╔══██╗██║   ██║╚══███╔╝██╔══██╗
███████╗██║   ██║██████╔╝██║   ██║  ███╔╝ ███████║
╚════██║██║   ██║██╔══██╗██║   ██║ ███╔╝  ██╔══██║
███████║╚██████╔╝██║  ██║╚██████╔╝███████╗██║  ██║
╚══════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝
                                                   
CURUZA HUB F LTD - Dynamic CMS Website
Version 1.1.0 | Ready for Netlify CMS
`);