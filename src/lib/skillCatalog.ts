import { leadingEmoji, stripEmoji } from './emoji';

export type CatalogNode = {
  id: number;
  libelle: string;
  image?: string | null;
  children?: CatalogNode[];
  has_children?: boolean;
};

export const normalizeLabel = (value: string) =>
  stripEmoji((value || '').toLowerCase());

const MATERIAL_ICON_EMOJI: Record<string, string> = {
  'icon:home_rounded': '🏠',
  'icon:build_rounded': '🔧',
  'icon:ac_unit_rounded': '❄️',
  'icon:cleaning_services_rounded': '🧹',
  'icon:chair_rounded': '🏡',
  'icon:grass_rounded': '🌿',
  'icon:security_rounded': '🔒',
  'icon:wifi_rounded': '💡',
  'icon:water_drop_rounded': '🚰',
  'icon:construction_rounded': '🏗️',
  'icon:chair_alt_rounded': '🛋️',
  'icon:pest_control_rounded': '🦟',
  'icon:local_shipping_rounded': '🚚',
  'icon:person_rounded': '👶',
  'icon:pets_rounded': '🐶',
  'icon:local_laundry_service_rounded': '🧺',
  'icon:computer_rounded': '💻',
  'icon:face_rounded': '👗',
  'icon:school_rounded': '📚',
  'icon:favorite_rounded': '🏥',
  'icon:medical_services_rounded': '🩺',
  'icon:accessibility_new_rounded': '🦴',
  'icon:biotech_rounded': '🧪',
  'icon:local_hospital_rounded': '💉',
  'icon:emergency_rounded': '🚑',
  'icon:more_horiz_rounded': '📦',
};

const HEALTHCARE_PROFESSION_ALIASES: Record<string, string> = {
  nurse: 'Nursing Care',
  'lab technician': 'Lab Sample Collection',
  'ambulance booking': 'Ambulance Booking',
};

const EDUCATION_PROFESSION_ROOTS: Record<string, string> = {
  'home tutor': 'Home Tutor',
  'music teacher': 'Music Teacher',
  'dance teacher': 'Dance Teacher',
  'yoga trainer': 'Yoga Trainer',
  'gym trainer': 'Gym Trainer',
  'language tutor': 'Language Tutor',
};

const PERSONAL_SERVICE_PATHS: Record<string, string[]> = {
  'barber & saloon service': ['Personal Services', 'Barber & Saloon Service'],
  'salon spa & others (female)': ['Personal Services', 'Salon Spa & Others (Female)'],
  'massage therapist': ['Personal Services'],
};

const TRADE_PROFESSIONS = new Set([
  'electrician',
  'plumber',
  'carpenter',
  'painter',
  'mason (raj mistri)',
  'welder',
  'handyman',
  'door repair',
  'window repair',
  'furniture repair',
]);

export function resolveNodeIcon(node: CatalogNode): string {
  const fromImage = node.image || '';
  if (fromImage.startsWith('icon:')) {
    return MATERIAL_ICON_EMOJI[fromImage] || '📁';
  }
  return leadingEmoji(node.libelle || '') || '📁';
}

export function findNodeByPath(nodes: CatalogNode[], path: string[]): CatalogNode | null {
  if (!path.length || !nodes.length) return null;

  const [head, ...rest] = path;
  const target = normalizeLabel(head);

  const direct = nodes.find((node) => normalizeLabel(node.libelle) === target);
  if (!direct) return null;
  if (!rest.length) return direct;

  return findNodeByPath(direct.children || [], rest);
}

function findNodeByLabel(nodes: CatalogNode[], label: string): CatalogNode | null {
  const target = normalizeLabel(label);
  for (const node of nodes) {
    if (normalizeLabel(node.libelle) === target) return node;
    if (node.children?.length) {
      const found = findNodeByLabel(node.children, label);
      if (found) return found;
    }
  }
  return null;
}

function narrowTradeGroup(group: CatalogNode, professionLabel: string): CatalogNode {
  const target = normalizeLabel(professionLabel);
  const matchingChild = (group.children || []).find(
    (child) => normalizeLabel(child.libelle) === target
  );

  if (matchingChild) {
    return matchingChild;
  }

  return group;
}

function autoResolveCatalogPath(catalog: CatalogNode[], professionLabel: string): string[] | null {
  const key = normalizeLabel(professionLabel);

  const healthcareChild = HEALTHCARE_PROFESSION_ALIASES[key] || professionLabel;
  const healthcare = catalog.find((node) => normalizeLabel(node.libelle) === 'healthcare services');
  if (healthcare) {
    const child = healthcare.children?.find(
      (node) => normalizeLabel(node.libelle) === normalizeLabel(healthcareChild)
    );
    if (child) return ['Healthcare Services', child.libelle];
  }

  const educationRoot = EDUCATION_PROFESSION_ROOTS[key];
  if (educationRoot) {
    if (educationRoot === 'Home Tutor') {
      return ['Education Services', 'Home Tutor'];
    }
    const education = findNodeByPath(catalog, ['Education Services']);
    const child = education?.children?.find(
      (node) => normalizeLabel(node.libelle) === normalizeLabel(educationRoot)
    );
    if (child) return ['Education Services', child.libelle];
  }

  for (const root of catalog) {
    const directChild = root.children?.find((child) => normalizeLabel(child.libelle) === key);
    if (!directChild) continue;

    if (directChild.children?.length) {
      return [root.libelle, directChild.libelle];
    }

    return [root.libelle];
  }

  const nested = findNodeByLabel(catalog, professionLabel);
  if (nested?.children?.length) {
    return [nested.libelle];
  }

  return null;
}

export function resolveSkillCatalogForProfession(
  catalog: CatalogNode[],
  professionLabel: string
): CatalogNode[] {
  if (!catalog.length || !professionLabel) return [];

  const key = normalizeLabel(professionLabel);
  const personalPath = PERSONAL_SERVICE_PATHS[key];
  const path = personalPath || autoResolveCatalogPath(catalog, professionLabel);

  if (path) {
    const branch = findNodeByPath(catalog, path);
    if (branch) {
      if (TRADE_PROFESSIONS.has(key) && path.length === 1) {
        return [narrowTradeGroup(branch, professionLabel)];
      }
      return [branch];
    }
  }

  if (key === 'massage therapist') {
    const personal = findNodeByPath(catalog, ['Personal Services']);
    const salon = personal?.children?.find((child) =>
      normalizeLabel(child.libelle).includes('salon spa')
    );
    const massageGroup = salon?.children?.find(
      (child) => normalizeLabel(child.libelle) === 'massage & spa'
    );
    if (massageGroup) {
      return [{ ...massageGroup, libelle: 'Massage & Spa Services' }];
    }
  }

  const directRoot = catalog.find((node) => normalizeLabel(node.libelle) === key);
  if (directRoot) return [directRoot];

  const anywhere = findNodeByLabel(catalog, professionLabel);
  if (anywhere) return [anywhere];

  return [];
}

export function getProfessionSkillHeading(professionLabel: string): { title: string; hint: string } {
  const key = normalizeLabel(professionLabel);

  if (key === 'doctor home visit') {
    return {
      title: 'Doctor Skills & Services',
      hint: 'Select the consultations and home-visit services you provide as a doctor.',
    };
  }
  if (key === 'physiotherapist') {
    return {
      title: 'Physiotherapy Skills',
      hint: 'Choose therapy types and rehabilitation services you offer at home.',
    };
  }
  if (['nurse', 'nursing care'].includes(key)) {
    return {
      title: 'Nursing Care Skills',
      hint: 'Select nursing services you provide, then add your price (₹) for each on the right.',
    };
  }
  if (key === 'lab technician') {
    return {
      title: 'Lab & Sample Collection',
      hint: 'Select tests or packages you offer, then add your price (₹) for each on the right.',
    };
  }
  if (key === 'home tutor') {
    return {
      title: 'Tutoring Skills',
      hint: 'Select subjects or classes you teach, then add your price (₹) for each service on the right.',
    };
  }
  if (['music teacher', 'dance teacher', 'yoga trainer', 'gym trainer', 'language tutor'].includes(key)) {
    return {
      title: 'Service Skills',
      hint: 'Select the services you offer, then add your price (₹) for each on the right.',
    };
  }
  if (['barber & saloon service', 'salon spa & others (female)', 'massage therapist'].includes(key)) {
    return {
      title: 'Service Skills',
      hint: 'Select the beauty, salon, or massage services you provide.',
    };
  }

  return {
    title: 'Select Your Skills',
    hint: 'Choose the specific services you can provide under your profession.',
  };
}

export function isHealthcareProfession(professionLabel: string): boolean {
  const key = normalizeLabel(professionLabel);
  return [
    'doctor home visit',
    'physiotherapist',
    'nurse',
    'nursing care',
    'lab technician',
    'ambulance booking',
  ].includes(key);
}

export function isPackagePricingProfession(professionLabel: string): boolean {
  const key = normalizeLabel(professionLabel);
  return ['doctor home visit', 'physiotherapist'].includes(key);
}

const EDUCATION_PROFESSIONS = [
  'home tutor',
  'music teacher',
  'dance teacher',
  'yoga trainer',
  'gym trainer',
  'language tutor',
];

const INLINE_SKILL_PRICING_PROFESSIONS = new Set<string>([
  'lab technician',
  'nurse',
  'nursing care',
  ...EDUCATION_PROFESSIONS,
]);

export function isEducationProfession(professionLabel: string): boolean {
  return EDUCATION_PROFESSIONS.includes(normalizeLabel(professionLabel));
}

/** Lab, nursing, and education: price each selected skill inline in step 1. */
export function usesInlineSkillPricing(professionLabel: string): boolean {
  return INLINE_SKILL_PRICING_PROFESSIONS.has(normalizeLabel(professionLabel));
}

export function formatAdminCommission(commission?: { value?: string | number; type?: string } | null): string {
  if (!commission?.value && commission?.value !== 0) return '';
  const value = String(commission.value);
  const type = (commission.type || '').toLowerCase();
  if (type === 'percentage' || type.includes('percent')) {
    return `${value}%`;
  }
  return `₹${value} flat`;
}

export function collectLeafSkillNodes(nodes: CatalogNode[]): CatalogNode[] {
  const leaves: CatalogNode[] = [];
  const walk = (list: CatalogNode[]) => {
    list.forEach((node) => {
      const hasChildren = node.children && node.children.length > 0;
      if (!hasChildren && !node.has_children) {
        leaves.push(node);
      } else if (node.children?.length) {
        walk(node.children);
      }
    });
  };
  walk(nodes);
  return leaves;
}

export const PACKAGE_GROUP_LABELS = [
  'Nursing Packages',
  'Health Packages',
  'Home Physiotherapy Packages',
];

export function getDefaultExpandedIds(nodes: CatalogNode[]): Record<number, boolean> {
  const expanded: Record<number, boolean> = {};
  const walk = (list: CatalogNode[], depth: number) => {
    list.forEach((node) => {
      if (node.children?.length && depth < 2) {
        expanded[node.id] = true;
        walk(node.children, depth + 1);
      }
    });
  };
  walk(nodes, 0);
  return expanded;
}
