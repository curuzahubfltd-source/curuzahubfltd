// netlify/functions/check-role.js
exports.handler = async function(event, context) {
    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
    // Check if user is authenticated via Netlify Identity
    const user = context.clientContext?.user;
    
    if (!user) {
        return {
            statusCode: 401,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                error: 'Not authenticated',
                message: 'Please log in to access this resource'
            })
        };
    }
    
    try {
        // Get user role from metadata
        // Netlify Identity stores custom data in user_metadata
        const userMetadata = user.user_metadata || {};
        
        // Default role is 'editor' if not specified
        const userRole = userMetadata.role || 'editor';
        const isAdmin = userRole === 'admin';
        const isEditor = userRole === 'editor' || isAdmin;
        
        // Prepare user information
        const userInfo = {
            email: user.email,
            name: userMetadata.full_name || user.email.split('@')[0],
            role: userRole,
            isAdmin: isAdmin,
            isEditor: isEditor,
            metadata: userMetadata,
            app_metadata: user.app_metadata || {}
        };
        
        // Log the request (optional, for debugging)
        console.log('Role check for:', user.email, 'Role:', userRole);
        
        // Return user information with role
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                message: 'Role retrieved successfully',
                user: userInfo,
                permissions: {
                    can_edit: isEditor,
                    can_delete: isAdmin,
                    can_manage_users: isAdmin,
                    can_publish: isEditor,
                    can_upload: isEditor
                },
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        console.error('Error in check-role function:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};