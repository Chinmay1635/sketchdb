/**
 * Toast Notification Utility
 * Centralized toast notifications for consistent UX
 */

import toast, { Toaster } from 'react-hot-toast';

// Toast configuration
export const toastConfig = {
  // Default options
  duration: 4000,
  position: 'bottom-right' as const,
  
  // Style configuration
  style: {
    background: '#1f2937',
    color: '#f3f4f6',
    borderRadius: '8px',
    border: '1px solid #374151',
    padding: '12px 16px',
    fontSize: '14px',
    maxWidth: '400px',
  },
  
  // Success style
  success: {
    duration: 3000,
    iconTheme: {
      primary: '#10b981',
      secondary: '#f3f4f6',
    },
  },
  
  // Error style
  error: {
    duration: 5000,
    iconTheme: {
      primary: '#ef4444',
      secondary: '#f3f4f6',
    },
  },
};

// ============================================
// COLLABORATION NOTIFICATIONS
// ============================================

export const collaborationToasts = {
  userJoined: (username: string) => {
    toast.success(`${username} joined the diagram`, {
      icon: '👋',
      duration: 3000,
    });
  },
  
  userLeft: (username: string) => {
    toast(`${username} left the diagram`, {
      icon: '👤',
      duration: 3000,
    });
  },
  
  connected: () => {
    toast.success('Connected to collaboration server', {
      icon: '',
      duration: 2000,
    });
  },
  
  disconnected: () => {
    toast.error('Disconnected from collaboration server', {
      icon: '',
      duration: 4000,
    });
  },
  
  reconnecting: () => {
    toast.loading('Reconnecting to collaboration server...', {
      id: 'reconnecting',
    });
  },
  
  reconnected: () => {
    toast.dismiss('reconnecting');
    toast.success('Reconnected successfully!', {
      icon: '',
      duration: 2000,
    });
  },
  
  connectionError: (message: string) => {
    toast.error(`Connection error: ${message}`, {
      duration: 5000,
    });
  },
  
  roomFull: () => {
    toast.error('This diagram has reached the maximum number of collaborators (10)', {
      duration: 5000,
      icon: '',
    });
  },
  
  accessDenied: () => {
    toast.error('Access denied to this diagram', {
      duration: 4000,
      icon: '',
    });
  },
};

// ============================================
// DIAGRAM NOTIFICATIONS
// ============================================

export const diagramToasts = {
  saved: (name?: string) => {
    toast.success(name ? `"${name}" saved successfully` : 'Diagram saved successfully', {
      icon: '',
      duration: 2000,
    });
  },
  
  saveError: (message?: string) => {
    toast.error(message || 'Failed to save diagram. Please try again.', {
      duration: 4000,
    });
  },
  
  saving: () => {
    return toast.loading('Saving diagram...', {
      id: 'saving-diagram',
    });
  },
  
  savingComplete: () => {
    toast.dismiss('saving-diagram');
  },
  
  loaded: (name: string) => {
    toast.success(`"${name}" loaded successfully`, {
      icon: '',
      duration: 2000,
    });
  },
  
  loadError: (message?: string) => {
    toast.error(message || 'Failed to load diagram', {
      duration: 4000,
    });
  },
  
  deleted: (name?: string) => {
    toast.success(name ? `"${name}" deleted` : 'Diagram deleted', {
      icon: '',
      duration: 2000,
    });
  },
  
  deleteError: (message?: string) => {
    toast.error(message || 'Failed to delete diagram', {
      duration: 4000,
    });
  },
  
  notFound: () => {
    toast.error('Diagram not found', {
      icon: '',
      duration: 4000,
    });
  },
  
  permissionDenied: () => {
    toast.error('You do not have permission to view this diagram', {
      icon: '',
      duration: 4000,
    });
  },
  
  created: (name: string) => {
    toast.success(`"${name}" created successfully`, {
      icon: '',
      duration: 2000,
    });
  },
};

// ============================================
// IMPORT/EXPORT NOTIFICATIONS
// ============================================

export const importExportToasts = {
  importSuccess: (tableCount: number) => {
    toast.success(`Imported ${tableCount} table${tableCount !== 1 ? 's' : ''} successfully`, {
      icon: '',
      duration: 3000,
    });
  },
  
  importError: (message?: string) => {
    toast.error(message || 'Failed to import schema', {
      duration: 5000,
    });
  },
  
  exportPNGSuccess: () => {
    toast.success('Diagram exported as PNG', {
      icon: '',
      duration: 2000,
    });
  },
  
  exportPDFSuccess: () => {
    toast.success('Diagram exported as PDF', {
      icon: '',
      duration: 2000,
    });
  },
  
  exportSQLSuccess: () => {
    toast.success('SQL file downloaded', {
      icon: '',
      duration: 2000,
    });
  },
  
  exportError: (format: string, message?: string) => {
    toast.error(message || `Failed to export as ${format}`, {
      duration: 4000,
    });
  },
  
  sqlCopied: () => {
    toast.success('SQL copied to clipboard', {
      icon: '',
      duration: 2000,
    });
  },
};

// ============================================
// AI ASSISTANT NOTIFICATIONS
// ============================================

export const aiToasts = {
  schemaApplied: (tableCount: number) => {
    toast.success(`AI schema applied: ${tableCount} table${tableCount !== 1 ? 's' : ''} created`, {
      icon: '',
      duration: 3000,
    });
  },
  
  schemaError: (message?: string) => {
    toast.error(message || 'Failed to apply AI schema', {
      duration: 4000,
    });
  },
  
  generating: () => {
    return toast.loading('AI is generating your schema...', {
      id: 'ai-generating',
    });
  },
  
  generatingComplete: () => {
    toast.dismiss('ai-generating');
  },
  
  rateLimited: (waitTime: number) => {
    toast.error(`Rate limit reached. Please wait ${waitTime} seconds.`, {
      icon: '',
      duration: 5000,
    });
  },
  
  configError: () => {
    toast.error('AI service is not configured. Please contact the administrator.', {
      duration: 5000,
    });
  },
};

// ============================================
// SHARE NOTIFICATIONS
// ============================================

export const shareToasts = {
  linkCopied: () => {
    toast.success('Share link copied to clipboard', {
      icon: '',
      duration: 2000,
    });
  },
  
  collaboratorAdded: (email: string, permission: string) => {
    toast.success(`Invited ${email} with ${permission} access`, {
      icon: '',
      duration: 3000,
    });
  },
  
  collaboratorRemoved: (email: string) => {
    toast.success(`Removed ${email} from collaborators`, {
      icon: '',
      duration: 2000,
    });
  },
  
  collaboratorUpdated: (email: string, permission: string) => {
    toast.success(`Updated ${email} to ${permission} access`, {
      icon: '',
      duration: 2000,
    });
  },
  
  visibilityChanged: (isPublic: boolean) => {
    toast.success(isPublic ? 'Diagram is now public' : 'Diagram is now private', {
      icon: isPublic ? '🌐' : '🔒',
      duration: 2000,
    });
  },
  
  permissionUpdated: (username: string, permission: string) => {
    toast.success(`Updated ${username}'s permission to ${permission}`, {
      icon: '',
      duration: 2000,
    });
  },
  
  shareError: (message?: string) => {
    toast.error(message || 'Failed to update sharing settings', {
      duration: 4000,
    });
  },
};

// ============================================
// AUTH NOTIFICATIONS
// ============================================

export const authToasts = {
  loginSuccess: (username: string) => {
    toast.success(`Welcome back, ${username}!`, {
      icon: '',
      duration: 3000,
    });
  },
  
  loginError: (message?: string) => {
    toast.error(message || 'Login failed. Please check your credentials.', {
      duration: 4000,
    });
  },
  
  signupSuccess: () => {
    toast.success('Account created successfully!', {
      icon: '',
      duration: 3000,
    });
  },
  
  signupError: (message?: string) => {
    toast.error(message || 'Signup failed. Please try again.', {
      duration: 4000,
    });
  },
  
  logoutSuccess: () => {
    toast.success('Logged out successfully', {
      icon: '',
      duration: 2000,
    });
  },
  
  sessionExpired: () => {
    toast.error('Session expired. Please log in again.', {
      icon: '',
      duration: 4000,
    });
  },
  
  otpSent: (email: string) => {
    toast.success(`Verification code sent to ${email}`, {
      icon: '',
      duration: 3000,
    });
  },
  
  otpError: (message?: string) => {
    toast.error(message || 'Failed to send verification code', {
      duration: 4000,
    });
  },
  
  otpVerified: () => {
    toast.success('Email verified! Welcome aboard!', {
      icon: '',
      duration: 3000,
    });
  },
  
  verificationSuccess: () => {
    toast.success('Email verified successfully!', {
      icon: '',
      duration: 3000,
    });
  },
};

// ============================================
// TABLE OPERATIONS NOTIFICATIONS
// ============================================

export const tableToasts = {
  created: (name?: string) => {
    toast.success(name ? `Table "${name}" created` : 'New table created', {
      icon: '',
      duration: 2000,
    });
  },
  
  deleted: (name?: string) => {
    toast.success(name ? `Table "${name}" deleted` : 'Table deleted', {
      icon: '',
      duration: 2000,
    });
  },
  
  attributeAdded: () => {
    toast.success('Attribute added', {
      icon: '',
      duration: 1500,
    });
  },
  
  attributeDeleted: () => {
    toast.success('Attribute deleted', {
      icon: '',
      duration: 1500,
    });
  },
  
  connectionCreated: () => {
    toast.success('Foreign key relationship created', {
      icon: '',
      duration: 2000,
    });
  },
  
  validationError: (message: string) => {
    toast.error(message, {
      duration: 4000,
    });
  },
};

// ============================================
// GENERAL NOTIFICATIONS
// ============================================

export const generalToasts = {
  info: (message: string) => {
    toast(message, {
      icon: '',
      duration: 3000,
    });
  },
  
  success: (message: string) => {
    toast.success(message, {
      duration: 3000,
    });
  },
  
  error: (message: string) => {
    toast.error(message, {
      duration: 4000,
    });
  },
  
  warning: (message: string) => {
    toast(message, {
      icon: '',
      duration: 4000,
      style: {
        ...toastConfig.style,
        borderColor: '#f59e0b',
      },
    });
  },
  
  loading: (message: string, id?: string) => {
    return toast.loading(message, { id });
  },
  
  dismiss: (id?: string) => {
    if (id) {
      toast.dismiss(id);
    } else {
      toast.dismiss();
    }
  },
  
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  },
};

// Export the Toaster component and base toast for custom usage
export { Toaster, toast };
