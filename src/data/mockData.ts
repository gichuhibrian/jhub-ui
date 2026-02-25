import { User, Project, Task, ActivityItem } from '@/types';

export const seedUsers: User[] = [
  { id: 'u1', name: 'Sarah Chen', email: 'sarah@company.com', password: 'admin123', role: 'admin', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
  { id: 'u2', name: 'Marcus Rivera', email: 'marcus@company.com', password: 'admin123', role: 'admin', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus' },
  { id: 'ujohn', name: 'John Mwangi', email: 'johnmwangi1729@gmail.com', password: 'John001?', role: 'admin', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
  { id: 'u3', name: 'Emily Watson', email: 'emily@company.com', password: 'user123', role: 'user', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily' },
  { id: 'u4', name: 'James Park', email: 'james@company.com', password: 'user123', role: 'user', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James' },
  { id: 'u5', name: 'Aisha Patel', email: 'aisha@company.com', password: 'user123', role: 'user', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha' },
  { id: 'u6', name: 'Tom Bradley', email: 'tom@company.com', password: 'user123', role: 'user', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom' },
  { id: 'u7', name: 'Luna Kim', email: 'luna@company.com', password: 'user123', role: 'user', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna' },
  { id: 'u8', name: 'David Okonkwo', email: 'david@company.com', password: 'user123', role: 'user', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
];

export const seedProjects: Project[] = [
  {
    id: 'p1', name: 'E-Commerce Platform Redesign', description: 'Complete overhaul of the existing e-commerce platform with modern UI/UX, improved performance, and mobile-first responsive design. Includes new checkout flow, product pages, and admin panel.',
    status: 'in-progress', startDate: '2025-11-01', dueDate: '2026-04-30', isPublic: true,
    images: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800'],
    featuredImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    teamLeadId: 'u3', memberIds: ['u3', 'u4', 'u5', 'u6'],
  },
  {
    id: 'p2', name: 'Mobile Banking App', description: 'A secure, user-friendly mobile banking application featuring biometric authentication, real-time transaction tracking, bill payments, and financial insights dashboard.',
    status: 'in-progress', startDate: '2025-12-15', dueDate: '2026-06-30', isPublic: true,
    images: ['https://images.unsplash.com/photo-1563986768609-322da13575f2?w=800', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800'],
    featuredImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=800',
    teamLeadId: 'u4', memberIds: ['u4', 'u7', 'u8'],
  },
  {
    id: 'p3', name: 'Healthcare Patient Portal', description: 'HIPAA-compliant patient portal enabling appointment scheduling, medical records access, secure messaging with providers, and telehealth video consultations.',
    status: 'not-started', startDate: '2026-03-01', dueDate: '2026-09-30', isPublic: true,
    images: ['https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800'],
    featuredImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
    teamLeadId: 'u5', memberIds: ['u5', 'u6', 'u3'],
  },
  {
    id: 'p4', name: 'Internal Analytics Dashboard', description: 'Real-time business analytics dashboard with customizable widgets, data visualization, automated reporting, and team performance metrics.',
    status: 'completed', startDate: '2025-06-01', dueDate: '2025-12-31', isPublic: false,
    images: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800'],
    featuredImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
    teamLeadId: 'u7', memberIds: ['u7', 'u8'],
  },
  {
    id: 'p5', name: 'Smart Home IoT Platform', description: 'Centralized platform for managing smart home devices with automation rules, energy monitoring, voice control integration, and security features.',
    status: 'on-hold', startDate: '2025-09-15', dueDate: '2026-05-15', isPublic: true,
    images: ['https://images.unsplash.com/photo-1558002038-1055907df827?w=800'],
    featuredImage: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800',
    teamLeadId: 'u6', memberIds: ['u6', 'u3', 'u4'],
  },
];

export const seedTasks: Task[] = [
  // P1 tasks
  { id: 't1', projectId: 'p1', title: 'Design System Setup', description: 'Create comprehensive design system with tokens, components, and documentation', status: 'done', assignedMemberId: 'u3', dueDate: '2025-12-15', objectives: [
    { id: 'o1', title: 'Define color palette and typography', completed: true },
    { id: 'o2', title: 'Create component library in Figma', completed: true },
    { id: 'o3', title: 'Build reusable React components', completed: true },
    { id: 'o4', title: 'Write documentation', completed: true },
  ]},
  { id: 't2', projectId: 'p1', title: 'Product Listing Page', description: 'Build responsive product grid with filtering, sorting, and search functionality', status: 'in-progress', assignedMemberId: 'u4', dueDate: '2026-02-28', objectives: [
    { id: 'o5', title: 'Implement product grid layout', completed: true },
    { id: 'o6', title: 'Add filtering by category', completed: true },
    { id: 'o7', title: 'Add sorting options', completed: false },
    { id: 'o8', title: 'Implement search with autocomplete', completed: false },
    { id: 'o9', title: 'Add pagination', completed: false },
  ]},
  { id: 't3', projectId: 'p1', title: 'Checkout Flow', description: 'Multi-step checkout with cart, shipping, payment, and confirmation', status: 'todo', assignedMemberId: 'u5', dueDate: '2026-03-31', objectives: [
    { id: 'o10', title: 'Shopping cart component', completed: false },
    { id: 'o11', title: 'Shipping form with validation', completed: false },
    { id: 'o12', title: 'Payment integration UI', completed: false },
    { id: 'o13', title: 'Order confirmation page', completed: false },
  ]},
  { id: 't4', projectId: 'p1', title: 'Performance Optimization', description: 'Optimize load times, implement lazy loading, and reduce bundle size', status: 'todo', assignedMemberId: 'u6', dueDate: '2026-04-15', objectives: [
    { id: 'o14', title: 'Audit current performance', completed: false },
    { id: 'o15', title: 'Implement code splitting', completed: false },
    { id: 'o16', title: 'Optimize images', completed: false },
  ]},
  // P2 tasks
  { id: 't5', projectId: 'p2', title: 'Authentication Module', description: 'Implement biometric and PIN-based authentication with session management', status: 'in-progress', assignedMemberId: 'u4', dueDate: '2026-02-15', objectives: [
    { id: 'o17', title: 'Login screen UI', completed: true },
    { id: 'o18', title: 'Biometric integration', completed: true },
    { id: 'o19', title: 'PIN fallback', completed: false },
    { id: 'o20', title: 'Session management', completed: false },
  ]},
  { id: 't6', projectId: 'p2', title: 'Transaction Dashboard', description: 'Real-time transaction list with categorization and spending insights', status: 'todo', assignedMemberId: 'u7', dueDate: '2026-04-30', objectives: [
    { id: 'o21', title: 'Transaction list view', completed: false },
    { id: 'o22', title: 'Category filters', completed: false },
    { id: 'o23', title: 'Spending chart', completed: false },
  ]},
  { id: 't7', projectId: 'p2', title: 'Bill Payments', description: 'Bill payment scheduling and recurring payment management', status: 'todo', assignedMemberId: 'u8', dueDate: '2026-05-31', objectives: [
    { id: 'o24', title: 'Add payee form', completed: false },
    { id: 'o25', title: 'Payment scheduling', completed: false },
    { id: 'o26', title: 'Recurring payments setup', completed: false },
  ]},
  // P4 tasks
  { id: 't8', projectId: 'p4', title: 'Data Pipeline Setup', description: 'Configure data ingestion from multiple sources', status: 'done', assignedMemberId: 'u7', dueDate: '2025-09-30', objectives: [
    { id: 'o27', title: 'API connectors', completed: true },
    { id: 'o28', title: 'Data transformation', completed: true },
    { id: 'o29', title: 'Scheduled refreshes', completed: true },
  ]},
  { id: 't9', projectId: 'p4', title: 'Dashboard Widgets', description: 'Build customizable dashboard with drag-and-drop widgets', status: 'done', assignedMemberId: 'u8', dueDate: '2025-11-30', objectives: [
    { id: 'o30', title: 'Widget framework', completed: true },
    { id: 'o31', title: 'Chart widgets', completed: true },
    { id: 'o32', title: 'KPI cards', completed: true },
    { id: 'o33', title: 'Drag and drop layout', completed: true },
  ]},
  // P5 tasks
  { id: 't10', projectId: 'p5', title: 'Device Management API', description: 'REST API for device registration and control', status: 'in-progress', assignedMemberId: 'u6', dueDate: '2026-01-31', objectives: [
    { id: 'o34', title: 'Device registration endpoint', completed: true },
    { id: 'o35', title: 'Device control commands', completed: false },
    { id: 'o36', title: 'Status polling', completed: false },
  ]},
];

export const seedActivities: ActivityItem[] = [
  { id: 'a1', userId: 'u3', action: 'completed task', target: 'Design System Setup', timestamp: '2026-02-13T09:30:00Z' },
  { id: 'a2', userId: 'u4', action: 'updated progress on', target: 'Product Listing Page', timestamp: '2026-02-12T16:45:00Z' },
  { id: 'a3', userId: 'u1', action: 'created project', target: 'Healthcare Patient Portal', timestamp: '2026-02-12T10:00:00Z' },
  { id: 'a4', userId: 'u7', action: 'completed task', target: 'Dashboard Widgets', timestamp: '2026-02-11T14:20:00Z' },
  { id: 'a5', userId: 'u6', action: 'started working on', target: 'Device Management API', timestamp: '2026-02-10T11:00:00Z' },
  { id: 'a6', userId: 'u2', action: 'added user', target: 'David Okonkwo', timestamp: '2026-02-09T09:15:00Z' },
  { id: 'a7', userId: 'u5', action: 'was assigned to', target: 'Healthcare Patient Portal', timestamp: '2026-02-08T13:30:00Z' },
];
