import { ALL_PERMISSIONS, PERMISSION_LABELS } from './constants/permissions';

// Ensure print permission exists so roles can toggle it in UI
if (!ALL_PERMISSIONS.find((p) => p.id === 'print_requests')) {
  ALL_PERMISSIONS.push({ id: 'print_requests', name: 'Print requests', category: 'Requests' });
}

// Add labels (fallback English for both langs to avoid encoding issues)
(PERMISSION_LABELS as any)['print_requests'] = { ka: 'Print requests', en: 'Print requests' };

