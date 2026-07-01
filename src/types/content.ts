export interface Teacher {
  name: string;
  photo: string;
  role: string;
  tags: string[];
  bullets: string[];
}

export interface Module {
  num: string;
  title: string;
  desc: string;
  duration: string;
  topics: string[];
}

export interface FAQ {
  q: string;
  a: string;
}

export interface AnalysisModel {
  num: string;
  title: string;
  question: string;
  desc: string;
  type: 'radar' | 'chain';
  labels: string[];
  loop?: boolean;
}

export type FeatureIconName =
  | 'briefcase'
  | 'stethoscope'
  | 'barchart'
  | 'network'
  | 'clipboard'
  | 'building'
  | 'users'
  | 'hospital'
  | 'calendar'
  | 'users2'
  | 'crown'
  | 'settings'
  | 'layers'
  | 'database'
  | 'message'
  | 'clock'
  | 'user-check'
  | 'plan'
  | 'languages'
  | 'book';

export interface FeatureCard {
  num: string;
  icon: FeatureIconName;
  title: string;
  desc: string;
}

export interface PerspectiveCard extends FeatureCard {
  span: string;
  dark: boolean;
  role?: string | null;
}

export interface LearningFormatCard extends FeatureCard {
  chips: string[];
}

export interface MetricCard {
  num: string;
  category: string;
  metric: string;
  desc: string;
}

export interface AudienceCard {
  num: string;
  title: string;
  desc: string;
  tags: string[];
}

export interface OutcomeCard {
  span: string;
  icon: FeatureIconName;
  title: string;
  lead?: string;
  bullets?: string[];
  tags?: string[];
  flow?: string[];
}

export interface NavLink {
  href: string;
  label: string;
}

export interface StatItem {
  metric: string;
  label: string;
}
