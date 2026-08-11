declare const __DEV__: boolean | undefined;

type PublicEnv = {
  EXPO_PUBLIC_DEMO_LOGIN?: string;
  EXPO_PUBLIC_DEMO_ADMIN_EMAIL?: string;
  EXPO_PUBLIC_DEMO_ADMIN_PASSWORD?: string;
  EXPO_PUBLIC_DEMO_CUSTOMER_PHONE?: string;
  EXPO_PUBLIC_DEMO_CUSTOMER_OTP?: string;
};

declare const process: {
  env: PublicEnv;
};

const isDevelopment = typeof __DEV__ !== 'undefined' && __DEV__;
const isExplicitDemoMode = process.env.EXPO_PUBLIC_DEMO_LOGIN === 'true';

export const isDemoLoginEnabled = isDevelopment || isExplicitDemoMode;

export const adminDemoCredentials = {
  email: process.env.EXPO_PUBLIC_DEMO_ADMIN_EMAIL ?? 'admin@demo.isp',
  password: process.env.EXPO_PUBLIC_DEMO_ADMIN_PASSWORD ?? 'admin123',
};

export const customerDemoCredentials = {
  phone: process.env.EXPO_PUBLIC_DEMO_CUSTOMER_PHONE ?? '01877104723',
  otp: process.env.EXPO_PUBLIC_DEMO_CUSTOMER_OTP ?? '123456',
};
