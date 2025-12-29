/* ============================================
   CURUZA HUB F LTD - FIREBASE CONFIGURATION
   Optional Backend Integration for Future Features
   Version: 1.0.0 (Optional - Not Required for Netlify CMS)
   ============================================ */

// Firebase Configuration for CURUZA HUB F LTD
// ⚠️ IMPORTANT: This is OPTIONAL and only needed if you want to add
// Firebase features later. Netlify CMS + JSON files are sufficient.

const FIREBASE_CONFIG = {
    // ⚠️ REPLACE WITH YOUR ACTUAL FIREBASE CONFIG
    apiKey: "AIzaSyCURUZA_HUB_F_LTD_API_KEY",
    authDomain: "curuza-hub-f-ltd.firebaseapp.com",
    projectId: "curuza-hub-f-ltd",
    storageBucket: "curuza-hub-f-ltd.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:curuza_hub_f_ltd_app_id",
    measurementId: "G-CURUZAHUB"
};

// Check if Firebase is available
let firebaseInitialized = false;
let db = null;
let storage = null;
let auth = null;

// Initialize Firebase (only if needed)
function initializeFirebase() {
    if (typeof firebase === 'undefined') {
        console.warn('⚠️ Firebase is not loaded. Skipping initialization.');
        return false;
    }
    
    try {
        // Check if already initialized
        if (firebase.apps.length === 0) {
            firebase.initializeApp(FIREBASE_CONFIG);
            console.log('✅ Firebase initialized successfully');
        } else {
            console.log('✅ Firebase already initialized');
        }
        
        // Initialize services
        db = firebase.firestore();
        storage = firebase.storage();
        auth = firebase.auth();
        
        // Enable offline persistence for Firestore
        if (db) {
            db.enablePersistence()
                .catch((err) => {
                    console.warn('Firestore persistence failed:', err.code);
                });
        }
        
        firebaseInitialized = true;
        return true;
        
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        return false;
    }
}

// ===== FIRESTORE FUNCTIONS =====
// These functions are optional and provide enhanced features

// Save contact form submission to Firestore
async function saveContactToFirestore(formData) {
    if (!firebaseInitialized) {
        console.warn('Firebase not initialized. Using fallback storage.');
        return saveToLocalStorage('contact_submissions', formData);
    }
    
    try {
        const docRef = await db.collection('contactSubmissions').add({
            ...formData,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'new',
            source: 'website_form',
            ipAddress: await getClientIP(),
            userAgent: navigator.userAgent
        });
        
        console.log('✅ Contact saved to Firestore with ID:', docRef.id);
        return { success: true, id: docRef.id };
        
    } catch (error) {
        console.error('❌ Failed to save contact to Firestore:', error);
        // Fallback to localStorage
        return saveToLocalStorage('contact_submissions', formData);
    }
}

// Save opportunity submission to Firestore
async function saveOpportunityToFirestore(opportunityData) {
    if (!firebaseInitialized) {
        console.warn('Firebase not initialized. Using fallback storage.');
        return saveToLocalStorage('opportunity_submissions', opportunityData);
    }
    
    try {
        const docRef = await db.collection('opportunitySubmissions').add({
            ...opportunityData,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pending_review',
            reviewed: false,
            source: 'website_form'
        });
        
        console.log('✅ Opportunity saved to Firestore with ID:', docRef.id);
        return { success: true, id: docRef.id };
        
    } catch (error) {
        console.error('❌ Failed to save opportunity to Firestore:', error);
        // Fallback to localStorage
        return saveToLocalStorage('opportunity_submissions', opportunityData);
    }
}

// Get active opportunities from Firestore
async function getOpportunitiesFromFirestore(filters = {}) {
    if (!firebaseInitialized) {
        console.warn('Firebase not initialized. Using JSON data.');
        return { success: false, data: null };
    }
    
    try {
        let query = db.collection('opportunities')
            .where('active', '==', true)
            .where('status', '==', 'active');
        
        // Apply filters
        if (filters.type) {
            query = query.where('type', '==', filters.type);
        }
        
        if (filters.location) {
            query = query.where('location', '==', filters.location);
        }
        
        // Order and limit
        query = query.orderBy('createdAt', 'desc').limit(filters.limit || 20);
        
        const snapshot = await query.get();
        const opportunities = [];
        
        snapshot.forEach(doc => {
            opportunities.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ Loaded ${opportunities.length} opportunities from Firestore`);
        return { success: true, data: opportunities };
        
    } catch (error) {
        console.error('❌ Failed to get opportunities from Firestore:', error);
        return { success: false, error: error.message };
    }
}

// Get services from Firestore
async function getServicesFromFirestore() {
    if (!firebaseInitialized) {
        console.warn('Firebase not initialized. Using JSON data.');
        return { success: false, data: null };
    }
    
    try {
        const snapshot = await db.collection('services')
            .where('active', '==', true)
            .orderBy('order', 'asc')
            .get();
        
        const services = [];
        snapshot.forEach(doc => {
            services.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ Loaded ${services.length} services from Firestore`);
        return { success: true, data: services };
        
    } catch (error) {
        console.error('❌ Failed to get services from Firestore:', error);
        return { success: false, error: error.message };
    }
}

// ===== AUTHENTICATION FUNCTIONS =====
// Enhanced authentication for admin panel

async function loginWithEmail(email, password) {
    if (!firebaseInitialized) {
        console.warn('Firebase not initialized. Using Netlify Identity.');
        return { success: false, message: 'Use Netlify Identity for login' };
    }
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Get user role from Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        
        return {
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                role: userData?.role || 'user',
                name: userData?.name || user.email
            }
        };
        
    } catch (error) {
        console.error('❌ Login failed:', error);
        return {
            success: false,
            error: error.code,
            message: getFirebaseErrorMessage(error.code)
        };
    }
}

async function logout() {
    if (!firebaseInitialized) return;
    
    try {
        await auth.signOut();
        console.log('✅ User logged out');
        return { success: true };
    } catch (error) {
        console.error('❌ Logout failed:', error);
        return { success: false, error: error.message };
    }
}

// Check current user
function getCurrentUser() {
    if (!firebaseInitialized) return null;
    return auth.currentUser;
}

// ===== STORAGE FUNCTIONS =====
// For file uploads (opportunity images, documents, etc.)

async function uploadFile(file, path) {
    if (!firebaseInitialized) {
        console.warn('Firebase not initialized. Cannot upload file.');
        return { success: false, message: 'Firebase not available' };
    }
    
    try {
        const storageRef = storage.ref();
        const fileRef = storageRef.child(`${path}/${Date.now()}_${file.name}`);
        
        const snapshot = await fileRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        
        return {
            success: true,
            url: downloadURL,
            path: snapshot.ref.fullPath,
            name: file.name,
            size: file.size,
            type: file.type
        };
        
    } catch (error) {
        console.error('❌ File upload failed:', error);
        return {
            success: false,
            error: error.code,
            message: getFirebaseErrorMessage(error.code)
        };
    }
}

// ===== ANALYTICS FUNCTIONS =====
async function logEvent(eventName, eventData = {}) {
    if (!firebaseInitialized) return;
    
    try {
        if (typeof firebase.analytics !== 'undefined') {
            firebase.analytics().logEvent(eventName, eventData);
        }
        
        // Also log to Firestore for custom analytics
        await db.collection('analytics').add({
            event: eventName,
            data: eventData,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            page: window.location.pathname,
            userAgent: navigator.userAgent
        });
        
    } catch (error) {
        console.warn('Analytics logging failed:', error);
    }
}

// ===== HELPER FUNCTIONS =====
function getFirebaseErrorMessage(code) {
    const messages = {
        'auth/invalid-email': 'Invalid email address',
        'auth/user-disabled': 'This account has been disabled',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'Email already in use',
        'auth/weak-password': 'Password is too weak',
        'permission-denied': 'You do not have permission to perform this action',
        'unavailable': 'Service is temporarily unavailable'
    };
    
    return messages[code] || 'An error occurred. Please try again.';
}

async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.warn('Could not get client IP:', error);
        return 'unknown';
    }
}

function saveToLocalStorage(key, data) {
    try {
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push({
            ...data,
            timestamp: new Date().toISOString(),
            id: Date.now()
        });
        
        localStorage.setItem(key, JSON.stringify(existing));
        return { success: true, storage: 'local' };
        
    } catch (error) {
        console.error('Local storage save failed:', error);
        return { success: false, error: error.message };
    }
}

// ===== ADMIN FUNCTIONS =====
// Functions for admin panel

async function getAllSubmissions(collection) {
    if (!firebaseInitialized) {
        // Get from localStorage
        const data = localStorage.getItem(`${collection}_submissions`);
        return {
            success: true,
            data: data ? JSON.parse(data) : [],
            source: 'localStorage'
        };
    }
    
    try {
        const snapshot = await db.collection(collection).get();
        const submissions = [];
        
        snapshot.forEach(doc => {
            submissions.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return {
            success: true,
            data: submissions,
            source: 'firestore'
        };
        
    } catch (error) {
        console.error(`Failed to get ${collection}:`, error);
        return { success: false, error: error.message };
    }
}

async function updateSubmissionStatus(collection, docId, status) {
    if (!firebaseInitialized) {
        console.warn('Firebase not initialized. Cannot update status.');
        return { success: false, message: 'Firebase not available' };
    }
    
    try {
        await db.collection(collection).doc(docId).update({
            status: status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: auth.currentUser?.email || 'system'
        });
        
        return { success: true };
        
    } catch (error) {
        console.error('Status update failed:', error);
        return { success: false, error: error.message };
    }
}

// ===== INITIALIZATION =====
// Check if we should initialize Firebase
function shouldInitializeFirebase() {
    // Only initialize if we're on admin pages or if localStorage says we need it
    const isAdminPage = window.location.pathname.includes('/admin');
    const userPrefersFirebase = localStorage.getItem('use_firebase') === 'true';
    
    return isAdminPage || userPrefersFirebase;
}

// Initialize on demand
if (shouldInitializeFirebase()) {
    // Load Firebase SDKs dynamically
    const firebaseScripts = [
        'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
        'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js',
        'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js',
        'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js',
        'https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics-compat.js'
    ];
    
    let loadedCount = 0;
    
    firebaseScripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        
        script.onload = () => {
            loadedCount++;
            if (loadedCount === firebaseScripts.length) {
                // All Firebase SDKs loaded, initialize
                setTimeout(() => {
                    initializeFirebase();
                }, 100);
            }
        };
        
        document.head.appendChild(script);
    });
}

// ===== GLOBAL EXPORTS =====
window.CURUZA_FIREBASE = {
    // Initialization
    initialize: initializeFirebase,
    isInitialized: () => firebaseInitialized,
    
    // Data operations
    saveContact: saveContactToFirestore,
    saveOpportunity: saveOpportunityToFirestore,
    getOpportunities: getOpportunitiesFromFirestore,
    getServices: getServicesFromFirestore,
    
    // Authentication
    login: loginWithEmail,
    logout: logout,
    getCurrentUser: getCurrentUser,
    
    // File operations
    uploadFile: uploadFile,
    
    // Analytics
    logEvent: logEvent,
    
    // Admin functions
    getAllSubmissions: getAllSubmissions,
    updateStatus: updateSubmissionStatus,
    
    // Configuration
    config: FIREBASE_CONFIG
};

// Console message
console.log(`
🔥 CURUZA HUB FIREBASE MODULE v1.0.0
📊 Status: ${firebaseInitialized ? 'Initialized' : 'Standby (JSON Mode)'}
💡 Tip: Firebase is OPTIONAL. Netlify CMS + JSON files work perfectly.
🔧 To enable Firebase: 1. Create Firebase project 2. Update config above
`);
