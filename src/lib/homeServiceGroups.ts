export type HomeServiceGroup = {
  group: string;
  emoji: string;
  professions: string[];
};

export const HOME_SERVICE_GROUPS: HomeServiceGroup[] = [
  { group: 'Repair & Maintenance', emoji: '🔧', professions: ['Electrician', 'Plumber', 'Carpenter', 'Painter', 'Mason (Raj Mistri)', 'Welder', 'Handyman', 'Door Repair', 'Window Repair', 'Furniture Repair'] },
  { group: 'AC & Appliances', emoji: '❄️', professions: ['AC Installation', 'AC Repair', 'AC Gas Filling', 'Refrigerator Repair', 'Washing Machine Repair', 'Microwave Repair', 'Water Purifier (RO) Service', 'Geyser Repair', 'Chimney Service', 'Dishwasher Repair', 'TV Repair', 'Fan Repair', 'Cooler Repair', 'Inverter Repair', 'Generator Repair'] },
  { group: 'Cleaning Services', emoji: '🧹', professions: ['Home Cleaning', 'Deep Cleaning', 'Bathroom Cleaning', 'Kitchen Cleaning', 'Sofa Cleaning', 'Carpet Cleaning', 'Mattress Cleaning', 'Water Tank Cleaning', 'Floor Cleaning', 'Glass Cleaning', 'Office Cleaning'] },
  { group: 'Interior & Renovation', emoji: '🏡', professions: ['Interior Designer', 'Modular Kitchen', 'False Ceiling', 'Flooring Work', 'Wallpaper Installation', 'Tile Installation', 'POP Work', 'Curtain Installation', 'Furniture Installation'] },
  { group: 'Outdoor Services', emoji: '🌿', professions: ['Gardening', 'Lawn Maintenance', 'Tree Cutting', 'Plant Care', 'Landscape Design'] },
  { group: 'Security & Safety', emoji: '🔒', professions: ['CCTV Installation', 'CCTV Repair', 'Smart Lock Installation', 'Security Guard', 'Fire Safety Equipment', 'Video Door Phone Installation'] },
  { group: 'Smart Home Services', emoji: '💡', professions: ['Smart Light Installation', 'Home Automation', 'Wi-Fi Setup', 'Network Installation', 'Smart Door Lock Setup'] },
  { group: 'Water Services', emoji: '🚰', professions: ['Borewell Service', 'Water Tank Repair', 'Pipeline Repair', 'Motor Pump Repair', 'Water Leakage Detection'] },
  { group: 'Construction Services', emoji: '🏗️', professions: ['Home Construction', 'House Renovation', 'Civil Contractor', 'Building Repair', 'Roof Repair', 'Waterproofing'] },
  { group: 'Furniture Services', emoji: '🛋️', professions: ['Furniture Assembly', 'Furniture Shifting', 'Office Furniture Setup', 'Bed Installation', 'Wardrobe Installation'] },
  { group: 'Pest Control', emoji: '🦟', professions: ['Termite Control', 'Cockroach Control', 'Mosquito Control', 'Rodent Control', 'General Pest Control'] },
  { group: 'Shifting Services', emoji: '🚚', professions: ['House Shifting', 'Office Shifting', 'Packers & Movers', 'Local Moving', 'Interstate Moving'] },
  { group: 'Personal Home Assistance', emoji: '👶', professions: ['Maid Service', 'Cook', 'Babysitter', 'Elder Care', 'Patient Care', 'Driver on Demand'] },
  { group: 'Pet Services', emoji: '🐶', professions: ['Pet Grooming', 'Pet Walking', 'Pet Boarding', 'Veterinary Visit'] },
  { group: 'Laundry & Textile', emoji: '🧺', professions: ['Laundry Pickup', 'Dry Cleaning', 'Ironing Service', 'Shoe Cleaning', 'Curtain Washing'] },
  { group: 'Technology Services', emoji: '💻', professions: ['Laptop Repair', 'Computer Repair', 'Printer Repair', 'Wi-Fi Installation', 'Smart Home Installation', 'TV Wall Mount Installation'] },
  { group: 'Personal Services', emoji: '👗', professions: ['Barber & Saloon Service', 'Salon Spa & Others (Female)', 'Massage Therapist'] },
  { group: 'Education Services', emoji: '📚', professions: ['Home Tutor', 'Music Teacher', 'Dance Teacher', 'Yoga Trainer', 'Gym Trainer', 'Language Tutor'] },
  { group: 'Healthcare Services', emoji: '🏥', professions: ['Doctor Home Visit', 'Physiotherapist', 'Nurse', 'Lab Technician', 'Ambulance Booking'] },
  { group: 'Miscellaneous', emoji: '📦', professions: ['Scrap Collection', 'Water Can Delivery', 'Gas Cylinder Delivery', 'Home Decoration', 'Event Decoration', 'Festival Decoration', 'Tent & Furniture Rental', 'Home Inspection'] },
];
