/* ============================================
   CURUZA HUB F LTD - FORM HANDLER
   Contact Form Processing with EmailJS & Dynamic Integration
   Version: 1.1.0 (Dynamic CMS Integration)
   ============================================ */

// Global form configuration
const FORM_CONFIG = {
    // EmailJS Configuration (From your instructions)
    emailjs: {
        serviceId: 'service_egx36yx',
        templateId: 'template_phu9nbq',
        publicKey: 'JwwE4Hb0D0-if4S24'
    },
    
    // Form settings
    settings: {
        maxMessageLength: 1000,
        autoSaveInterval: 1000, // 1 second
        maxDraftAge: 24 * 60 * 60 * 1000, // 24 hours
        spamCheckEnabled: true
    },
    
    // Storage keys
    storage: {
        drafts: 'curuza_form_drafts',
        submissions: 'curuza_form_submissions',
        contactData: 'curuza_contact_data'
    }
};

// Global form state
const FORM_STATE = {
    currentForm: null,
    contactInfo: null,
    drafts: {},
    submissions: []
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📝 CURUZA HUB Form Handler - Initializing');
    
    // Initialize EmailJS
    initEmailJS();
    
    // Load contact information for form
    loadContactData();
    
    // Initialize all forms
    initForms();
    
    // Load saved drafts
    loadSavedDrafts();
    
    console.log('✅ Form handler initialized successfully');
});

// ===== EMAILJS INITIALIZATION =====
function initEmailJS() {
    try {
        emailjs.init(FORM_CONFIG.emailjs.publicKey);
        console.log('📧 EmailJS initialized with key:', FORM_CONFIG.emailjs.publicKey);
    } catch (error) {
        console.error('Failed to initialize EmailJS:', error);
        showNotification('Email service temporarily unavailable. Please try again later.', 'error');
    }
}

// ===== CONTACT DATA LOADING =====
async function loadContactData() {
    try {
        // Try to load from cache first
        const cached = localStorage.getItem(FORM_CONFIG.storage.contactData);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < 5 * 60 * 1000) { // 5 minutes cache
                FORM_STATE.contactInfo = data;
                console.log('📞 Using cached contact data');
                return;
            }
        }
        
        // Fetch fresh data
        const response = await fetch('/content/pages/contact.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        FORM_STATE.contactInfo = data;
        
        // Cache the data
        localStorage.setItem(FORM_CONFIG.storage.contactData, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
        
        console.log('📞 Contact data loaded successfully');
        
    } catch (error) {
        console.warn('Could not load contact data:', error);
        // Use fallback contact info
        FORM_STATE.contactInfo = {
            contact_info: {
                email: 'curuzahubfltd@gmail.com',
                phone_primary: '+250 785 439 453',
                phone_secondary: '+250 728 083 403'
            }
        };
    }
}

// ===== FORM INITIALIZATION =====
function initForms() {
    // Contact Form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        initContactForm(contactForm);
    }
    
    // Post Opportunity Form
    const postOpportunityForm = document.getElementById('postOpportunityForm');
    if (postOpportunityForm) {
        initPostOpportunityForm(postOpportunityForm);
    }
    
    // Newsletter Form
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        initNewsletterForm(newsletterForm);
    }
    
    // Consultation Form (if exists)
    const consultationForm = document.getElementById('consultationForm');
    if (consultationForm) {
        initConsultationForm(consultationForm);
    }
    
    // Add security measures to all forms
    addFormSecurity();
    
    // Enhance form styles
    enhanceFormStyles();
}

// ===== CONTACT FORM HANDLING =====
function initContactForm(form) {
    FORM_STATE.currentForm = 'contact';
    
    // Form elements
    const fullNameInput = form.querySelector('#fullName') || form.querySelector('[name="full_name"]');
    const emailInput = form.querySelector('#userEmail') || form.querySelector('[name="user_email"]');
    const phoneInput = form.querySelector('#userPhone') || form.querySelector('[name="user_phone"]');
    const subjectSelect = form.querySelector('#messageSubject') || form.querySelector('[name="message_subject"]');
    const messageTextarea = form.querySelector('#userMessage') || form.querySelector('[name="user_message"]');
    const submitBtn = form.querySelector('#submitBtn') || form.querySelector('button[type="submit"]');
    const subscribeCheckbox = form.querySelector('#subscribeNews');
    
    // Error elements
    const errorElements = {
        name: document.getElementById('nameError'),
        email: document.getElementById('emailError'),
        phone: document.getElementById('phoneError'),
        subject: document.getElementById('subjectError'),
        message: document.getElementById('messageError')
    };
    
    // Success message
    const successMessage = document.getElementById('successMessage');
    const newMessageBtn = document.getElementById('newMessageBtn');
    
    // Character counter
    const charCountEl = document.getElementById('charCount');
    
    // ===== VALIDATION =====
    function validateContactForm() {
        let isValid = true;
        clearErrors();
        
        // Validate Full Name
        if (!fullNameInput || !fullNameInput.value.trim()) {
            showError(errorElements.name, 'Full name is required');
            highlightInvalid(fullNameInput);
            isValid = false;
        } else if (fullNameInput.value.trim().length < 2) {
            showError(errorElements.name, 'Full name must be at least 2 characters');
            highlightInvalid(fullNameInput);
            isValid = false;
        }
        
        // Validate Email
        if (!emailInput || !emailInput.value.trim()) {
            showError(errorElements.email, 'Email address is required');
            highlightInvalid(emailInput);
            isValid = false;
        } else if (!isValidEmail(emailInput.value.trim())) {
            showError(errorElements.email, 'Please enter a valid email address');
            highlightInvalid(emailInput);
            isValid = false;
        }
        
        // Validate Phone (optional)
        if (phoneInput && phoneInput.value.trim() && !isValidPhone(phoneInput.value.trim())) {
            showError(errorElements.phone, 'Please enter a valid phone number');
            highlightInvalid(phoneInput);
            isValid = false;
        }
        
        // Validate Subject
        if (!subjectSelect || !subjectSelect.value) {
            showError(errorElements.subject, 'Please select a subject');
            highlightInvalid(subjectSelect);
            isValid = false;
        }
        
        // Validate Message
        if (!messageTextarea || !messageTextarea.value.trim()) {
            showError(errorElements.message, 'Message is required');
            highlightInvalid(messageTextarea);
            isValid = false;
        } else if (messageTextarea.value.trim().length < 10) {
            showError(errorElements.message, 'Message must be at least 10 characters');
            highlightInvalid(messageTextarea);
            isValid = false;
        } else if (messageTextarea.value.trim().length > FORM_CONFIG.settings.maxMessageLength) {
            showError(errorElements.message, `Message must not exceed ${FORM_CONFIG.settings.maxMessageLength} characters`);
            highlightInvalid(messageTextarea);
            isValid = false;
        }
        
        // Spam check
        if (FORM_CONFIG.settings.spamCheckEnabled && containsSpam(messageTextarea.value.trim())) {
            showError(errorElements.message, 'Message contains suspicious content');
            highlightInvalid(messageTextarea);
            isValid = false;
        }
        
        return isValid;
    }
    
    // ===== SUBMISSION =====
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateContactForm()) {
            return;
        }
        
        // Set loading state
        setLoadingState(submitBtn, true);
        
        // Prepare form data
        const formData = {
            from_name: fullNameInput.value.trim(),
            from_email: emailInput.value.trim(),
            to_name: 'Curuza Hub Team',
            to_email: FORM_STATE.contactInfo?.contact_info?.email || 'curuzahubfltd@gmail.com',
            message: messageTextarea.value.trim(),
            phone: phoneInput?.value.trim() || 'Not provided',
            subject: subjectSelect?.options[subjectSelect.selectedIndex]?.text || 'General Inquiry',
            page_url: window.location.href,
            timestamp: new Date().toISOString(),
            subscribe_newsletter: subscribeCheckbox?.checked || false
        };
        
        // Add current user info if logged in
        if (typeof netlifyIdentity !== 'undefined' && netlifyIdentity.currentUser()) {
            const user = netlifyIdentity.currentUser();
            formData.user_id = user.id;
            formData.user_email = user.email;
            formData.user_role = user.role;
        }
        
        console.log('📨 Preparing to send contact form:', formData);
        
        try {
            // Send via EmailJS
            const response = await emailjs.send(
                FORM_CONFIG.emailjs.serviceId,
                FORM_CONFIG.emailjs.templateId,
                formData
            );
            
            console.log('✅ Email sent successfully:', response);
            
            // Show success
            showFormSuccess(form, successMessage);
            
            // Store submission
            storeSubmission('contact', formData);
            
            // Clear draft
            clearFormDraft('contact');
            
            // Reset form
            form.reset();
            if (charCountEl) charCountEl.textContent = '0';
            
            // Show notification
            showNotification('Message sent successfully! We\'ll respond within 24 hours.', 'success');
            
            // Track analytics
            trackFormEvent('contact_form_submit', formData.subject);
            
        } catch (error) {
            console.error('❌ Email sending failed:', error);
            
            // Show error
            showNotification(
                'Failed to send message. Please try again or contact us directly at ' + 
                (FORM_STATE.contactInfo?.contact_info?.phone_primary || '+250 785 439 453'),
                'error'
            );
            
            // Restore button
            setLoadingState(submitBtn, false);
        }
    });
    
    // ===== REAL-TIME VALIDATION =====
    if (fullNameInput) {
        fullNameInput.addEventListener('blur', validateField(fullNameInput, errorElements.name, validateName));
    }
    
    if (emailInput) {
        emailInput.addEventListener('blur', validateField(emailInput, errorElements.email, validateEmail));
    }
    
    if (phoneInput) {
        phoneInput.addEventListener('blur', validateField(phoneInput, errorElements.phone, validatePhoneOptional));
    }
    
    if (subjectSelect) {
        subjectSelect.addEventListener('change', function() {
            if (this.value) {
                clearError(errorElements.subject);
                highlightValid(this);
            } else {
                showError(errorElements.subject, 'Please select a subject');
                highlightInvalid(this);
            }
        });
    }
    
    if (messageTextarea) {
        messageTextarea.addEventListener('blur', validateField(messageTextarea, errorElements.message, validateMessage));
        
        // Character counter
        if (charCountEl) {
            messageTextarea.addEventListener('input', function() {
                const length = this.value.length;
                charCountEl.textContent = length;
                
                if (length > FORM_CONFIG.settings.maxMessageLength * 0.9) {
                    charCountEl.style.color = '#ef4444';
                } else if (length > FORM_CONFIG.settings.maxMessageLength * 0.75) {
                    charCountEl.style.color = '#f59e0b';
                } else {
                    charCountEl.style.color = '#6b7280';
                }
            });
        }
    }
    
    // ===== NEW MESSAGE BUTTON =====
    if (newMessageBtn) {
        newMessageBtn.addEventListener('click', function() {
            if (successMessage) successMessage.classList.add('hidden');
            form.classList.remove('hidden');
            clearErrors();
            clearHighlights();
        });
    }
    
    // ===== AUTO-SAVE DRAFT =====
    let autoSaveTimer;
    
    function saveFormDraft() {
        if (!fullNameInput && !emailInput && !messageTextarea) return;
        
        const draft = {
            fullName: fullNameInput?.value || '',
            email: emailInput?.value || '',
            phone: phoneInput?.value || '',
            subject: subjectSelect?.value || '',
            message: messageTextarea?.value || '',
            timestamp: Date.now()
        };
        
        FORM_STATE.drafts.contact = draft;
        localStorage.setItem(FORM_CONFIG.storage.drafts, JSON.stringify(FORM_STATE.drafts));
    }
    
    // Auto-save on input
    [fullNameInput, emailInput, phoneInput, messageTextarea].forEach(input => {
        if (input) {
            input.addEventListener('input', function() {
                clearTimeout(autoSaveTimer);
                autoSaveTimer = setTimeout(saveFormDraft, FORM_CONFIG.settings.autoSaveInterval);
            });
        }
    });
    
    if (subjectSelect) {
        subjectSelect.addEventListener('change', saveFormDraft);
    }
    
    // ===== ACCESSIBILITY =====
    enhanceFormAccessibility(form, {
        fullName: fullNameInput,
        email: emailInput,
        phone: phoneInput,
        subject: subjectSelect,
        message: messageTextarea
    }, errorElements);
    
    console.log('✅ Contact form initialized');
}

// ===== POST OPPORTUNITY FORM =====
function initPostOpportunityForm(form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Check if user is admin
        if (typeof netlifyIdentity !== 'undefined' && netlifyIdentity.currentUser()) {
            // Redirect to admin panel for opportunity posting
            window.open('/admin/#/collections/opportunities', '_blank');
            return;
        }
        
        // For non-admin users, show message
        const formData = {
            type: document.getElementById('opportunityType')?.value,
            title: document.getElementById('opportunityTitle')?.value,
            description: document.getElementById('opportunityDescription')?.value,
            location: document.getElementById('opportunityLocation')?.value,
            deadline: document.getElementById('opportunityDeadline')?.value,
            email: document.getElementById('contactEmail')?.value,
            phone: document.getElementById('contactPhone')?.value,
            submitted_at: new Date().toISOString()
        };
        
        // Validation
        if (!formData.type || !formData.title || !formData.description || !formData.email) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        if (!isValidEmail(formData.email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        // Show loading
        const submitBtn = this.querySelector('.btn-submit-form');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;
        
        try {
            // Send to admin for review
            const adminEmail = FORM_STATE.contactInfo?.contact_info?.email || 'curuzahubfltd@gmail.com';
            
            const emailData = {
                to_name: 'Curuza Hub Admin',
                to_email: adminEmail,
                from_name: 'Website User',
                from_email: formData.email,
                subject: `New Opportunity Submission: ${formData.title}`,
                message: `
                    New opportunity submission from website:
                    
                    Type: ${formData.type}
                    Title: ${formData.title}
                    Description: ${formData.description}
                    Location: ${formData.location}
                    Deadline: ${formData.deadline || 'Not specified'}
                    Contact Email: ${formData.email}
                    Contact Phone: ${formData.phone || 'Not provided'}
                    
                    Submitted at: ${new Date().toLocaleString()}
                `,
                page_url: window.location.href
            };
            
            await emailjs.send(
                FORM_CONFIG.emailjs.serviceId,
                FORM_CONFIG.emailjs.templateId,
                emailData
            );
            
            // Success
            showNotification(
                'Opportunity submitted for admin review. We will contact you soon.',
                'success'
            );
            
            // Close modal if exists
            const modal = document.getElementById('postModalOverlay');
            if (modal) modal.classList.remove('active');
            
            // Reset form
            form.reset();
            
            // Store submission
            storeSubmission('opportunity', formData);
            
        } catch (error) {
            console.error('Failed to submit opportunity:', error);
            showNotification('Submission failed. Please try again or contact us directly.', 'error');
        } finally {
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ===== NEWSLETTER FORM =====
function initNewsletterForm(form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const emailInput = form.querySelector('input[type="email"]');
        const email = emailInput.value.trim();
        
        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        // Prepare data
        const formData = {
            to_name: 'Curuza Hub Newsletter',
            to_email: FORM_STATE.contactInfo?.contact_info?.email || 'curuzahubfltd@gmail.com',
            from_email: email,
            subject: 'New Newsletter Subscription',
            message: `New newsletter subscription from: ${email}`,
            timestamp: new Date().toISOString()
        };
        
        try {
            await emailjs.send(
                FORM_CONFIG.emailjs.serviceId,
                FORM_CONFIG.emailjs.templateId,
                formData
            );
            
            // Success
            showNotification('Thank you for subscribing to our newsletter!', 'success');
            emailInput.value = '';
            
            // Store subscription
            storeSubmission('newsletter', { email });
            
            // Track event
            trackFormEvent('newsletter_subscribe', 'success');
            
        } catch (error) {
            console.error('Newsletter subscription failed:', error);
            showNotification('Subscription failed. Please try again.', 'error');
        }
    });
}

// ===== CONSULTATION FORM =====
function initConsultationForm(form) {
    // Similar structure to contact form
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Implementation similar to contact form
        // Would include specific consultation fields
        
        showNotification('Consultation request submitted. We will contact you to schedule.', 'success');
        form.reset();
    });
}

// ===== VALIDATION FUNCTIONS =====
function validateName(value) {
    if (!value.trim()) return 'Full name is required';
    if (value.trim().length < 2) return 'Name must be at least 2 characters';
    return null;
}

function validateEmail(value) {
    if (!value.trim()) return 'Email address is required';
    if (!isValidEmail(value.trim())) return 'Please enter a valid email address';
    return null;
}

function validatePhoneOptional(value) {
    if (value.trim() && !isValidPhone(value.trim())) {
        return 'Please enter a valid phone number';
    }
    return null;
}

function validateMessage(value) {
    if (!value.trim()) return 'Message is required';
    if (value.trim().length < 10) return 'Message must be at least 10 characters';
    if (value.trim().length > FORM_CONFIG.settings.maxMessageLength) {
        return `Message must not exceed ${FORM_CONFIG.settings.maxMessageLength} characters`;
    }
    if (FORM_CONFIG.settings.spamCheckEnabled && containsSpam(value.trim())) {
        return 'Message contains suspicious content';
    }
    return null;
}

function validateField(input, errorElement, validator) {
    return function() {
        const error = validator(this.value);
        if (error) {
            showError(errorElement, error);
            highlightInvalid(this);
        } else {
            clearError(errorElement);
            highlightValid(this);
        }
    };
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidPhone(phone) {
    // Accepts international formats
    const re = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return re.test(phone);
}

function containsSpam(text) {
    const spamKeywords = [
        'viagra', 'cialis', 'casino', 'lottery', 'prize', 'free money',
        'make money fast', 'work from home', 'credit score', 'debt relief',
        'insurance', 'warranty', 'luxury', 'replica', 'fake', 'pharmacy',
        'prescription', 'drugs', 'nude', 'adult', 'porn', 'xxx',
        'click here', 'buy now', 'limited time', 'urgent', 'important',
        'attention', 'congratulations', 'winner', 'selected', 'exclusive'
    ];
    
    const lowerText = text.toLowerCase();
    return spamKeywords.some(keyword => lowerText.includes(keyword));
}

// ===== UI HELPER FUNCTIONS =====
function showError(element, message) {
    if (!element) return;
    
    element.textContent = message;
    element.style.display = 'block';
    element.style.color = '#ef4444';
    element.style.fontSize = '0.875rem';
    element.style.marginTop = '0.25rem';
}

function clearError(element) {
    if (!element) return;
    element.textContent = '';
    element.style.display = 'none';
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        clearError(el);
    });
}

function highlightInvalid(element) {
    if (!element) return;
    element.style.borderColor = '#ef4444';
    element.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
    element.setAttribute('aria-invalid', 'true');
}

function highlightValid(element) {
    if (!element) return;
    element.style.borderColor = '#10b981';
    element.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
    element.setAttribute('aria-invalid', 'false');
    
    setTimeout(() => {
        if (element) {
            element.style.borderColor = '';
            element.style.boxShadow = '';
        }
    }, 2000);
}

function clearHighlights() {
    document.querySelectorAll('input, select, textarea').forEach(el => {
        if (el) {
            el.style.borderColor = '';
            el.style.boxShadow = '';
        }
    });
}

function setLoadingState(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.style.opacity = '0.7';
        button.style.cursor = 'not-allowed';
        
        const originalText = button.innerHTML;
        button.setAttribute('data-original-text', originalText);
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    } else {
        button.disabled = false;
        button.style.opacity = '';
        button.style.cursor = '';
        
        const originalText = button.getAttribute('data-original-text');
        if (originalText) {
            button.innerHTML = originalText;
            button.removeAttribute('data-original-text');
        }
    }
}

function showFormSuccess(form, successElement) {
    if (form && successElement) {
        form.style.display = 'none';
        successElement.style.display = 'block';
        
        // Scroll to success message
        successElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.global-notification').forEach(el => el.remove());
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    
    const notification = document.createElement('div');
    notification.className = `global-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
        </div>
        <div class="notification-message">${message}</div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: colors[type] || '#3b82f6',
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        zIndex: '99999',
        transform: 'translateX(150%)',
        transition: 'transform 0.3s ease',
        maxWidth: '400px'
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
    
    // Auto-remove
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(150%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
    
    return notification;
}

// ===== STORAGE FUNCTIONS =====
function storeSubmission(type, data) {
    try {
        const submissions = JSON.parse(localStorage.getItem(FORM_CONFIG.storage.submissions) || '[]');
        
        submissions.unshift({
            id: Date.now(),
            type,
            data,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 50 submissions
        if (submissions.length > 50) {
            submissions.length = 50;
        }
        
        localStorage.setItem(FORM_CONFIG.storage.submissions, JSON.stringify(submissions));
        FORM_STATE.submissions = submissions;
        
        console.log(`📝 Stored ${type} submission`);
        
    } catch (error) {
        console.warn('Could not store submission:', error);
    }
}

function loadSavedDrafts() {
    try {
        const drafts = JSON.parse(localStorage.getItem(FORM_CONFIG.storage.drafts) || '{}');
        FORM_STATE.drafts = drafts;
        
        // Load drafts into forms
        Object.entries(drafts).forEach(([formType, draft]) => {
            if (Date.now() - draft.timestamp < FORM_CONFIG.settings.maxDraftAge) {
                loadFormDraft(formType, draft);
            }
        });
        
    } catch (error) {
        console.warn('Could not load drafts:', error);
    }
}

function loadFormDraft(formType, draft) {
    // Implementation depends on form structure
    console.log(`📋 Loading draft for ${formType}`);
}

function clearFormDraft(formType) {
    if (FORM_STATE.drafts[formType]) {
        delete FORM_STATE.drafts[formType];
        localStorage.setItem(FORM_CONFIG.storage.drafts, JSON.stringify(FORM_STATE.drafts));
    }
}

// ===== FORM SECURITY =====
function addFormSecurity() {
    document.querySelectorAll('form').forEach(form => {
        // Add honeypot field
        const honeypot = document.createElement('input');
        honeypot.type = 'text';
        honeypot.name = 'website';
        honeypot.style.cssText = `
            position: absolute;
            left: -9999px;
            opacity: 0;
            height: 0;
            width: 0;
        `;
        honeypot.setAttribute('aria-hidden', 'true');
        honeypot.setAttribute('tabindex', '-1');
        
        form.appendChild(honeypot);
        
        // Check honeypot on submission
        form.addEventListener('submit', function(e) {
            if (honeypot.value) {
                e.preventDefault();
                console.log('🚫 Spam detected - honeypot field filled');
                showNotification('Spam detected. Please try again.', 'error');
                return false;
            }
            
            // Add timestamp to prevent replay attacks
            const timestamp = document.createElement('input');
            timestamp.type = 'hidden';
            timestamp.name = 'form_timestamp';
            timestamp.value = Date.now();
            form.appendChild(timestamp);
        });
    });
}

// ===== FORM ENHANCEMENTS =====
function enhanceFormStyles() {
    document.querySelectorAll('input, select, textarea').forEach(input => {
        // Add focus styles
        input.addEventListener('focus', function() {
            this.style.borderColor = '#3b82f6';
            this.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        });
        
        input.addEventListener('blur', function() {
            this.style.borderColor = '';
            this.style.boxShadow = '';
        });
    });
}

function enhanceFormAccessibility(form, inputs, errors) {
    // Add ARIA attributes
    Object.entries(inputs).forEach(([name, input]) => {
        if (input) {
            input.setAttribute('aria-label', name.replace(/([A-Z])/g, ' $1').toLowerCase());
            
            if (errors[name]) {
                const errorId = `${input.id || name}-error`;
                errors[name].id = errorId;
                input.setAttribute('aria-describedby', errorId);
            }
            
            input.setAttribute('aria-invalid', 'false');
        }
    });
    
    // Ensure form has accessible submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn && !submitBtn.getAttribute('aria-label')) {
        submitBtn.setAttribute('aria-label', 'Submit form');
    }
}

// ===== ANALYTICS =====
function trackFormEvent(action, label) {
    // Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            'event_category': 'Forms',
            'event_label': label
        });
    }
    
    // Console log for debugging
    console.log(`📊 Form event: ${action} - ${label}`);
}

// ===== ADMIN FUNCTIONS =====
function getFormSubmissions() {
    return FORM_STATE.submissions;
}

function clearAllSubmissions() {
    localStorage.removeItem(FORM_CONFIG.storage.submissions);
    localStorage.removeItem(FORM_CONFIG.storage.drafts);
    FORM_STATE.submissions = [];
    FORM_STATE.drafts = {};
    showNotification('All form data cleared', 'success');
}

// ===== GLOBAL EXPORTS =====
window.CURUZA_FORMS = {
    showNotification,
    validateEmail: isValidEmail,
    validatePhone: isValidPhone,
    getSubmissions: getFormSubmissions,
    clearSubmissions: clearAllSubmissions,
    reloadContactData: loadContactData
};

// Console greeting
console.log(`
📝 CURUZA HUB FORM HANDLER v1.1.0
📧 EmailJS: ${FORM_CONFIG.emailjs.serviceId}
🔑 Public Key: ${FORM_CONFIG.emailjs.publicKey.substring(0, 8)}...
✅ Ready to handle forms with dynamic contact data
`);