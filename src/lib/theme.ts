// MedSync Theme Utility - Consistent Styling Across Components
export const medSyncTheme = {
  // Primary gradient for main actions
  gradientPrimary: 'bg-gradient-to-r from-[#1795d4] to-[#1ec98b] text-white font-semibold shadow-sm hover:from-[#1ec98b] hover:to-[#1795d4] focus:ring-2 focus:ring-blue-400 focus:outline-none transition-colors duration-200',
  
  // Medical gradient utility class
  medicalGradient: 'medical-gradient text-white hover:opacity-90 transition-opacity',
  
  // Button variants with consistent hover states
  buttons: {
    primary: 'medical-gradient text-white hover:opacity-90 transition-opacity',
    secondary: 'variant="outline" hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors',
    success: 'variant="outline" hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors',
    warning: 'variant="outline" hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-300 transition-colors',
    danger: 'variant="outline" hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors',
    info: 'variant="outline" hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors',
    purple: 'variant="outline" hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 transition-colors',
    orange: 'variant="outline" hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors',
  },
  
  // Consistent button heights for dashboard actions
  dashboardButton: 'h-16 flex flex-col items-center justify-center',
  tallButton: 'h-20 flex flex-col items-center justify-center',
  
  // Modal responsive sizing
  modal: {
    small: 'max-w-lg w-[95vw] sm:w-full mx-4',
    medium: 'max-w-2xl w-[95vw] sm:w-full mx-4',
    large: 'max-w-4xl w-[95vw] sm:w-full mx-4',
    extraLarge: 'max-w-6xl w-[95vw] sm:w-full mx-4',
    fullScreen: 'w-[95vw] sm:w-full max-w-6xl p-2 sm:p-6 max-h-[90vh] overflow-y-auto flex flex-col mx-4'
  },
  
  // Role-based color coding for AI assistants
  aiColors: {
    patient: 'text-blue-600 border-blue-200 hover:border-blue-300',
    doctor: 'text-green-600 border-green-200 hover:border-green-300',
    admin: 'text-purple-600 border-purple-200 hover:border-purple-300',
    receptionist: 'text-orange-600 border-orange-200 hover:border-orange-300',
    pharmacy: 'text-teal-600 border-teal-200 hover:border-teal-300'
  },
  
  // Stats card color coding
  statsColors: {
    primary: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-blue-600',
    purple: 'text-purple-600'
  },
  
  // Form styling
  form: {
    input: 'w-full rounded border px-2 py-2',
    label: 'block text-sm font-medium mb-1',
    error: 'text-red-500 text-sm',
    success: 'text-green-600 text-sm'
  }
};

// Helper functions for consistent styling
export const getButtonClass = (variant: keyof typeof medSyncTheme.buttons) => {
  return medSyncTheme.buttons[variant] || medSyncTheme.buttons.secondary;
};

export const getModalClass = (size: keyof typeof medSyncTheme.modal) => {
  return medSyncTheme.modal[size] || medSyncTheme.modal.medium;
};

export const getAIButtonClass = (role: keyof typeof medSyncTheme.aiColors) => {
  return `hover:bg-${role === 'patient' ? 'blue' : role === 'doctor' ? 'green' : role === 'admin' ? 'purple' : role === 'receptionist' ? 'orange' : 'teal'}-50 ${medSyncTheme.aiColors[role]}`;
};

// Medical color palette
export const medicalColors = {
  blue: '#1795d4',     // Primary medical blue
  green: '#1ec98b',    // Medical green
  lightBlue: '#f0f9ff', // Light blue background
  gray: '#f8fafc',     // Light gray background
  success: '#10b981',  // Success green
  warning: '#f59e0b',  // Warning amber
  error: '#ef4444',    // Error red
  info: '#3b82f6'      // Info blue
};
