import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Etiquetas legibles
export const planLabels = {
  basico_30mbps: 'Básico 30 Mbps',
  estandar_60mbps: 'Estándar 60 Mbps',
  premium_100mbps: 'Premium 100 Mbps',
  empresarial_200mbps: 'Empresarial 200 Mbps',
};

export const typeLabels = {
  nueva_instalacion: 'Nueva Instalación',
  instalacion: 'Instalación',
  soporte: 'Soporte',
  mantenimiento: 'Mantenimiento',
  retiro: 'Retiro',
};

export const orderTypeOptions = [
  { value: 'nueva_instalacion', label: typeLabels.nueva_instalacion },
  { value: 'instalacion', label: typeLabels.instalacion },
  { value: 'soporte', label: typeLabels.soporte },
  { value: 'mantenimiento', label: typeLabels.mantenimiento },
  { value: 'retiro', label: typeLabels.retiro },
];

export const categoryLabels = {
  sin_servicio: 'Sin Servicio',
  lentitud: 'Lentitud',
  corte_fibra: 'Corte de Fibra',
  equipo_danado: 'Equipo Dañado',
  configuracion: 'Configuración',
  otro: 'Otro',
};

export const incidentCategoryOptions = [
  { value: 'sin_servicio', label: categoryLabels.sin_servicio },
  { value: 'lentitud', label: categoryLabels.lentitud },
  { value: 'corte_fibra', label: categoryLabels.corte_fibra },
  { value: 'equipo_danado', label: categoryLabels.equipo_danado },
  { value: 'configuracion', label: categoryLabels.configuracion },
  { value: 'otro', label: categoryLabels.otro },
];

export const specialtyLabels = {
  instalacion: 'Instalación',
  soporte: 'Soporte',
  mantenimiento: 'Mantenimiento',
  fibra_optica: 'Fibra Óptica',
};

export const statusLabels = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  completado: 'Completado',
  cancelado: 'Cancelado',
  activo: 'Activo',
  suspendido: 'Suspendido',
  retirado: 'Retirado',
  disponible: 'Disponible',
  en_campo: 'En Campo',
  no_disponible: 'No Disponible',
  abierta: 'Abierta',
  en_atencion: 'En Atención',
  resuelta: 'Resuelta',
  cerrada: 'Cerrada',
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente',
  critica: 'Crítica',
};

export function getInitials(name = '') {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function formatDate(date) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch { return date; }
}

export function formatDateTime(date) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return date; }
}
